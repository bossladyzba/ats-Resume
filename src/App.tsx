import { useState, useEffect, useRef } from 'react';
import Landing from './components/Landing';
import FileUploader from './components/FileUploader';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import AIPanel from './components/AIPanel';
import CoverLetterModal from './components/CoverLetterModal';
import { ResumeData, ResumeSettings } from './types';
import { parseResumePipeline, optimizeResume } from './services/geminiService';
import { generateDocx } from './services/docxExport';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Briefcase, 
  ChevronLeft, 
  Layout, 
  Sparkles, 
  FileText, 
  Download, 
  ChevronDown, 
  File as FileIcon, 
  Printer,
  FileDown,
  Save,
  CheckCircle2,
  GripVertical
} from 'lucide-react';
import { cn } from './lib/utils';

const initialResumeData: ResumeData = {
  personalInfo: { fullName: '', email: '', phone: '', location: '', summary: '' },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  customSections: []
};

const initialSettings: ResumeSettings = {
  templateId: 'minimal',
  fontSize: 'medium',
  lineSpacing: 'relaxed',
  fontFamily: 'sans',
  colors: {
    name: '#1D1D1F',
    sectionHeader: '#0071E3',
    jobTitle: '#1D1D1F',
    companyName: '#444444',
    dates: '#86868B',
    bodyText: '#1D1D1F',
    divider: '#E5E5E7'
  },
  pageSize: 'a4',
  orientation: 'portrait',
  optimizationMode: 'multi-page'
};

