
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { ResumeData, ResumeSettings } from '../types';

export async function generateDocx(data: ResumeData, settings: ResumeSettings) {
  const { personalInfo, experience, education, skills, projects, customSections } = data;
  const { colors } = settings;

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Name
        new Paragraph({
          children: [
            new TextRun({
              text: personalInfo.fullName.toUpperCase(),
              bold: true,
              size: 48,
              color: colors.name.replace('#', ''),
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        // Contact Info
        new Paragraph({
          children: [
            new TextRun({
              text: [
                personalInfo.location,
                personalInfo.phone,
                personalInfo.email,
                personalInfo.linkedin ? `linkedin.com/in/${personalInfo.linkedin}` : null,
              ].filter(Boolean).join('  •  '),
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Summary
        ...(personalInfo.summary ? [
          new Paragraph({
            children: [
              new TextRun({
                text: personalInfo.summary,
                size: 22,
                italics: true,
              }),
            ],
            spacing: { after: 300 },
          })
        ] : []),

        // Experience
        new Paragraph({
          text: "PROFESSIONAL EXPERIENCE",
          heading: HeadingLevel.HEADING_2,
          border: {
            bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 }
          },
          spacing: { before: 200, after: 200 },
        }),
        ...experience.flatMap(exp => [
          new Paragraph({
            children: [
              new TextRun({ text: exp.position, bold: true }),
              new TextRun({ text: `\t${exp.company}`, bold: true }),
              new TextRun({ text: `\t${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}`, bold: true }),
            ],
            tabStops: [
              { type: AlignmentType.CENTER, position: 4535 },
              { type: AlignmentType.RIGHT, position: 9071 },
            ],
          }),
          ...exp.highlights.map(h => new Paragraph({
            text: h,
            bullet: { level: 0 },
            spacing: { before: 50, after: 50 },
          }))
        ]),

        // Education
        new Paragraph({
          text: "EDUCATION",
          heading: HeadingLevel.HEADING_2,
          border: {
            bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 }
          },
          spacing: { before: 400, after: 200 },
        }),
        ...education.flatMap(edu => [
          new Paragraph({
            children: [
              new TextRun({ text: `${edu.degree} in ${edu.field}`, bold: true }),
              new TextRun({ text: `\t${edu.school}`, bold: true }),
              new TextRun({ text: `\t${edu.startDate} – ${edu.current ? 'Present' : edu.endDate}`, bold: true }),
            ],
            tabStops: [
              { type: AlignmentType.CENTER, position: 4535 },
              { type: AlignmentType.RIGHT, position: 9071 },
            ],
          })
        ]),

        // Skills
        new Paragraph({
          text: "TECHNICAL SKILLS",
          heading: HeadingLevel.HEADING_2,
          border: {
            bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 }
          },
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          text: skills.map(s => s.name).join(', '),
          spacing: { after: 200 },
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.docx`);
}
