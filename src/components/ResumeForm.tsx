
import React, { useState } from 'react';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Plus, 
  Trash2, 
  Cpu, 
  Save, 
  Wand2, 
  PlusCircle, 
  Palette, 
  Type as TypeIcon,
  Layout as LayoutIcon,
  FileSearch,
  RotateCcw,
  Check,
  Loader2,
  AlertTriangle,
  Info,
  Sparkles,
  GitCompare,
  Upload,
  Search,
  CheckCircle,
  ArrowRight,
  UserCircle,
  FileDown,
  FileText,
  File as FileIcon,
  GripVertical,
  Layers
} from 'lucide-react';
import { ResumeData, Experience, Education, Skill, Project, ResumeSettings, StyleColors } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { rewriteBulletPoint } from '../services/geminiService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  jobDescription: string;
  onJobDescriptionChange: (val: string) => void;
  settings: ResumeSettings;
  onSettingsChange: (s: ResumeSettings) => void;
  flow: 'general' | 'role';
  activeColorTarget: string | null;
  onColorTargetFocus: (target: string | null) => void;
  onUploadRequest: () => void;
  onFileUpload: (file: File) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  isProcessing: boolean;
  originalData: ResumeData | null;
  onResetToOriginal: () => void;
}

type Tab = 'personal' | 'job' | 'experience' | 'education' | 'skills' | 'projects' | 'custom' | 'design';

