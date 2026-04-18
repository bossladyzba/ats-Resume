
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  summary?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link?: string;
  highlights: string[];
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  customSections: {
    id: string;
    title: string;
    items: { id: string; content: string }[];
  }[];
}

export type TemplateId = 'minimal' | 'modern' | 'compact' | 'classic' | 'tech' | 'creative' | 'business' | 'portfolio' | 'developer';

export interface StyleColors {
  name: string;
  sectionHeader: string;
  jobTitle: string;
  companyName: string;
  dates: string;
  bodyText: string;
  divider: string;
}

export interface ResumeSettings {
  templateId: TemplateId;
  fontSize: 'small' | 'medium' | 'large';
  lineSpacing: 'tight' | 'relaxed' | 'wide';
  fontFamily: 'serif' | 'sans' | 'mono' | 'geometric' | 'slab';
  colors: StyleColors;
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  optimizationMode: 'one-page' | 'multi-page';
  sectionOrder?: string[];
}

export interface ATSResult {
  score: number;
  keywordMatch: number;
  suggestions: {
    id: string;
    type: 'critical' | 'improvement' | 'good';
    message: string;
    action?: string;
  }[];
}
