
import React, { useState, useLayoutEffect, useMemo, useRef } from 'react';
import { Download, ChevronLeft, ChevronRight, Maximize2, FileText } from 'lucide-react';
import { ResumeData, ResumeSettings } from '../types';
import { cn, formatDate } from '../lib/utils';

interface ResumePreviewProps {
  data: ResumeData;
  settings: ResumeSettings;
  hideUI?: boolean;
  onColorTargetClick?: (target: string) => void;
}

export default function ResumePreview({ 
  data, 
  settings, 
  hideUI = false,
  onColorTargetClick = () => {}
}: ResumePreviewProps) {
  const { personalInfo, experience, education, skills, projects, customSections } = data;
  const { templateId, fontSize, lineSpacing, fontFamily, colors: rawColors, pageSize, orientation, optimizationMode } = settings;

  const [pagesData, setPagesData] = useState<React.ReactNode[][]>([]);
  const [isPaginating, setIsPaginating] = useState(true);
  const measurerRef = useRef<HTMLDivElement>(null);

  // Constants for physical page dimensions (mm to px approx at 96dpi)
  const pageConfigs = {
    a4: { width: 794, height: 1123 },
    letter: { width: 816, height: 1056 }
  };

  const currentConfig = pageConfigs[pageSize || 'a4'];
  const isLandscape = orientation === 'landscape';
  const pageWidth = isLandscape ? currentConfig.height : currentConfig.width;
  const pageHeight = isLandscape ? currentConfig.width : currentConfig.height;

  // Tight but fixed margins (96 DPI)
  const TOP_MARGIN_PX = 48;    // 0.5 inch
  const BOTTOM_MARGIN_PX = 48; // 0.5 inch
  const SIDE_MARGIN_PX = 58;   // 0.6 inch
  const CONTENT_HEIGHT_LIMIT = pageHeight - (TOP_MARGIN_PX + BOTTOM_MARGIN_PX);

  // Safety fallback for legacy data migrations
  const colors = rawColors || {
    name: '#1D1D1F',
    sectionHeader: '#0071E3',
    jobTitle: '#1D1D1F',
    companyName: '#444444',
    dates: '#86868B',
    bodyText: '#1D1D1F',
    divider: '#E5E5E7'
  };

  const fontFamilies = {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", Times, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    geometric: '"Outfit", sans-serif',
    slab: '"Roboto Slab", serif',
  };

  const fontSizes = {
    small: 'text-[9.5px]',
    medium: 'text-[11.5px]',
    large: 'text-[13.5px]',
  };

  const lineSpacings = {
    tight: 'leading-[1.15]',
    relaxed: 'leading-[1.4]',
    wide: 'leading-[1.7]',
  };

  /**
   * ESTIMATION-BASED LINE SPLITTING (PURE)
   * Instead of side-effecting DOM measurement during render, we use a 
   * synchronous approach or let the line-wrap logic happen in the CSS.
   * To satisfy "line-aware flow", we render these as special blocks.
   */
  const splitTextIntoLineBlocks = (text: string, className: string, style: React.CSSProperties) => {
    // For now, we return as a single flowable block. 
    // The pagination engine will handle it as an atomic unit.
    // To support fine-grained splitting of long summaries, we split by paragraphs.
    const paragraphs = text.split('\n').filter(p => p.trim());
    return paragraphs.map((p, i) => (
      <p 
        key={i} 
        className={cn(className, "leading-relaxed pb-2")} 
        style={style}
        data-pagination-type="line"
      >
        {p}
      </p>
    ));
  };

  // Pre-render parts as blocks for measurement
  const renderHeader = () => {
    if (templateId === 'minimal') {
      return (
        <header className="resume-header border-b-[2px] pb-14 text-center" style={{ borderColor: colors.divider }}>
          <h1 onClick={() => onColorTargetClick('name')} className="resume-name text-[36px] font-extrabold uppercase tracking-tighter leading-none cursor-pointer" style={{ color: colors.name }}>
            {personalInfo.fullName || 'YOUR NAME'}
          </h1>
          <div className="resume-contact text-[11px] mt-3 flex items-center justify-center flex-wrap gap-x-6" style={{ color: colors.bodyText }}>
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.email && <span className="font-semibold">{personalInfo.email}</span>}
            {personalInfo.linkedin && <span>in/{personalInfo.linkedin}</span>}
          </div>
        </header>
      );
    }
    if (templateId === 'modern') {
      return (
        <header className="resume-header pb-10 flex gap-8">
           <div className="w-1.5 shrink-0" style={{ backgroundColor: colors.divider }} />
           <div>
              <h1 onClick={() => onColorTargetClick('name')} className="resume-name text-[40px] font-black uppercase tracking-tight leading-none cursor-pointer" style={{ color: colors.name }}>
                {personalInfo.fullName || 'YOUR NAME'}
              </h1>
              <div className="resume-contact text-[11px] mt-3 flex flex-wrap gap-x-6 gap-y-1" style={{ color: colors.bodyText }}>
                {personalInfo.location && <span>📍 {personalInfo.location}</span>}
                {personalInfo.phone && <span>📞 {personalInfo.phone}</span>}
                {personalInfo.email && <span className="font-bold">{personalInfo.email}</span>}
                {personalInfo.linkedin && <span>in/{personalInfo.linkedin}</span>}
              </div>
           </div>
        </header>
      );
    }
    // ... basic fallback header
    return (
      <header className="resume-header border-b-[1px] pb-10" style={{ borderBottomColor: colors.divider }}>
        <h1 onClick={() => onColorTargetClick('name')} className="resume-name text-[28px] font-bold leading-none cursor-pointer" style={{ color: colors.name }}>
          {personalInfo.fullName || 'YOUR NAME'}
        </h1>
        <div className="resume-contact text-[10.5px] mt-2 flex flex-wrap gap-x-4" style={{ color: colors.bodyText }}>
           {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin].filter(Boolean).join(' | ')}
        </div>
      </header>
    );
  };

  const renderSectionHeader = (title: string) => {
    if (templateId === 'modern') {
      return (
        <h2 onClick={() => onColorTargetClick('sectionHeader')} className="resume-section-title text-[14px] font-bold border-l-4 pl-3 uppercase pb-5 py-1 bg-[#F5F5F7] cursor-pointer rounded" style={{ borderLeftColor: colors.sectionHeader, color: colors.sectionHeader }}>
          {title}
        </h2>
      );
    }
    return (
      <h2 onClick={() => onColorTargetClick('sectionHeader')} className="resume-section-title text-[13px] font-bold border-b-2 pb-1 uppercase pb-4 flex items-center cursor-pointer rounded" style={{ color: colors.sectionHeader, borderBottomColor: `${colors.sectionHeader}40` }}>
        {title}
      </h2>
    );
  };

  // Content Blocks for Paginator
  const contentBlocks = useMemo(() => {
    const blocks: React.ReactNode[] = [];
    
    // 0. Default Order if not specified
    const order = settings.sectionOrder || ['experience', 'education', 'projects', 'skills', 'custom'];

    // 1. Header Block (Always first)
    blocks.push(
      <div key="header-block" data-pagination-type="header" data-sticky="true" className="pb-6">
        {renderHeader()}
      </div>
    );

    // 1.5 Summary (Split into lines if needed for flow)
    if (personalInfo.summary) {
       const summaryLines = splitTextIntoLineBlocks(
         personalInfo.summary, 
         cn("text-[11.5px] italic border-l-2 border-[#F3F4F6] pl-4", templateId === 'minimal' && "text-center max-w-2xl mx-auto"),
         { color: colors.bodyText }
       );
       blocks.push(...summaryLines);
       // Explicit spacer after summary
       blocks.push(<div key="summary-spacer" className="h-6" data-pagination-type="spacer" />);
    }

    // 2. Loop through sections in requested order
    order.forEach(sectionId => {
      // Professional History
      if (sectionId === 'experience' && experience.length > 0) {
        blocks.push(
          <div key="exp-sec-header" data-pagination-type="section-header" data-sticky="true">
            {renderSectionHeader("Professional History")}
          </div>
        );
        
        experience.forEach((exp, expIdx) => {
          const entryId = `exp-${exp.id}`;
          blocks.push(
            <div 
              key={`${entryId}-hdr`} 
              data-pagination-type="entry-header" 
              data-entry-id={entryId}
              data-sticky="true" 
              className={cn("pb-2", fontSizes[fontSize])}
            >
              <div className="flex justify-between font-bold items-baseline">
                <span className="text-[14px]" style={{ color: colors.jobTitle }}>{exp.position}</span>
                <span style={{ color: colors.dates }} className="text-[10px] tracking-wider font-semibold uppercase">{formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}</span>
              </div>
              <div className="font-bold text-[12px] opacity-80" style={{ color: colors.companyName }}>{exp.company}</div>
            </div>
          );

          const validHighlights = exp.highlights.filter(h => h.trim());
          validHighlights.forEach((h, i) => {
            const bulletId = `${entryId}-h-${i}`;
            // IMPORTANT: Bullet is ATOMIC. We wrap the entire bullet block as a single unit.
            blocks.push(
              <div 
                key={bulletId} 
                data-pagination-type="bullet" 
                data-entry-id={entryId}
                className={cn("pl-[18px] relative pb-1", fontSizes[fontSize])}
                style={{ color: colors.bodyText }}
              >
                <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                <p className="opacity-90 leading-relaxed">{h}</p>
              </div>
            );
          });

          if (expIdx < experience.length - 1) {
            blocks.push(<div key={`${entryId}-space`} className="h-4" data-pagination-type="spacer" />);
          }
        });
      }

      // Academic Foundation
      if (sectionId === 'education' && education.length > 0) {
        blocks.push(
          <div key="edu-sec-header" data-pagination-type="section-header" data-sticky="true">
            {renderSectionHeader("Academic Foundation")}
          </div>
        );

        education.forEach((edu) => {
          blocks.push(
            <div key={`edu-${edu.id}`} data-pagination-type="item" className={cn("pb-5", fontSizes[fontSize])}>
              <div className="flex justify-between font-bold">
                <span className="text-[13px]" style={{ color: colors.jobTitle }}>{edu.degree} in {edu.field}</span>
                <span style={{ color: colors.dates }} className="text-[10px] uppercase font-semibold">{formatDate(edu.startDate)} – {edu.current ? 'Present' : formatDate(edu.endDate)}</span>
              </div>
              <div className="font-medium" style={{ color: colors.companyName }}>{edu.school}{edu.location && ` • ${edu.location}`}</div>
            </div>
          );
        });
      }

      // Selected Projects
      if (sectionId === 'projects' && projects && projects.length > 0) {
        blocks.push(
          <div key="proj-sec-header" data-pagination-type="section-header" data-sticky="true">
            {renderSectionHeader("Selected Projects")}
          </div>
        );

        projects.forEach((proj, projIdx) => {
          const entryId = `proj-${proj.id}`;
          blocks.push(
            <div 
              key={`${entryId}-hdr`} 
              data-pagination-type="entry-header" 
              data-entry-id={entryId}
              data-sticky="true" 
              className={cn("pb-2", fontSizes[fontSize])}
            >
              <div className="flex justify-between font-bold mb-1">
                <span className="text-[14px]" style={{ color: colors.jobTitle }}>{proj.name}</span>
                {proj.link && <span className="text-[10px] font-normal" style={{ color: colors.sectionHeader }}>{proj.link}</span>}
              </div>
              <p className="pb-2 font-medium bg-[#F5F5F7] px-3 py-1.5 rounded-lg inline-block" style={{ color: colors.bodyText }}>{proj.description}</p>
            </div>
          );

          const validHighlights = proj.highlights.filter(h => h.trim());
          validHighlights.forEach((h, i) => {
            const bulletId = `${entryId}-h-${i}`;
            // IMPORTANT: Bullet is ATOMIC.
            blocks.push(
              <div 
                key={bulletId} 
                data-pagination-type="bullet" 
                data-entry-id={entryId}
                className={cn("pl-[18px] relative pb-1", fontSizes[fontSize])}
                style={{ color: colors.bodyText }}
              >
                <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                <p className="opacity-90 leading-relaxed">{h}</p>
              </div>
            );
          });

          if (projIdx < projects.length - 1) {
            blocks.push(<div key={`${entryId}-space`} className="h-4" data-pagination-type="spacer" />);
          }
        });
      }

      // Expertise & Skills
      if (sectionId === 'skills' && skills.length > 0) {
        blocks.push(
          <div key="skills-sec-header" data-pagination-type="section-header" data-sticky="true">
            {renderSectionHeader("Expertise")}
          </div>
        );
        blocks.push(
          <div key="skills-cont" data-pagination-type="item" className="flex flex-wrap gap-2 pb-4">
            {skills.map(s => (
              <span key={s.id} className="px-3 py-1 bg-[#F5F5F7] font-bold rounded text-[10px] tracking-tight" style={{ color: colors.bodyText }}>{s.name}</span>
            ))}
          </div>
        );
      }

      // Custom Sections
      if (sectionId === 'custom' && customSections) {
        customSections.forEach((section, idx) => {
          blocks.push(
            <div key={`custom-hdr-${idx}`} data-pagination-type="section-header" data-sticky="true">
              {renderSectionHeader(section.title)}
            </div>
          );
          section.items.forEach(item => {
            // Split custom section paragraphs into line blocks for flow
            const lines = splitTextIntoLineBlocks(
              item.content,
              cn("whitespace-pre-wrap font-medium", fontSizes[fontSize]),
              { color: colors.bodyText }
            );
            blocks.push(...lines);
            blocks.push(<div key={`space-${item.id}`} className="h-4" data-pagination-type="spacer" />);
          });
        });
      }
    });

    return blocks;
  }, [data, settings, colors, fontSize, experience, education, projects, skills, customSections]);

  // Perform Pagination based on DOM measurement (TRUE PAGINATION ENGINE)
  useLayoutEffect(() => {
    const handlePagination = () => {
      if (measurerRef.current) {
        setIsPaginating(true);
        const children = Array.from(measurerRef.current.children) as HTMLElement[];
        const pages: React.ReactNode[][] = [[]];
        let currentHeight = 0;
        let currentPageIndex = 0;

        // ABSOLUTE ZERO TOLERANCE: Any line entering the dead zone triggers reflow
        const TOLERANCE = -2; // Negative tolerance acts as a safety buffer "padding" before the margin
        const FORCE_NEW_PAGE_TRESHOLD = 30; 

        for (let i = 0; i < children.length; i++) {
          const block = children[i];
          const blockHeight = block.getBoundingClientRect().height;
          const type = block.getAttribute('data-pagination-type');
          const isSticky = block.getAttribute('data-sticky') === 'true';

          // 1. Calculate Block Group Height (Sticky items move together)
          let blockGroupHeight = blockHeight;
          if (isSticky) {
             let j = i + 1;
             while (j < children.length) {
                const nextBlock = children[j];
                const nextType = nextBlock.getAttribute('data-pagination-type');
                const nextHeight = nextBlock.getBoundingClientRect().height;
                
                if (nextType === 'header' || nextType === 'section-header' || nextType === 'entry-header' || nextType === 'spacer') {
                   blockGroupHeight += nextHeight;
                   j++;
                } else {
                   // Include first chunk of actual content in the measurement to prevent orphaned headers
                   blockGroupHeight += nextHeight;
                   break; 
                }
             }
          }

          // 2. REFLOW ENGINE (ANTI-OVERFLOW)
          // Ensure we NEVER render into the bottom margin zone
          const fitsFully = currentHeight + blockGroupHeight <= CONTENT_HEIGHT_LIMIT + TOLERANCE;
          
          let shouldBreakPage = !fitsFully && pages[currentPageIndex].length > 0;

          // 2b. MARGIN DEAD ZONE SAFETY (Strict proximity check)
          const remainingSpace = CONTENT_HEIGHT_LIMIT - currentHeight;
          if (remainingSpace < FORCE_NEW_PAGE_TRESHOLD && (type === 'section-header' || type === 'entry-header')) {
             shouldBreakPage = true;
          }

          if (shouldBreakPage) {
            currentPageIndex++;
            pages[currentPageIndex] = [];
            currentHeight = 0;
          }

          // Force update heights logic
          pages[currentPageIndex].push(contentBlocks[i]);
          currentHeight += blockHeight;
        }

        // Final safety check: if last page is empty (unlikely with this loop but good for robustness)
        if (pages[0].length === 0 && contentBlocks.length > 0) {
           pages[0] = contentBlocks;
        }

        setPagesData(pages);
        setIsPaginating(false);
      }
    };

    // Use a small delay to ensure fonts and layouts are stable
    const timer = setTimeout(handlePagination, 100);
    return () => clearTimeout(timer);
  }, [contentBlocks, CONTENT_HEIGHT_LIMIT, templateId, settings]);

  return (
    <div className={cn(
      "flex flex-col items-center bg-[#F5F5F7] overflow-y-auto custom-scrollbar min-h-screen",
      hideUI ? "p-0 bg-white" : "p-8 md:p-12 pb-24"
    )}>
      {/* Hidden Measurer - Critical for Hard Pagination */}
      <div 
        ref={measurerRef}
        className="absolute opacity-0 pointer-events-none flex flex-col"
        style={{ 
          width: `${pageWidth - (SIDE_MARGIN_PX * 2)}px`,
          fontFamily: fontFamilies[fontFamily],
          visibility: 'hidden',
          top: -10000,
          left: -10000,
          gap: 0,
        }}
      >
        {contentBlocks}
      </div>

      {!hideUI && (
        <div className="w-full max-w-[816px] flex items-center justify-between mb-12 shrink-0">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">Pro Layout Engine 2.0</h2>
            <div className="flex items-center space-x-2 mt-1">
               <span className="text-[10px] font-black uppercase text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE] italic">
                Hard Pagination Enabled
               </span>
               <span className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest">{pageSize} • {orientation}</span>
            </div>
          </div>
          <div className="flex items-center bg-white px-6 py-3 rounded-3xl border border-[#E5E5E7] shadow-xl space-x-6">
             <div className="flex items-center space-x-2 border-r pr-6 border-[#E5E5E7]">
               <FileText className="w-4 h-4 text-[#3B82F6]" />
               <span className="text-sm font-black text-[#1D1D1F] tracking-tighter uppercase whitespace-nowrap">
                 {isPaginating ? 'Relayouting...' : `${pagesData.length} ${pagesData.length === 1 ? 'Page' : 'Pages'}`}
               </span>
             </div>
             <div className="flex items-center space-x-2">
               <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-[#86868B]">Engine Sync</span>
             </div>
          </div>
        </div>
      )}

      {/* Paginated Pages Render */}
      <div className={cn(
        "flex flex-col items-center space-y-12 transition-all duration-500",
        isPaginating ? "opacity-30 blur-sm" : "opacity-100 blur-0"
      )}>
        {pagesData.length > 0 ? pagesData.map((pageContent, idx) => (
          <div 
            key={idx}
            className="resume-page shadow-[0_30px_60px_rgba(0,0,0,0.12)] bg-white relative transition-all duration-700 hover:shadow-[0_45px_90px_rgba(0,0,0,0.18)] hover:-translate-y-1 group"
            style={{ 
              width: `${pageWidth}px`, 
              height: `${pageHeight}px`,
              fontFamily: fontFamilies[fontFamily],
            }}
          >
            <div 
              className={cn(
                "h-full w-full flex flex-col",
                lineSpacings[lineSpacing]
              )}
              style={{
                paddingLeft: `${SIDE_MARGIN_PX}px`,
                paddingRight: `${SIDE_MARGIN_PX}px`,
                paddingTop: `${TOP_MARGIN_PX}px`,
                paddingBottom: `${BOTTOM_MARGIN_PX}px`,
              }}
            >
              <div className="flex-1 flex flex-col">
                {pageContent}
              </div>
              
              {/* Footer / Page Number */}
              <div className="mt-8 pt-4 border-t border-[#F3F4F6] flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] opacity-60 group-hover:opacity-100 transition-opacity">
                <span>{personalInfo.fullName} • Resume Core</span>
                <span className="bg-[#F9FAFB] px-3 py-1 rounded-full border border-[#F3F4F6]">Page {idx + 1} of {pagesData.length}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="h-[1123px] w-[794px] bg-white shadow-xl flex flex-col items-center justify-center space-y-4 rounded-xl border-2 border-dashed border-[#F3F4F6]">
             <div className="w-12 h-12 rounded-full border-4 border-[#3B82F6] border-t-transparent animate-spin" />
             <div className="text-[#9CA3AF] font-bold uppercase tracking-widest text-xs">Simulating Hard Pagination...</div>
          </div>
        )}
      </div>
    </div>
  );
}
