
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Command, ArrowRight, Loader2, Calendar, Tag, Flag } from 'lucide-react';
import { gemini } from '../services/geminiService';

interface OmniModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (parsedData: { title: string; priority: string; dueDate: string; tags: string[] }) => void;
}

const OmniModal: React.FC<OmniModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const parsedData = await gemini.parseNaturalLanguageInput(input);
    onSubmit(parsedData);
    setIsLoading(false);
    setInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 p-4">
      <div className="absolute inset-0 bg-[#1d1d1f]/10 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 rounded-full border-2 border-[#d1d1d6]"></div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="New Task..."
                className="flex-1 text-[18px] font-medium text-[#1d1d1f] placeholder-[#d1d1d6] border-none focus:outline-none focus:ring-0 bg-transparent"
              />
            </div>
            
            <div className="flex items-center gap-4 text-[#8e8e93]">
               <button type="button" className="flex items-center gap-1.5 hover:text-[#4263eb] transition-colors">
                 <Calendar size={14} />
                 <span className="text-[12px] font-medium">When</span>
               </button>
               <button type="button" className="flex items-center gap-1.5 hover:text-[#4263eb] transition-colors">
                 <Tag size={14} />
                 <span className="text-[12px] font-medium">Tags</span>
               </button>
               <button type="button" className="flex items-center gap-1.5 hover:text-[#4263eb] transition-colors">
                 <Flag size={14} />
                 <span className="text-[12px] font-medium">Priority</span>
               </button>
            </div>
          </div>

          <div className="px-5 py-3 bg-[#f9f9fb] border-t border-[#ececeb] flex justify-between items-center">
             <div className="flex items-center gap-1.5 text-[#8e8e93]">
                <Sparkles size={14} className={isLoading ? 'animate-pulse text-[#4263eb]' : ''} />
                <span className="text-[11px] font-medium uppercase tracking-wider">AI Powered Quick Entry</span>
             </div>
             <div className="flex gap-2">
               <button 
                 type="button" 
                 onClick={onClose}
                 className="px-3 py-1 text-[13px] font-semibold text-[#8e8e93] hover:text-[#1d1d1f]"
               >
                 Cancel
               </button>
               <button 
                 type="submit"
                 disabled={isLoading || !input.trim()}
                 className="px-4 py-1 bg-[#4263eb] text-white rounded-full text-[13px] font-bold hover:bg-[#364fc7] disabled:opacity-50 shadow-sm transition-all"
               >
                 {isLoading ? 'Parsing...' : 'Save'}
               </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OmniModal;
