
import React from 'react';
import { VIEW_SECTIONS } from '../constants';
import { ViewType } from '../types';
import { Sparkles, Inbox, Calendar, Archive, Star } from 'lucide-react';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  
  const renderLink = (view: { id: string; label: string; icon: React.ReactNode }) => (
    <button
      key={view.id}
      onClick={() => onViewChange(view.id as ViewType)}
      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all duration-150 ${
        activeView === view.id
          ? 'bg-[#eef2ff] text-[#4263eb]'
          : 'text-[#4b4b4b] hover:bg-[#f1f1f4]'
      }`}
    >
      <span className={activeView === view.id ? 'text-[#4263eb]' : 'text-[#8e8e93]'}>
        {view.icon}
      </span>
      {view.label}
    </button>
  );

  return (
    <aside className="w-60 bg-[#f9f9fb] flex flex-col h-full shrink-0 z-20 select-none border-r border-[#ececeb]">
      <div className="p-6 pt-8 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></div>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
        <div className="space-y-0.5">
          <p className="px-3 mb-1.5 text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider">Ideation</p>
          {VIEW_SECTIONS.ideation.map(renderLink)}
        </div>

        <div className="space-y-0.5">
           <p className="px-3 mb-1.5 text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider">Execution</p>
           {VIEW_SECTIONS.execution.map(renderLink)}
        </div>

        <div className="space-y-0.5">
           <p className="px-3 mb-1.5 text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider">Review</p>
           {VIEW_SECTIONS.review.map(renderLink)}
        </div>
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#ececeb]">
          <div className="flex items-center gap-2 text-[#4263eb] mb-1">
             <Sparkles size={14} />
             <span className="text-[12px] font-bold">ZenFlow AI</span>
          </div>
          <div className="w-full bg-[#f1f1f4] h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#4263eb] h-1 rounded-full w-3/4"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