export default function App() {
  const [view, setView] = useState<'landing' | 'builder'>('landing');
  const [flow, setFlow] = useState<'general' | 'role'>('general');
  const [showUploader, setShowUploader] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [originalResumeData, setOriginalResumeData] = useState<ResumeData | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [settings, setSettings] = useState<ResumeSettings>(initialSettings);
  const [jobDescription, setJobDescription] = useState('');
  const [showJobInput, setShowJobInput] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeColorTarget, setActiveColorTarget] = useState<string | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(480);
  const [isResizing, setIsResizing] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Load draft and settings on mount
  useEffect(() => {
    // Load Panel Width
    const savedWidth = localStorage.getItem('left_panel_width');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      setLeftPanelWidth(width);
      if (mainRef.current) {
        mainRef.current.style.setProperty('--lp-width', `${width}px`);
      }
    } else {
      if (mainRef.current) {
        mainRef.current.style.setProperty('--lp-width', '480px');
      }
    }

    const draft = localStorage.getItem('resume_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.resumeData) setResumeData(parsed.resumeData);
        
        if (parsed.settings) {
          // Migration: Ensure new properties exist
          const mergedSettings: ResumeSettings = {
            ...initialSettings,
            ...parsed.settings,
            colors: {
              ...initialSettings.colors,
              ...(parsed.settings.colors || {})
            },
            pageSize: parsed.settings.pageSize || initialSettings.pageSize,
            orientation: parsed.settings.orientation || initialSettings.orientation,
            optimizationMode: parsed.settings.optimizationMode || initialSettings.optimizationMode
          };
          setSettings(mergedSettings);
        }
        
        if (parsed.jobDescription) setJobDescription(parsed.jobDescription);
      } catch (err) {
        console.error("Failed to load draft:", err);
      }
    }
  }, []);

  const handleSaveDraft = () => {
    setIsSaving(true);
    const draft = {
      resumeData,
      settings,
      jobDescription,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem('resume_draft', JSON.stringify(draft));
    
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    }, 600);
  };

  const handleFlowChoice = (choice: 'general' | 'role' | 'upload') => {
    if (choice === 'upload') {
      setShowUploader(true);
    } else {
      setFlow(choice);
      if (choice === 'role') {
        setShowJobInput(true);
      } else {
        setView('builder');
      }
    }
  };

  // Resize logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !mainRef.current) return;
      
      const newWidth = e.clientX;
      const minWidth = window.innerWidth * 0.3;
      const maxWidth = window.innerWidth * 0.6;
      
      // Clamp values
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      // Update CSS variable directly for smooth performance
      mainRef.current.style.setProperty('--lp-width', `${clampedWidth}px`);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing) {
        setIsResizing(false);
        const finalWidth = e.clientX;
        const minWidth = window.innerWidth * 0.3;
        const maxWidth = window.innerWidth * 0.6;
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, finalWidth));
        
        setLeftPanelWidth(clampedWidth);
        localStorage.setItem('left_panel_width', clampedWidth.toString());
        document.body.style.cursor = 'default';
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing]);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    const parsed = await parseResumePipeline(file);
    if (parsed) {
      const formatted: ResumeData = {
        ...initialResumeData,
        ...parsed,
        personalInfo: { ...initialResumeData.personalInfo, ...(parsed.personalInfo || {}) },
        experience: (parsed.experience || []).map(exp => ({ ...exp, id: crypto.randomUUID() })),
        education: (parsed.education || []).map(edu => ({ ...edu, id: crypto.randomUUID() })),
        skills: (parsed.skills || []).map(s => ({ ...s, id: crypto.randomUUID() }))
      } as ResumeData;
      setResumeData(formatted);
      setOriginalResumeData(formatted); // Keep original for comparison
    }
    setIsProcessing(false);
    setShowUploader(false);
    setView('builder');
  };

  const handleOptimize = async () => {
    if (!jobDescription || !resumeData) return;
    setIsOptimizing(true);
    const optimized = await optimizeResume(resumeData, jobDescription);
    setResumeData(optimized);
    setIsOptimizing(false);
  };

  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      await generateDocx(resumeData, settings);
      setShowExportMenu(false);
    } catch (err) {
      console.error(err);
      alert("DOCX Export failed. Check console for details.");
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportPdf = () => {
    setShowExportMenu(false);
    setIsPrinting(true);
    // Let React render the print-only view first
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  const handleDownloadPdf = async () => {
    setShowExportMenu(false);
    // Select all individual pages generated by the Hard Pagination engine
    const pages = document.querySelectorAll('.resume-page');
    if (pages.length === 0) {
      alert("Layout engine is still calculating. Please try again in a moment.");
      return;
    }

    try {
      setIsExportingPdf(true);
      
      const orientation = settings.orientation === 'portrait' ? 'p' : 'l';
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: settings.pageSize,
        compress: false // Disable compression for maximum clarity
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        // Use very high scale for absolute clarity (retina quality)
        const canvas = await html2canvas(page, {
          scale: 4, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: page.offsetWidth,
          windowHeight: page.offsetHeight,
          onclone: (doc) => {
            // Ensure no UI elements or artifacts appear in the clone
            const clone = doc.querySelector('.resume-page');
            if (clone) {
              (clone as HTMLElement).style.boxShadow = 'none';
              (clone as HTMLElement).style.transform = 'none';
            }
          }
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        if (i > 0) {
          pdf.addPage(settings.pageSize, orientation);
        }
        
        // Use 'NONE' compression for high quality result
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'NONE');
      }
      
      const fileName = `${resumeData.personalInfo.fullName.trim().replace(/\s+/g, '_')}_Resume.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert("Download failed. Please try again or use the Printer option.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isPrinting) {
     return (
       <div className="bg-white min-h-screen">
          <ResumePreview data={resumeData} settings={settings} hideUI={true} />
       </div>
     );
  }

  if (view === 'landing') {
    return (
      <>
        <Landing 
          onChoice={handleFlowChoice} 
          hasDraft={localStorage.getItem('resume_draft') !== null} 
        />
        <AnimatePresence>
          {showUploader && (
            <FileUploader 
              onFileUpload={handleFileUpload} 
              onClose={() => setShowUploader(false)} 
              isProcessing={isProcessing}
            />
          )}
          {showJobInput && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl relative p-12 space-y-8"
             >
               <div className="text-center space-y-2">
                 <h2 className="text-3xl font-semibold">Tells us about the role</h2>
                 <p className="text-[#86868B]">Paste the job description and our AI will optimize your resume for it.</p>
               </div>
               <textarea
                 value={jobDescription}
                 onChange={e => setJobDescription(e.target.value)}
                 className="w-full h-48 p-6 bg-[#F5F5F7] border-none rounded-3xl focus:ring-2 focus:ring-blue-500 transition-all text-[#1D1D1F] placeholder-gray-400 resize-none font-sans text-sm"
                 placeholder="Paste Job Description here..."
               />
               <div className="flex justify-end space-x-4">
                 <button 
                  onClick={() => setShowJobInput(false)}
                  className="px-6 py-3 text-gray-500 font-medium hover:text-gray-700"
                 >
                   Cancel
                 </button>
                 <button 
                  disabled={!jobDescription.trim()}
                  onClick={() => {
                    setShowJobInput(false);
                    setView('builder');
                  }}
                  className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
                 >
                   Tailor my resume
                 </button>
               </div>
             </motion.div>
           </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header / Nav */}
      <nav className="h-[60px] glass-nav flex items-center justify-between px-6 shrink-0 z-20 hide-on-print">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 -ml-2 rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#1D1D1F] md:flex hidden"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Layout className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView('landing')}
            className="p-2 rounded-full hover:bg-[#F3F4F6] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center font-bold text-lg tracking-tight">
            <div className="w-6 h-6 bg-[#0071E3] rounded-md mr-2.5" />
            ATS Architect
          </div>
          <span className="text-[11px] bg-[#E8E8ED] text-[#1D1D1F] px-2.5 py-1 rounded-md font-semibold uppercase tracking-wider">
            {flow === 'general' ? 'General' : 'Tailored'}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Draft Persistence */}
          <div className="flex items-center mr-2">
            <AnimatePresence>
              {showSavedToast && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="mr-3 flex items-center text-[#16A34A] text-xs font-semibold bg-[#F0FDF4] px-3 py-1.5 rounded-full border border-[#DCFCE7] shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Progress Saved
                </motion.div>
              )}
            </AnimatePresence>
            
            <button 
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5E7] rounded-xl transition-all flex items-center space-x-2 text-sm font-medium disabled:opacity-50 group"
            >
              <Save className={cn("w-4 h-4 transition-transform group-hover:scale-110", isSaving && "animate-pulse")} />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>
          </div>

          <div className="h-6 w-[1px] bg-[#E5E5E7] mr-1" />

          {jobDescription && (
            <button 
              onClick={() => setShowCoverLetterModal(true)}
              className="px-4 py-2 bg-[#E8E8ED] text-[#1D1D1F] rounded-lg text-sm font-medium hover:bg-[#D8D8DD] transition-all flex items-center space-x-2"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Cover Letter</span>
            </button>
          )}

          <div className="relative">
            <button 
              disabled={isExportingDocx}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-[#0071E3] text-white rounded-lg text-sm font-medium hover:bg-[#0077ED] transition-all flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform", showExportMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-[#E5E5E7] p-2 z-20 overflow-hidden"
                  >
                    {/* PDF Settings Quick Access */}
                    <div className="px-4 py-3 border-b border-[#F5F5F7] bg-[#FBFBFD] -mx-2 -mt-2 mb-2">
                       <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-3">PDF Configuration</p>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                             <label className="text-[9px] font-semibold text-[#86868B]">Page Size</label>
                             <select 
                               value={settings.pageSize}
                               onChange={(e) => setSettings({ ...settings, pageSize: e.target.value as any })}
                               className="w-full bg-white border border-[#E5E5E7] rounded-lg text-xs py-1.5 px-2 focus:ring-1 focus:ring-blue-500 outline-none"
                             >
                                <option value="a4">A4 (Standard)</option>
                                <option value="letter">US Letter</option>
                             </select>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-semibold text-[#86868B]">Orientation</label>
                             <select 
                               value={settings.orientation}
                               onChange={(e) => setSettings({ ...settings, orientation: e.target.value as any })}
                               className="w-full bg-white border border-[#E5E5E7] rounded-lg text-xs py-1.5 px-2 focus:ring-1 focus:ring-blue-500 outline-none"
                             >
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                             </select>
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={handleExportPdf}
                      className="w-full px-4 py-3 text-left hover:bg-[#F5F5F7] flex items-center space-x-3 transition-colors group rounded-xl"
                    >
                      <div className="p-1.5 bg-[#EFF6FF] rounded-lg text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Print / Save as PDF</span>
                        <span className="text-[10px] text-[#86868B]">ATS High-Performance</span>
                      </div>
                    </button>

                    <button 
                      onClick={handleDownloadPdf}
                      disabled={isExportingPdf}
                      className="w-full px-4 py-3 text-left hover:bg-[#F5F5F7] flex items-center space-x-3 transition-colors group rounded-xl disabled:opacity-50"
                    >
                      <div className="p-1.5 bg-[#F0FDF4] rounded-lg text-[#16A34A] group-hover:bg-[#16A34A] group-hover:text-white transition-colors">
                        {isExportingPdf ? (
                          <div className="w-4 h-4 rounded-full border-2 border-[#16A34A] border-t-transparent animate-spin" />
                        ) : (
                          <FileDown className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{isExportingPdf ? 'Generating PDF...' : 'Direct Download PDF'}</span>
                        <span className="text-[10px] text-[#86868B]">Multi-page visual export</span>
                      </div>
                    </button>

                    <button 
                      onClick={handleExportDocx}
                      disabled={isExportingDocx}
                      className="w-full px-4 py-3 text-left hover:bg-[#F5F5F7] flex items-center space-x-3 transition-colors group disabled:opacity-50 rounded-xl"
                    >
                      <div className="p-1.5 bg-[#FFF7ED] rounded-lg text-[#EA580C] group-hover:bg-[#EA580C] group-hover:text-white transition-colors">
                        <FileIcon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Editable DOCX</span>
                        <span className="text-[10px] text-[#86868B]">Microsoft Word Format</span>
                      </div>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Main Content: 3 columns */}
      <main ref={mainRef} className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Panel: Wider (35-40%) - Main interactive driver */}
        <aside 
          style={{ width: isSidebarCollapsed ? '0px' : `var(--lp-width, ${leftPanelWidth}px)` }}
          className={cn(
            "bg-white border-b md:border-b-0 md:border-r border-[#E5E5E7] flex flex-col shrink-0 overflow-y-auto hide-on-print relative z-10 w-full md:max-w-[60%] md:min-w-[30%] transition-all duration-300 ease-in-out",
            isSidebarCollapsed && "md:w-0 md:min-w-0 opacity-0 pointer-events-none border-0"
          )}
        >
          <ResumeForm 
            data={resumeData} 
            onChange={setResumeData} 
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            settings={settings}
            onSettingsChange={setSettings}
            flow={flow}
            activeColorTarget={activeColorTarget}
            onColorTargetFocus={setActiveColorTarget}
            onUploadRequest={() => setShowUploader(true)}
            onFileUpload={handleFileUpload}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
            isProcessing={isProcessing}
            originalData={originalResumeData}
            onResetToOriginal={() => originalResumeData && setResumeData(originalResumeData)}
          />
        </aside>

        {/* Resize Handle - Hidden on mobile */}
        {!isSidebarCollapsed && (
          <div 
            onMouseDown={() => setIsResizing(true)}
            className={cn(
              "absolute top-0 bottom-0 w-[6px] -ml-[3px] cursor-col-resize z-30 transition-all group hover:bg-blue-500/10 active:bg-blue-500/20 hide-on-print hidden md:flex items-center justify-center",
              isResizing && "bg-blue-500/10"
            )}
            style={{ left: `var(--lp-width, ${leftPanelWidth}px)` }}
          >
            <div className={cn(
              "w-[1px] h-full bg-[#E5E5E7] group-hover:bg-blue-500 transition-colors",
              isResizing && "bg-blue-500"
            )} />
            
            {/* Subtle drag handle visual */}
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-white border border-[#E5E5E7] rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-[#86868B]" />
            </div>
          </div>
        )}

        {/* Preview Area (Center) */}
        <section className="flex-1 bg-[#F5F5F7] flex justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
           <div className="w-full max-w-[816px] h-fit">
            <ResumePreview 
              data={resumeData} 
              settings={settings} 
              onColorTargetClick={setActiveColorTarget}
            />
           </div>
        </section>

        {/* AI Panel (Right) */}
        <aside className="w-[300px] shrink-0 hide-on-print">
          <AIPanel resumeData={resumeData} jobDescription={jobDescription} />
        </aside>
      </main>

      {/* Customizer Overlay (Move settings here horizontally if needed, or keep in form) */}
      
      <CoverLetterModal 
        isOpen={showCoverLetterModal}
        onClose={() => setShowCoverLetterModal(false)}
        resumeData={resumeData}
        jobDescription={jobDescription}
      />
    </div>
  );
}
