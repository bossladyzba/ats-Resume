import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ResumeData, ATSResult } from '../types';
import { analyzeATSCompatibility } from '../services/geminiService';
import { cn } from '../lib/utils';

interface AIPanelProps {
  resumeData: ResumeData;
  jobDescription: string;
}

export default function AIPanel({ resumeData, jobDescription }: AIPanelProps) {
  const [result, setResult] = useState<ATSResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only auto-trigger if we don't have a result yet or if it's been explicitly cleared
    const timer = setTimeout(() => {
      if (!isLoading && !result) {
        handleAnalyze();
      }
    }, 5000); 
    return () => clearTimeout(timer);
  }, [resumeData, jobDescription]);

  const handleAnalyze = async () => {
    if (!resumeData.personalInfo.fullName || isLoading) return;
    setIsLoading(true);
    try {
      const analysis = await analyzeATSCompatibility(resumeData, jobDescription);
      setResult(analysis);
    } catch (err) {
      console.error("Analysis Failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[280px] h-full bg-white border-l border-[#E5E5E7] p-6 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
      <div className="score-widget p-5 bg-[#F5F5F7] rounded-[16px] text-center">
        <div className="score-circle w-20 h-20 rounded-full border-[6px] border-[#28CD41] flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-bold">{result?.score || 0}</span>
        </div>
        <h3 className="text-[13px] font-semibold text-[#1D1D1F] mb-1">ATS Optimization Score</h3>
        <p className="text-[11px] text-[#86868B] mb-4">
          {result?.score && result.score > 80 ? 'High compatibility for your targeted role.' : 'Recommended fixes to improve parsing.'}
        </p>
        <button 
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-900 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Run Analysis</span>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="w-8 h-8 text-[#0071E3] animate-spin" />
        </div>
      )}

      {result && !isLoading && (
        <div className="space-y-6">
          <div>
            <div className="nav-group-label mb-2">Analysis Results</div>
            <div className="flex flex-wrap gap-1.5">
              <span className="keyword-tag bg-[#E8E8ED] text-[10px] px-2 py-1 rounded-md font-medium">Keywords: {result.keywordMatch}%</span>
              <span className="keyword-tag bg-[#FFE5E5] text-[#D70015] text-[10px] px-2 py-1 rounded-md font-medium">Missing: 3 Items</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="nav-group-label">Smart Suggestions</div>
            {result.suggestions.map((suggestion) => (
              <div 
                key={suggestion.id}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  suggestion.type === 'critical' ? "bg-[#F2F2F7] border-[#E5E5E7]" : "bg-[#F2F9FF] border-[#D0E7FF]"
                )}
              >
                <div className={cn(
                  "text-[9px] font-bold uppercase tracking-wider mb-1",
                  suggestion.type === 'critical' ? "text-gray-500" : "text-[#0071E3]"
                )}>
                  {suggestion.type === 'critical' ? 'Formatting Alert' : 'Bullet Optimizer'}
                </div>
                <p className="text-[12px] leading-relaxed text-[#1D1D1F]">
                  {suggestion.message}
                </p>
                {suggestion.action && (
                  <button className="w-full mt-2.5 px-3 py-1.5 bg-[#0071E3] text-white rounded-md text-[11px] font-semibold hover:bg-[#0077ED] transition-all">
                    {suggestion.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
