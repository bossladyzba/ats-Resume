
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Download, Loader2, Sparkles, FileText, Check } from 'lucide-react';
import { ResumeData } from '../types';
import { generateCoverLetter } from '../services/geminiService';
import { cn } from '../lib/utils';

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  jobDescription: string;
}

export default function CoverLetterModal({ isOpen, onClose, resumeData, jobDescription }: CoverLetterModalProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !content) {
      handleGenerate();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsLoading(true);
    const letter = await generateCoverLetter(resumeData, jobDescription);
    setContent(letter);
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "Cover_Letter.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[32px] w-full max-w-3xl h-[85vh] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col relative"
          >
            {/* Header */}
            <header className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Tailored Cover Letter</h2>
                  <p className="text-sm text-gray-500">AI-generated based on your resume and job description</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#FBFBFD]">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Crafting your story...</p>
                    <p className="text-gray-500">Matching your highlights to the role requirements</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto bg-white p-12 rounded-2xl shadow-sm border border-gray-100 min-h-full font-serif text-[15px] leading-relaxed text-[#1D1D1F] whitespace-pre-wrap">
                  {content}
                </div>
              )}
            </main>

            {/* Footer */}
            <footer className="p-8 border-t border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="px-6 py-3 text-blue-600 font-semibold hover:bg-blue-50 rounded-full transition-all flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Regenerate</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCopy}
                  disabled={isLoading || !content}
                  className="px-6 py-3 bg-gray-100 text-[#1D1D1F] font-semibold rounded-full hover:bg-gray-200 transition-all flex items-center space-x-2"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isLoading || !content}
                  className="px-8 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-all flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .txt</span>
                </button>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