export default function ResumeForm({ 
  data, 
  onChange, 
  jobDescription, 
  onJobDescriptionChange,
  settings,
  onSettingsChange,
  flow,
  activeColorTarget,
  onColorTargetFocus,
  onUploadRequest,
  onFileUpload,
  onOptimize,
  isOptimizing,
  isProcessing,
  originalData,
  onResetToOriginal
}: ResumeFormProps) {
  const [activeTab, setActiveTab] = useState<Tab>(flow === 'role' ? 'job' : 'personal');
  const [isRewriting, setIsRewriting] = useState<string | null>(null);
  const [optimizationStep, setOptimizationStep] = useState(1);
  const [showComparison, setShowComparison] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSourceFile(e.dataTransfer.files[0]);
    }
  };

  const processSourceFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB limit.");
      return;
    }
    onFileUpload(file);
    setOptimizationStep(3); // Auto-advance on profile load
  };

  // Safety fallback for legacy migrations
  const colors = settings.colors || {
    name: '#1D1D1F',
    sectionHeader: '#0071E3',
    jobTitle: '#1D1D1F',
    companyName: '#444444',
    dates: '#86868B',
    bodyText: '#1D1D1F',
    divider: '#E5E5E7'
  };

  const updatePersonalInfo = (field: keyof typeof data.personalInfo, value: string) => {
    onChange({
      ...data,
      personalInfo: { ...data.personalInfo, [field]: value }
    });
  };

  React.useEffect(() => {
    if (activeColorTarget) {
      setActiveTab('design');
    }
  }, [activeColorTarget]);

  const isColorSafe = (hex: string) => {
    if (!hex || !hex.startsWith('#')) return true;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 0.6; // Dark enough?
  };

  const presets: Record<string, StyleColors> = {
    classic: {
      name: '#000000',
      sectionHeader: '#000000',
      jobTitle: '#000000',
      companyName: '#444444',
      dates: '#666666',
      bodyText: '#1D1D1F',
      divider: '#000000'
    },
    modernBlue: {
      name: '#1D1D1F',
      sectionHeader: '#0071E3',
      jobTitle: '#1D1D1F',
      companyName: '#444444',
      dates: '#86868B',
      bodyText: '#1D1D1F',
      divider: '#E5E5E7'
    },
    subtleGray: {
      name: '#444444',
      sectionHeader: '#444444',
      jobTitle: '#444444',
      companyName: '#666666',
      dates: '#999999',
      bodyText: '#444444',
      divider: '#E5E5E7'
    },
    slateBusiness: {
      name: '#0F172A',
      sectionHeader: '#1E293B',
      jobTitle: '#0F172A',
      companyName: '#475569',
      dates: '#64748B',
      bodyText: '#1E293B',
      divider: '#334155'
    },
    vibrantCreative: {
      name: '#1A1A1A',
      sectionHeader: '#E11D48',
      jobTitle: '#1A1A1A',
      companyName: '#404040',
      dates: '#737373',
      bodyText: '#171717',
      divider: '#F43F5E'
    },
    terminalDev: {
      name: '#059669',
      sectionHeader: '#10B981',
      jobTitle: '#059669',
      companyName: '#111827',
      dates: '#6B7280',
      bodyText: '#1F2937',
      divider: '#10B981'
    }
  };

  const updateSettings = (updates: Partial<ResumeSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updateColor = (key: keyof StyleColors, val: string) => {
    onSettingsChange({
      ...settings,
      colors: {
        ...colors,
        [key]: val
      }
    });
  };

  const handleSectionOrderChange = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(settings.sectionOrder || ['experience', 'education', 'projects', 'skills', 'custom']);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onSettingsChange({
      ...settings,
      sectionOrder: items
    });
  };

  const sectionLabels: Record<string, { label: string, icon: any }> = {
    experience: { label: 'Professional History', icon: Briefcase },
    education: { label: 'Academic Foundation', icon: GraduationCap },
    projects: { label: 'Selected Projects', icon: Award },
    skills: { label: 'Expertise & Skills', icon: Cpu },
    custom: { label: 'Custom Sections', icon: PlusCircle },
  };

  const applyPreset = (preset: StyleColors) => {
    onSettingsChange({
      ...settings,
      colors: preset
    });
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: crypto.randomUUID(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      highlights: ['']
    };
    onChange({ ...data, experience: [newExp, ...data.experience] });
  };

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    onChange({
      ...data,
      experience: data.experience.map(exp => exp.id === id ? { ...exp, ...updates } : exp)
    });
  };

  const removeExperience = (id: string) => {
    onChange({ ...data, experience: data.experience.filter(exp => exp.id !== id) });
  };

  const handleRewriteHighlight = async (expId: string, highlightIndex: number) => {
    const exp = data.experience.find(e => e.id === expId);
    if (!exp) return;
    const bullet = exp.highlights[highlightIndex];
    if (!bullet.trim()) return;

    setIsRewriting(`${expId}-${highlightIndex}`);
    const rewritten = await rewriteBulletPoint(bullet, jobDescription);
    const newHighlights = [...exp.highlights];
    newHighlights[highlightIndex] = rewritten;
    updateExperience(expId, { highlights: newHighlights });
    setIsRewriting(null);
  };

  const addSkill = () => {
    const newSkill: Skill = { id: crypto.randomUUID(), name: '', category: '' };
    onChange({ ...data, skills: [...data.skills, newSkill] });
  };

  const updateSkill = (id: string, name: string) => {
    onChange({
      ...data,
      skills: data.skills.map(s => s.id === id ? { ...s, name } : s)
    });
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: crypto.randomUUID(),
      school: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false
    };
    onChange({ ...data, education: [...data.education, newEdu] });
  };

  const updateEducation = (id: string, updates: Partial<Education>) => {
    onChange({
      ...data,
      education: data.education.map(edu => edu.id === id ? { ...edu, ...updates } : edu)
    });
  };

  const addCustomSection = () => {
    const newSectionId = crypto.randomUUID();
    const newSection = {
      id: newSectionId,
      title: 'New Section',
      items: [{ id: crypto.randomUUID(), content: '' }]
    };
    onChange({ ...data, customSections: [...data.customSections, newSection] });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'SECTION') {
      const customSections = [...data.customSections];
      const [reorderedSection] = customSections.splice(source.index, 1);
      customSections.splice(destination.index, 0, reorderedSection);
      onChange({ ...data, customSections });
    } else if (type === 'ITEM') {
      const sectionId = source.droppableId.replace('items-', '');
      const sectionIndex = data.customSections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return;

      const items = [...data.customSections[sectionIndex].items];
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      const newSections = [...data.customSections];
      newSections[sectionIndex] = { ...newSections[sectionIndex], items };
      onChange({ ...data, customSections: newSections });
    }
  };

  const tabs: { id: Tab; label: string; icon: any; flow?: string }[] = [
    { id: 'job', label: 'Job Role', icon: FileSearch, flow: 'role' },
    { id: 'personal', label: 'About', icon: User },
    { id: 'experience', label: 'History', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'projects', label: 'Projects', icon: Cpu },
    { id: 'custom', label: 'Other', icon: LayoutIcon },
    { id: 'design', label: 'Style', icon: Palette },
  ];

  const filteredTabs = tabs.filter(t => !t.flow || t.flow === flow);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Sidebar Navigation - Integration with wider layout */}
      <div className="flex flex-col h-full">
        {/* Tab Icons Sidebar - Vertical if we want, but let's stick to a clean top sub-nav for the inputs */}
        <div className="flex shrink-0 overflow-x-auto border-b border-[#E5E5E7] custom-scrollbar bg-[#FBFBFD] px-4 space-x-6 h-[50px] items-center no-scrollbar">
          {filteredTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center space-x-2 h-full px-2 text-[13px] font-semibold transition-all relative",
                activeTab === tab.id 
                  ? "text-[#1D1D1F]" 
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              )}
            >
              <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-[#0071E3]" : "text-[#86868B]")} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0071E3]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'job' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {/* Wizard Header */}
                <div className="flex items-center space-x-2">
                  {[1, 2, 3].map((step) => (
                    <React.Fragment key={step}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                        optimizationStep >= step ? "bg-black text-white" : "bg-[#F5F5F7] text-[#86868B]"
                      )}>
                        {optimizationStep > step ? <Check className="w-4 h-4" /> : step}
                      </div>
                      {step < 3 && <div className={cn("flex-1 h-[2px] rounded-full", optimizationStep > step ? "bg-black" : "bg-[#F5F5F7]")} />}
                    </React.Fragment>
                  ))}
                </div>

                {optimizationStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold tracking-tight">Step 1: Job Details</h2>
                      <p className="text-sm text-[#86868B]">AI uses this as the primary context for tailoring your resume.</p>
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={e => onJobDescriptionChange(e.target.value)}
                      className="w-full h-80 p-6 bg-[#F5F5F7] border border-[#E5E5E7] rounded-[32px] focus:ring-2 focus:ring-black transition-all text-[#1D1D1F] placeholder-gray-400 resize-none text-sm leading-relaxed"
                      placeholder="Paste the target job description here..."
                    />
                    <button 
                      disabled={!jobDescription.trim()}
                      onClick={() => setOptimizationStep(2)}
                      className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center space-x-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-900 transition-all"
                    >
                      <span>Continue to Upload</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {optimizationStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <div className="space-y-2 text-center md:text-left">
                      <h2 className="text-2xl font-bold tracking-tight">Step 2: Resume Source</h2>
                      <p className="text-sm text-[#86868B]">Choose how you'd like to provide your current resume data.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* Upload Button + Drag Zone */}
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={cn(
                          "group relative flex items-center p-6 bg-white border border-[#E5E5E7] rounded-3xl transition-all text-left overflow-hidden",
                          isDragging ? "border-black scale-[1.02] shadow-xl bg-gray-50" : "hover:border-black hover:shadow-lg",
                          isProcessing && "pointer-events-none opacity-80"
                        )}
                      >
                        <input 
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              processSourceFile(e.target.files[0]);
                            }
                          }}
                        />
                        {isProcessing ? (
                          <div className="flex items-center w-full">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center relative">
                               <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                               <Sparkles className="w-3 h-3 text-blue-400 absolute top-2 right-2 animate-pulse" />
                            </div>
                            <div className="ml-4">
                               <p className="font-bold text-[#1D1D1F]">AI is Analyzing...</p>
                               <p className="text-[10px] text-blue-600">Extracting resume details</p>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center w-full"
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                              isDragging ? "bg-black text-white" : "bg-[#F5F5F7] text-black group-hover:bg-black group-hover:text-white"
                            )}>
                              <Upload className="w-6 h-6" />
                            </div>
                            <div className="ml-4 flex-1">
                              <p className="font-bold text-[#1D1D1F]">Upload New Resume</p>
                              <p className="text-xs text-[#86868B]">Drag & drop or click to upload</p>
                            </div>
                            <div className={cn(
                              "w-8 h-8 rounded-full border border-[#E5E5E7] flex items-center justify-center transition-colors",
                              isDragging ? "bg-black border-black" : "group-hover:bg-black group-hover:border-black"
                            )}>
                              <ArrowRight className={cn("w-4 h-4", isDragging ? "text-white" : "group-hover:text-white")} />
                            </div>
                          </button>
                        )}
                        {isDragging && !isProcessing && (
                          <div className="absolute inset-0 bg-black/5 pointer-events-none flex items-center justify-center">
                            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }}>
                              <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full">Drop to Analyze</p>
                            </motion.div>
                          </div>
                        )}
                      </div>

                      {/* Use Existing Button */}
                      <button 
                        disabled={!data.experience.length && !data.personalInfo.fullName}
                        onClick={() => setOptimizationStep(3)}
                        className={cn(
                          "group relative flex items-center p-6 bg-white border border-[#E5E5E7] rounded-3xl transition-all text-left",
                          (!data.experience.length && !data.personalInfo.fullName) 
                            ? "opacity-40 cursor-not-allowed" 
                            : "hover:border-black hover:shadow-lg"
                        )}
                      >
                        <div className="w-12 h-12 bg-[#F5F5F7] rounded-2xl flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
                          <UserCircle className="w-6 h-6" />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="font-bold text-[#1D1D1F]">Use Existing Profile</p>
                          <p className="text-xs text-[#86868B]">Continue with current editor data</p>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E5E5E7] flex items-center justify-center group-hover:bg-black group-hover:border-black transition-colors">
                          <ArrowRight className="w-4 h-4 group-hover:text-white" />
                        </div>
                      </button>
                    </div>

                    <AnimatePresence>
                      {(data.experience.length > 0 || data.personalInfo.fullName) && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-6 bg-green-50 rounded-3xl border border-green-100 italic text-[13px] text-green-700"
                        >
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5" />
                            <span>Resume data loaded successfully.</span>
                          </div>
                          <div className="flex items-center space-x-2">
                             <button onClick={() => setOptimizationStep(1)} className="text-xs font-bold underline">Job Details</button>
                             <span className="text-gray-300">|</span>
                             <button onClick={() => setOptimizationStep(3)} className="text-xs font-bold text-green-800">Next Step →</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center space-x-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <p className="text-[12px] text-blue-800 leading-snug">
                        <strong>Step 1 Complete:</strong> Job details are loaded as optimization context.
                      </p>
                    </div>
                  </motion.div>
                )}

                {optimizationStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold tracking-tight text-center">Step 3: AI Optimization</h2>
                      <p className="text-sm text-[#86868B] text-center">Tailoring your bullet points and skills for the role.</p>
                    </div>

                    <div className="relative group">
                       <div className="absolute -inset-4 bg-blue-50/50 rounded-[48px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                       <button 
                        disabled={isOptimizing}
                        onClick={onOptimize}
                        className={cn(
                          "relative w-full py-8 bg-black hover:bg-gray-900 text-white rounded-[40px] font-black text-xl flex flex-col items-center justify-center space-y-3 transition-all transform active:scale-95 group overflow-hidden",
                          isOptimizing && "bg-gray-800 pointer-events-none"
                        )}
                      >
                        {isOptimizing ? (
                          <>
                            <Cpu className="w-10 h-10 animate-spin text-blue-400" />
                            <span className="text-sm">Rewriting Resume...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-10 h-10 text-blue-400 group-hover:scale-125 transition-transform" />
                            <span className="tracking-tight">Optimize Resume for This Role</span>
                          </>
                        )}
                        
                        {isOptimizing && (
                           <div className="absolute bottom-0 left-0 h-1 bg-blue-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '100%' }} />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-[#86868B] text-center leading-relaxed">
                      AI will tailor your resume to match the job description, inject relevant keywords, and improve phrasing with powerful action verbs while maintaining ATS-safe formatting.
                    </p>

                    {originalData && !isOptimizing && (
                       <div className="pt-8 border-t border-[#E5E5E7] space-y-4">
                          <label className="text-[10px] font-bold text-[#86868B] uppercase tracking-[0.2em] block">Optimization Dashboard</label>
                          <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-3xl border border-[#E5E5E7]">
                             <div className="flex items-center space-x-3">
                                <Search className="w-5 h-5 text-black" />
                                <span className="font-bold text-sm">Compare Versions</span>
                             </div>
                             <button 
                              onClick={() => setShowComparison(!showComparison)}
                              className={cn(
                                "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                                showComparison ? "bg-black" : "bg-gray-300"
                              )}
                             >
                                <motion.div 
                                  animate={{ x: showComparison ? 24 : 0 }}
                                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                                />
                             </button>
                          </div>

                          {showComparison && (
                             <div className="grid grid-cols-2 gap-2">
                                <button 
                                  onClick={onResetToOriginal}
                                  className="py-3 bg-white border border-[#E5E5E7] text-[#1D1D1F] rounded-2xl text-xs font-bold hover:bg-[#F5F5F7]"
                                >
                                  Reset to Original
                                </button>
                                <button 
                                  onClick={() => setOptimizationStep(1)}
                                  className="py-3 bg-white border border-[#E5E5E7] text-[#1D1D1F] rounded-2xl text-xs font-bold hover:bg-[#F5F5F7]"
                                >
                                  Modify JD
                                </button>
                             </div>
                          )}
                       </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'design' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Design Architecture</h2>
                    <button 
                      onClick={() => applyPreset(presets.modernBlue)}
                      className="text-xs font-bold text-[#0071E3] hover:underline flex items-center"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset to Default
                    </button>
                  </div>
                  
                  {/* Style Presets */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-[#86868B] uppercase tracking-[0.2em] flex items-center">
                      <Sparkles className="w-3 h-3 mr-2" />
                      Style Presets
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'classic', name: 'Classic Black', colors: presets.classic },
                        { id: 'modern', name: 'Professional Blue', colors: presets.modernBlue },
                        { id: 'gray', name: 'Subtle Gray', colors: presets.subtleGray },
                        { id: 'slate', name: 'Slate Business', colors: presets.slateBusiness },
                        { id: 'rose', name: 'Creative Rose', colors: presets.vibrantCreative },
                        { id: 'emerald', name: 'Terminal Dev', colors: presets.terminalDev },
                      ].map(p => (
                        <button
                          key={p.id}
                          onClick={() => applyPreset(p.colors)}
                          className="px-3 py-2 bg-[#F5F5F7] hover:bg-[#E8E8ED] rounded-xl text-[11px] font-bold text-[#1D1D1F] border border-transparent transition-all"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Color Targets */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-[#86868B] uppercase tracking-[0.2em]">
                      <Palette className="w-3 h-3" />
                      <span>Advanced ATS-Safe Color Control</span>
                    </div>

                    <div className="bg-[#FBFBFD] rounded-[24px] border border-[#E5E5E7] p-6 space-y-6">
                      <div className="space-y-4">
                        <div className="text-[11px] font-black text-[#1D1D1F] uppercase tracking-wider mb-2">Text Elements</div>
                        <div className="grid gap-4">
                          {[
                            { key: 'name', label: 'Full Name / Header' },
                            { key: 'sectionHeader', label: 'Section Headers' },
                            { key: 'jobTitle', label: 'Job Titles' },
                            { key: 'companyName', label: 'Company Names' },
                            { key: 'dates', label: 'Dates / Timeline' },
                            { key: 'bodyText', label: 'Body Text / Bullets' },
                          ].map(target => (
                            <div key={target.key} className="flex items-center justify-between group">
                              <label className="text-[13px] font-medium text-[#1D1D1F]">{target.label}</label>
                              <div className="flex items-center space-x-3">
                                {!isColorSafe(colors[target.key as keyof StyleColors]) && (
                                  <div className="group/warn relative">
                                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover/warn:opacity-100 pointer-events-none transition-opacity z-50">
                                      This color may reduce ATS readability due to low contrast.
                                    </div>
                                  </div>
                                )}
                                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#E5E5E7] shadow-sm">
                                  <input 
                                    type="color" 
                                    value={colors[target.key as keyof StyleColors]}
                                    onChange={(e) => updateColor(target.key as keyof StyleColors, e.target.value)}
                                    className="absolute -inset-2 w-12 h-12 cursor-pointer bg-transparent border-none p-0"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-[#E5E5E7] space-y-4">
                        <div className="text-[11px] font-black text-[#1D1D1F] uppercase tracking-wider mb-2">Decorative Elements</div>
                        <div className="flex items-center justify-between">
                          <label className="text-[13px] font-medium text-[#1D1D1F]">Divider Lines</label>
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#E5E5E7] shadow-sm">
                            <input 
                              type="color" 
                              value={colors.divider}
                              onChange={(e) => updateColor('divider', e.target.value)}
                              className="absolute -inset-2 w-12 h-12 cursor-pointer bg-transparent border-none p-0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="space-y-4 pt-4">
                    <label className="text-[10px] font-bold text-[#86868B] uppercase tracking-[0.2em] flex items-center">
                      <LayoutIcon className="w-3.5 h-3.5 mr-2" />
                      ATS-Optimized Templates
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'minimal', name: 'Executive Standard', desc: 'Classic single-column flow. Best for traditional corporate roles.' },
                        { id: 'modern', name: 'Professional Clean', desc: 'Slightly more modern spacing and alignment. Best for tech roles.' },
                        { id: 'business', name: 'Business Professional', desc: 'Bold, structured, and high-impact. Perfect for executive and leadership positions.' },
                        { id: 'developer', name: 'Technical Developer', desc: 'Dense, mono-styled information architecture. Optimized for engineering roles.' },
                        { id: 'portfolio', name: 'Creative Portfolio', desc: 'Asymmetric, expressive layout for designers and creatives.' },
                        { id: 'compact', name: 'High Efficiency', desc: 'Optimized to fit maximal content. Best for experienced candidates.' },
                        { id: 'classic', name: 'Old School / Academic', desc: 'Traditional centered layout. Perfect for legal or academic resumes.' },
                        { id: 'tech', name: 'Legacy Tech', desc: 'Original tech layout with numbered sections.' },
                        { id: 'creative', name: 'Legacy Creative', desc: 'Original creative layout with split name logic.' },
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => updateSettings({ templateId: t.id as any })}
                          className={cn(
                            "flex flex-col items-start p-4 rounded-2xl border text-left transition-all",
                            settings.templateId === t.id 
                              ? "bg-blue-50 border-[#0071E3]" 
                              : "bg-[#F5F5F7] border-transparent hover:border-[#E5E5E7]"
                          )}
                        >
                          <span className="text-sm font-bold">{t.name}</span>
                          <span className="text-xs text-[#86868B] mt-1">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Selection */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-[#86868B] uppercase tracking-widest flex items-center">
                      <TypeIcon className="w-3.5 h-3.5 mr-2" />
                      ATS-Friendly Typography
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'sans', name: 'System Sans', desc: 'Modern, clean, and highly readable (Inter/Arial).', font: 'font-sans' },
                        { id: 'serif', name: 'Modern Serif', desc: 'Traditional, professional, and elegant (Georgia/Times).', font: 'font-serif' },
                        { id: 'mono', name: 'Technical Mono', desc: 'Precise, technical, and brutalist (Inconsolata/Menlo).', font: 'font-mono' },
                        { id: 'geometric', name: 'Geometric Sans', desc: 'Fashionable and high-tech (Outfit/Lexend).', font: 'font-sans' },
                        { id: 'slab', name: 'Sturdy Slab', desc: 'Strong, grounded, and unique (Roboto Slab).', font: 'font-serif' },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => updateSettings({ fontFamily: f.id as any })}
                          className={cn(
                            "flex flex-col items-start p-4 rounded-2xl border text-left transition-all",
                            settings.fontFamily === f.id 
                              ? "bg-blue-50 border-[#0071E3]" 
                              : "bg-[#F5F5F7] border-transparent hover:border-[#E5E5E7]"
                          )}
                        >
                          <span className={cn("text-base font-bold", f.font)}>{f.name}</span>
                          <span className="text-xs text-[#86868B] mt-1">{f.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Optimization */}
                  <div className="space-y-4 pt-4 border-t border-[#E5E5E7]">
                    <label className="text-xs font-bold text-[#86868B] uppercase tracking-widest flex items-center">
                      <FileSearch className="w-3.5 h-3.5 mr-2" />
                      Page Layout Optimization
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'one-page', name: '1-Page Limit', desc: 'Auto-adjusts density to fit one page.', icon: FileIcon },
                        { id: 'multi-page', name: 'Flexible Multi-Page', desc: 'Standard balanced spacing.', icon: FileDown },
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => updateSettings({ optimizationMode: mode.id as any })}
                          className={cn(
                            "flex flex-col items-start p-4 rounded-2xl border text-left transition-all",
                            settings.optimizationMode === mode.id 
                              ? "bg-black text-white border-black" 
                              : "bg-[#F5F5F7] border-transparent hover:border-[#E5E5E7]"
                          )}
                        >
                          <mode.icon className={cn("w-4 h-4 mb-2", settings.optimizationMode === mode.id ? "text-blue-400" : "text-[#86868B]")} />
                          <span className="text-xs font-bold leading-tight">{mode.name}</span>
                          <span className={cn("text-[9px] mt-1 leading-tight", settings.optimizationMode === mode.id ? "text-blue-200" : "text-[#86868B]")}>
                            {mode.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Controls */}
                  <div className="space-y-6 pt-4 border-t border-[#E5E5E7]">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-[#86868B] uppercase tracking-widest flex items-center">
                        <Layers className="w-3.5 h-3.5 mr-2" />
                        Section Flow Manager
                      </label>
                      <DragDropContext onDragEnd={handleSectionOrderChange}>
                        <Droppable droppableId="sections">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                              {(settings.sectionOrder || ['experience', 'education', 'projects', 'skills', 'custom']).map((sid, index) => {
                                const section = sectionLabels[sid];
                                if (!section) return null;
                                return (
                                  // @ts-ignore - Hi-Pangea DnD index/key mismatch in strict TS
                                  <Draggable key={sid} draggableId={sid} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={cn(
                                          "flex items-center justify-between p-3 bg-white border border-[#E5E5E7] rounded-xl transition-all",
                                          snapshot.isDragging ? "shadow-xl border-blue-500 ring-2 ring-blue-100 z-50" : "hover:border-gray-300"
                                        )}
                                      >
                                        <div className="flex items-center">
                                          <div className="p-1.5 bg-[#F5F5F7] rounded-lg mr-3">
                                            <section.icon className="w-3.5 h-3.5 text-[#1D1D1F]" />
                                          </div>
                                          <span className="text-xs font-bold text-[#1D1D1F]">{section.label}</span>
                                        </div>
                                        <GripVertical className="w-4 h-4 text-[#86868B] cursor-grab active:cursor-grabbing" />
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-[#86868B] uppercase tracking-widest flex items-center">
                        <LayoutIcon className="w-3.5 h-3.5 mr-2" />
                        Layout Intensity
                      </label>
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-3">
                        {['small', 'medium', 'large'].map(size => (
                          <button
                            key={size}
                            onClick={() => updateSettings({ fontSize: size as any })}
                            className={cn(
                              "px-3 py-2 rounded-xl border text-[11px] font-bold capitalize",
                              settings.fontSize === size 
                                ? "bg-black text-white border-black" 
                                : "bg-white border-[#E5E5E7] text-[#1D1D1F]"
                            )}
                          >
                            {size} Text
                          </button>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {['tight', 'relaxed', 'wide'].map(spacing => (
                          <button
                            key={spacing}
                            onClick={() => updateSettings({ lineSpacing: spacing as any })}
                            className={cn(
                              "px-3 py-2 rounded-xl border text-[11px] font-bold capitalize",
                              settings.lineSpacing === spacing 
                                ? "bg-black text-white border-black" 
                                : "bg-white border-[#E5E5E7] text-[#1D1D1F]"
                            )}
                          >
                            {spacing} Gap
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

            {activeTab === 'personal' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#1D1D1F]">Personal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name" value={data.personalInfo.fullName} onChange={v => updatePersonalInfo('fullName', v)} placeholder="John Doe" />
                  <Input label="Email" value={data.personalInfo.email} onChange={v => updatePersonalInfo('email', v)} placeholder="john@example.com" />
                  <Input label="Phone" value={data.personalInfo.phone} onChange={v => updatePersonalInfo('phone', v)} placeholder="+1 234 567 890" />
                  <Input label="Location" value={data.personalInfo.location} onChange={v => updatePersonalInfo('location', v)} placeholder="New York, NY" />
                  <Input label="LinkedIn" value={data.personalInfo.linkedin} onChange={v => updatePersonalInfo('linkedin', v)} placeholder="linkedin.com/in/johndoe" />
                  <Input label="Website" value={data.personalInfo.website} onChange={v => updatePersonalInfo('website', v)} placeholder="johndoe.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">Professional Summary</label>
                  <textarea
                    value={data.personalInfo.summary}
                    onChange={e => updatePersonalInfo('summary', e.target.value)}
                    className="w-full h-32 p-4 bg-[#F5F5F7] border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-[#1D1D1F] placeholder-gray-400 resize-none"
                    placeholder="Short professional bio..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'experience' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Work Experience</h2>
                <button 
                  onClick={addExperience}
                  className="inline-flex items-center space-x-2 text-blue-600 font-medium hover:bg-blue-50 px-4 py-2 rounded-full transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Role</span>
                </button>
              </div>

              <div className="space-y-8">
                {data.experience.map((exp, idx) => (
                  <div key={exp.id} className="relative group bg-[#F5F5F7] p-6 rounded-[24px] border border-transparent hover:border-blue-200 transition-all">
                    <button 
                      onClick={() => removeExperience(exp.id)}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Input label="Position" value={exp.position} onChange={v => updateExperience(exp.id, { position: v })} placeholder="e.g. Software Engineer" />
                      <Input label="Company" value={exp.company} onChange={v => updateExperience(exp.id, { company: v })} placeholder="e.g. Apple" />
                      <Input label="Location" value={exp.location} onChange={v => updateExperience(exp.id, { location: v })} placeholder="Cupertino, CA" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input label="Start Date" value={exp.startDate} onChange={v => updateExperience(exp.id, { startDate: v })} type="month" />
                        <Input label="End Date" value={exp.endDate} onChange={v => updateExperience(exp.id, { endDate: v })} type="month" disabled={exp.current} />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-4">
                      <input 
                        type="checkbox" 
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onChange={e => updateExperience(exp.id, { current: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`current-${exp.id}`} className="text-sm font-medium text-gray-700">I currently work here</label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider flex items-center justify-between">
                        <span>Key Achievement & Responsibilities</span>
                        <span className="normal-case font-normal">Use AI to rewrite bullets for ATS match</span>
                      </label>
                      {exp.highlights.map((h, hIdx) => (
                        <div key={hIdx} className="relative group/bullet">
                          <textarea
                            value={h}
                            onChange={e => {
                              const newHighlights = [...exp.highlights];
                              newHighlights[hIdx] = e.target.value;
                              updateExperience(exp.id, { highlights: newHighlights });
                            }}
                            className="w-full p-4 pr-12 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-[#1D1D1F] text-sm resize-none"
                            placeholder="Managed a team of 5, delivering projects..."
                          />
                          <button
                            onClick={() => handleRewriteHighlight(exp.id, hIdx)}
                            disabled={isRewriting === `${exp.id}-${hIdx}`}
                            className={cn(
                              "absolute bottom-4 right-4 p-2 rounded-lg transition-all",
                              isRewriting === `${exp.id}-${hIdx}` 
                                ? "bg-blue-100 text-blue-600 animate-pulse" 
                                : "bg-white text-blue-600 shadow-sm border border-blue-100 hover:scale-110"
                            )}
                            title="AI Rewrite"
                          >
                            {isRewriting === `${exp.id}-${hIdx}` ? <Cpu className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newHighlights = [...exp.highlights, ''];
                          updateExperience(exp.id, { highlights: newHighlights });
                        }}
                        className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add bullet</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Skills & Expertise</h2>
                <button 
                  onClick={addSkill}
                  className="inline-flex items-center space-x-2 text-blue-600 font-medium hover:bg-blue-50 px-4 py-2 rounded-full transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Skill</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {data.skills.map(skill => (
                  <div key={skill.id} className="relative group">
                    <input
                      value={skill.name}
                      onChange={e => updateSkill(skill.id, e.target.value)}
                      className="bg-[#F5F5F7] px-4 py-2 rounded-full pr-10 focus:ring-2 focus:ring-blue-500 border-none text-sm font-medium"
                      placeholder="e.g. React"
                    />
                    <button 
                      onClick={() => onChange({ ...data, skills: data.skills.filter(s => s.id !== skill.id) })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'education' && (
             <motion.div
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: 10 }}
             className="space-y-6"
           >
             <div className="flex items-center justify-between">
               <h2 className="text-2xl font-semibold">Education</h2>
               <button 
                 onClick={addEducation}
                 className="inline-flex items-center space-x-2 text-blue-600 font-medium hover:bg-blue-50 px-4 py-2 rounded-full transition-colors"
               >
                 <PlusCircle className="w-4 h-4" />
                 <span>Add School</span>
               </button>
             </div>

             <div className="space-y-8">
               {data.education.map((edu) => (
                 <div key={edu.id} className="relative group bg-[#F5F5F7] p-6 rounded-[24px] border border-transparent hover:border-blue-200 transition-all">
                   <button 
                     onClick={() => onChange({ ...data, education: data.education.filter(e => e.id !== edu.id) })}
                     className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <Input label="School / University" value={edu.school} onChange={v => updateEducation(edu.id, { school: v })} placeholder="e.g. Stanford University" />
                     <Input label="Location" value={edu.location} onChange={v => updateEducation(edu.id, { location: v })} placeholder="Stanford, CA" />
                     <Input label="Degree" value={edu.degree} onChange={v => updateEducation(edu.id, { degree: v })} placeholder="e.g. Bachelor of Science" />
                     <Input label="Field of Study" value={edu.field} onChange={v => updateEducation(edu.id, { field: v })} placeholder="e.g. Computer Science" />
                     <div className="grid grid-cols-2 gap-2">
                       <Input label="Start Date" value={edu.startDate} onChange={v => updateEducation(edu.id, { startDate: v })} type="month" />
                       <Input label="End Date" value={edu.endDate} onChange={v => updateEducation(edu.id, { endDate: v })} type="month" disabled={edu.current} />
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </motion.div>
          )}
          {activeTab === 'custom' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1D1D1F]">Custom Sections</h2>
                  <p className="text-sm text-[#86868B] mt-1">Add awards, publications, or other unique details.</p>
                </div>
                <button 
                  onClick={addCustomSection}
                  className="inline-flex items-center space-x-2 bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all font-medium shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Section</span>
                </button>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="custom-sections-list" type="SECTION">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-8">
                      {data.customSections.map((section, sIdx) => (
                        // @ts-ignore
                        <Draggable key={section.id} draggableId={section.id} index={sIdx}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "bg-[#F5F5F7] p-6 rounded-[32px] border transition-all relative",
                                snapshot.isDragging ? "shadow-2xl border-blue-500 bg-white ring-4 ring-blue-50" : "border-transparent hover:border-gray-200"
                              )}
                            >
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center flex-1 mr-4">
                                  <div {...provided.dragHandleProps} className="p-2 -ml-2 mr-2 text-gray-400 hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <input 
                                      className="text-lg font-bold bg-transparent border-none focus:ring-0 p-0 text-[#1D1D1F] w-full placeholder-gray-400"
                                      placeholder="Section Title (e.g. Certifications)"
                                      value={section.title} 
                                      onChange={v => {
                                        const newSections = [...data.customSections];
                                        newSections[sIdx].title = v.target.value;
                                        onChange({ ...data, customSections: newSections });
                                      }} 
                                    />
                                  </div>
                                </div>
                                <button 
                                  onClick={() => {
                                    const newSections = data.customSections.filter((_, idx) => idx !== sIdx);
                                    onChange({ ...data, customSections: newSections });
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                  title="Delete Section"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <Droppable droppableId={`items-${section.id}`} type="ITEM">
                                {(provided) => (
                                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                    {section.items.map((item, iIdx) => (
                                      // @ts-ignore
                                      <Draggable key={item.id} draggableId={item.id} index={iIdx}>
                                        {(provided, snapshot) => (
                                          <div 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={cn(
                                              "relative group flex items-start",
                                              snapshot.isDragging ? "z-50" : ""
                                            )}
                                          >
                                            <div {...provided.dragHandleProps} className="mt-4 mr-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                                              <GripVertical className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 relative">
                                              <textarea
                                                value={item.content}
                                                onChange={e => {
                                                  const newSections = [...data.customSections];
                                                  newSections[sIdx].items[iIdx].content = e.target.value;
                                                  onChange({ ...data, customSections: newSections });
                                                }}
                                                className={cn(
                                                  "w-full p-4 bg-white border rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-[#1D1D1F] text-sm resize-none",
                                                  snapshot.isDragging ? "border-blue-300 shadow-lg" : "border-gray-100 hover:border-gray-200"
                                                )}
                                                placeholder="Detail goes here..."
                                                rows={2}
                                              />
                                              <button 
                                                onClick={() => {
                                                  const newSections = [...data.customSections];
                                                  newSections[sIdx].items = newSections[sIdx].items.filter(it => it.id !== item.id);
                                                  onChange({ ...data, customSections: newSections });
                                                }}
                                                className="absolute -right-2 -top-2 p-1.5 bg-white shadow-sm border border-gray-100 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                              >
                                                <Plus className="w-3.5 h-3.5 rotate-45" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    
                                    <button 
                                      onClick={() => {
                                        const newSections = [...data.customSections];
                                        newSections[sIdx].items.push({ id: crypto.randomUUID(), content: '' });
                                        onChange({ ...data, customSections: newSections });
                                      }}
                                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-[#86868B] hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center space-x-2 group/add"
                                    >
                                      <Plus className="w-4 h-4 group-hover/add:scale-110 transition-transform" />
                                      <span>Add Item</span>
                                    </button>
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              {data.customSections.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#E5E5E7] rounded-[32px] bg-[#FBFBFD] text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                    <Award className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">No Custom Sections Yet</h3>
                  <p className="text-sm text-[#86868B] mt-2 max-w-xs">
                    Showcase awards, publications, certifications or anything else that makes you stand out.
                  </p>
                  <button 
                    onClick={addCustomSection}
                    className="mt-6 inline-flex items-center space-x-2 text-blue-600 font-bold hover:underline"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create your first section</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text', disabled }: { label: string, value: string | undefined, onChange: (v: string) => void, placeholder?: string, type?: string, disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">{label}</label>
      <input
        type={type}
        disabled={disabled}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full h-10 px-3 bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg focus:ring-2 focus:ring-[#0071E3] focus:border-transparent transition-all text-[#1D1D1F] placeholder-gray-400 disabled:opacity-50 text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}
