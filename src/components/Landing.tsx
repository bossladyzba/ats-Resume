
import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, FileText, Upload, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingProps {
  onChoice: (flow: 'general' | 'role' | 'upload' | 'resume') => void;
  hasDraft: boolean;
}

export default function Landing({ onChoice, hasDraft }: LandingProps) {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center p-6 text-[#1D1D1F]">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl w-full text-center space-y-12"
      >
        <div className="space-y-4">
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-semibold tracking-tight">
            Design your professional future.
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-[#86868B] max-w-2xl mx-auto">
            Build a sleek, ATS-optimized resume with AI that speaks your achievements.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.button
            variants={itemVariants}
            onClick={() => onChoice('general')}
            className="group relative bg-white p-8 rounded-[24px] border border-black/5 shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
              <FileText className="w-24 h-24" />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">General Resume</h3>
              <p className="text-[#86868B]">A versatile, multi-purpose resume that highlights your core strengths across different roles.</p>
              <div className="flex items-center text-blue-600 font-medium pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Get started →
              </div>
            </div>
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => onChoice('role')}
            className="group relative bg-white p-8 rounded-[24px] border border-black/5 shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
              <Briefcase className="w-24 h-24" />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Role-Specific</h3>
              <p className="text-[#86868B]">Tailor your resume and generate a perfect cover letter for a specific job description.</p>
              <div className="flex items-center text-purple-600 font-medium pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Get started →
              </div>
            </div>
          </motion.button>
        </div>

        <motion.div variants={itemVariants} className="pt-8 flex flex-col items-center space-y-4">
          {hasDraft && (
            <button 
              onClick={() => onChoice('general')}
              className="inline-flex items-center space-x-3 text-blue-600 bg-blue-50/50 px-8 py-4 rounded-full border border-blue-100 hover:bg-blue-50 transition-all font-medium mb-4 animate-pulse shadow-sm"
            >
              <Sparkles className="w-5 h-5" />
              <span>Continue your last resume draft</span>
            </button>
          )}

          <button 
            onClick={() => onChoice('upload')}
            className="inline-flex items-center space-x-2 text-[#86868B] hover:text-[#1D1D1F] transition-colors bg-white/50 px-6 py-3 rounded-full border border-black/5"
          >
            <Upload className="w-4 h-4" />
            <span>Already have one? Upload and improve it.</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
