
import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

export default function FileUploader({ onFileUpload, onClose, isProcessing }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    // Validate type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      // Small hack for common extensions if mime type is missing/generic
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
        setError('Unsupported file format. Please upload a PDF, DOCX, or Image.');
        return;
      }
    }

    onFileUpload(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-12 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold">Upload your resume</h2>
            <p className="text-[#86868B]">PDF, DOCX, or Image. AI will extract your details instantly.</p>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "relative border-2 border-dashed rounded-[24px] p-12 flex flex-col items-center justify-center space-y-4 transition-all",
                dragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50",
                error && "border-red-200 bg-red-50/10"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleChange}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />

              {!isProcessing ? (
                <>
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                    error ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                  )}>
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <button 
                      onClick={() => inputRef.current?.click()}
                      className={cn("font-semibold hover:underline", error ? "text-red-600" : "text-blue-600")}
                    >
                      Click to upload
                    </button>
                    <span className="text-gray-500 ml-1">or drag and drop</span>
                  </div>
                  <p className="text-sm text-gray-400">PDF, DOCX, JPG (Max 5MB)</p>
                </>
              ) : (
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xl font-semibold">AI is analyzing...</p>
                    <p className="text-gray-500">Extracting education, skills, and experience</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
