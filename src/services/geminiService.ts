
import { Type } from "@google/genai";
import { ResumeData, Skill, Experience, Education, ATSResult } from "../types";
import mammoth from "mammoth";

/**
 * Robust calling wrapper with retries to handle transient RPC and Rate Limit errors
 */
async function callGemini(params: any, retries = 7, delay = 3000): Promise<{ text: string }> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw { status: response.status, message: errorData.error || response.statusText };
      }

      return await response.json();
    } catch (error: any) {
      const errorStr = JSON.stringify(error).toLowerCase();
      const errorMessage = (error?.message || '').toLowerCase();
      
      const isRateLimit = errorMessage.includes('429') || 
                          errorMessage.includes('resource_exhausted') ||
                          errorStr.includes('429') ||
                          errorStr.includes('resource_exhausted');
                           
      const isTransient = errorMessage.includes('500') || 
                          errorMessage.includes('rpc failed') ||
                          errorMessage.includes('xhr error') ||
                          errorMessage.includes('deadline exceeded') ||
                          errorStr.includes('500') ||
                          errorStr.includes('unavailable');
      
      if ((isTransient || isRateLimit) && i < retries - 1) {
        const backoffFactor = isRateLimit ? 3.5 : 2;
        const waitTime = delay * Math.pow(backoffFactor, i) + (Math.random() * 1500);
        
        console.warn(`Gemini API ${isRateLimit ? 'Rate Limit' : 'Transient Error'} (retry ${i + 1}/${retries}), waiting ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to call Gemini after multiple retries.");
}

const RESUME_SCHEMA: any = {
  type: Type.OBJECT,
  properties: {
    personalInfo: {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        location: { type: Type.STRING },
        summary: { type: Type.STRING },
        linkedin: { type: Type.STRING },
        website: { type: Type.STRING }
      }
    },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          position: { type: Type.STRING },
          location: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          current: { type: Type.BOOLEAN },
          highlights: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }
          }
        }
      }
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          school: { type: Type.STRING },
          degree: { type: Type.STRING },
          field: { type: Type.STRING },
          location: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          current: { type: Type.BOOLEAN }
        }
      }
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING }
        }
      }
    }
  }
};

const SYSTEM_PARSING_INSTRUCTION = `
  You are an expert resume parsing engine. 
  Your task is to extract information from the provided data and map it to a standardized JSON schema.
  
  CRITICAL RULES:
  1. DO NOT REWRITE or summarize any content.
  2. Extract text EXACTLY as written in the original document.
  3. Clean up formatting (remove bullet characters, extra whitespace) but preserve original phrasing.
  4. Accuracy is the highest priority.
  5. If a field is missing, leave it as an empty string or null.
`;

export async function parseResumePipeline(file: File): Promise<Partial<ResumeData>> {
  const mimeType = file.type;
  const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith('.docx');
  const isPdf = mimeType === "application/pdf" || file.name.endsWith('.pdf');
  const isImage = mimeType.startsWith('image/');

  try {
    if (isDocx) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return await extractFromText(result.value);
    }

    if (isPdf || isImage) {
      const base64 = await fileToBase64(file);
      return await extractFromMultimodal(base64, isPdf ? "application/pdf" : mimeType);
    }

    // Fallback: Default text parsing
    const text = await file.text();
    return await extractFromText(text);

  } catch (err) {
    console.error("Pipeline Parsing Error:", err);
    return {};
  }
}

async function extractFromText(text: string): Promise<Partial<ResumeData>> {
  const response = await callGemini({
    model: "gemini-3.1-pro-preview",
    contents: `Extract structure from this resume text:\n\n${text}`,
    config: {
      systemInstruction: SYSTEM_PARSING_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESUME_SCHEMA
    }
  });

  return JSON.parse(response.text || "{}");
}

async function extractFromMultimodal(base64: string, mimeType: string): Promise<Partial<ResumeData>> {
  const response = await callGemini({
    model: "gemini-3.1-pro-preview",
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: "Extract structure from this resume document." }
      ]
    },
    config: {
      systemInstruction: SYSTEM_PARSING_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESUME_SCHEMA
    }
  });

  return JSON.parse(response.text || "{}");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Deprecated in favor of pipeline, but kept for compatibility if needed
export async function parseResumeFromImage(base64Data: string, mimeType: string): Promise<Partial<ResumeData>> {
  return await extractFromMultimodal(base64Data, mimeType);
}

export async function rewriteBulletPoint(bullet: string, jobDescription?: string): Promise<string> {
  const prompt = `
    Rewrite the following resume bullet point to be ATS-friendly.
    - Start with a strong action verb
    - Add measurable results if possible (quantify achievements)
    - Keep it concise (1-2 lines)
    ${jobDescription ? `- Align with this job description: ${jobDescription}` : ""}
    Original bullet: "${bullet}"
    Return only the rewritten string.
  `;

  try {
    const response = await callGemini({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || bullet;
  } catch (error) {
    console.error("Gemini Rewrite Error:", error);
    return bullet;
  }
}

export async function generateCoverLetter(resumeData: ResumeData, jobDescription: string): Promise<string> {
  const prompt = `
    Generate a professional, tailored cover letter based on the following:
    Resume Data: ${JSON.stringify(resumeData)}
    Job Description: ${jobDescription}

    Guidelines:
    - professional tone, highlight achievements matching JD, 300-400 words.
    
    Return ONLY the plain text of the cover letter.
  `;

  try {
    const response = await callGemini({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || "Failed to generate cover letter.";
  } catch (error) {
    console.error("Gemini Cover Letter Error:", error);
    return "Error generating cover letter. Please try again.";
  }
}

export async function analyzeATSCompatibility(resumeData: ResumeData, jobDescription?: string): Promise<ATSResult> {
  const prompt = `
    Analyze this resume for ATS compatibility.
    Resume Data: ${JSON.stringify(resumeData)}
    ${jobDescription ? `Target Job Description: ${jobDescription}` : "General Analysis"}
  `;

  try {
    const response = await callGemini({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            keywordMatch: { type: Type.NUMBER },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { 
                    type: Type.STRING,
                    description: "One of: critical, improvement, good" 
                  },
                  message: { type: Type.STRING },
                  action: { type: Type.STRING }
                },
                required: ["id", "type", "message"]
              }
            }
          },
          required: ["score", "keywordMatch", "suggestions"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error (Final):", error);
    return { score: 0, keywordMatch: 0, suggestions: [] };
  }
}

export async function optimizeResume(data: ResumeData, jobDescription: string): Promise<ResumeData> {
  const prompt = `
    You are an expert ATS-resume writer. Tailor the following resume data to perfectly match this job description.
    Job Description: ${jobDescription}
    Resume Data: ${JSON.stringify(data)}
    Return the optimized ResumeData JSON object.
  `;

  try {
    const response = await callGemini({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const optimizedBlob = JSON.parse(response.text || "{}");
    // Ensure IDs are preserved if possible or regenerated if missing
    return {
      ...data,
      ...optimizedBlob,
      experience: (optimizedBlob.experience || data.experience || []).map((exp: any, i: number) => ({
        ...exp,
        id: data.experience?.[i]?.id || crypto.randomUUID()
      })),
      education: (optimizedBlob.education || data.education || []).map((edu: any, i: number) => ({
        ...edu,
        id: data.education?.[i]?.id || crypto.randomUUID()
      })),
      skills: (optimizedBlob.skills || data.skills || []).map((s: any, i: number) => ({
        ...s,
        id: (typeof s === 'object' ? s.id : null) || crypto.randomUUID(),
        name: typeof s === 'object' ? s.name : String(s)
      }))
    };
  } catch (error) {
    console.error("Gemini Optimization Error:", error);
    return data;
  }
}
