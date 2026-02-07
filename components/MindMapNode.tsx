
import React from 'react';
import { Brain, CheckCircle2, Circle, Plus, Briefcase, Target, CheckSquare } from 'lucide-react';
import { NodeData, TaskLevel } from '../types';

interface MindMapNodeProps {
  data: NodeData & {
    onAiExpand?: () => void;
    onConvertToTask?: (level: TaskLevel) => void;
    onAddChild?: () => void;
  };
  isDragging?: boolean;
}

const MindMapNode: React.FC<MindMapNodeProps> = ({ data, isDragging }) => {
  const isDone = data.status === 'done';
  const isTask = data.isTask;

  return (
    <div className={`
      relative group px-4 py-3 rounded-2xl border transition-all min-w-[160px] max-w-[200px] select-none
      ${isDragging 
        ? 'shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border-[#4263eb] bg-white scale-105 opacity-90' 
        : 'shadow-sm bg-white'
      }
      ${isDone ? 'border-[#e2e2e7] bg-[#f9f9fb]' : 'border-[#ececeb] hover:border-[#4263eb]'}
    `}>
      <div className="flex items-center justify-between mb-2 pointer-events-none">
        <div className="flex items-center gap-2">
          {isTask ? (
            <span className={isDone ? 'text-[#28c840]' : 'text-[#8e8e93]'}>
              {isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </span>
          ) : (
            <Brain size={14} className="text-[#8e8e93]" />
          )}
          <span className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wide">
            {isTask ? data.status?.replace('-', ' ') : 'Idea'}
          </span>
        </div>

        <div className="flex gap-1 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); data.onAddChild?.(); }}
            className="p-1 hover:bg-[#f1f1f4] rounded text-[#8e8e93] hover:text-[#4263eb] transition-colors"
            title="Add Sub-task"
          >
            <Plus size={14} />
          </button>
           <button 
            onClick={(e) => { e.stopPropagation(); data.onAiExpand?.(); }}
            className="p-1 hover:bg-[#f1f1f4] rounded text-[#8e8e93] hover:text-[#4263eb] transition-colors"
            title="Expand with AI"
          >
            <Brain size={14} />
          </button>
          {!isTask && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); data.onConvertToTask?.('project'); }}
                className="p-1 hover:bg-[#eef2ff] rounded text-[#8e8e93] hover:text-[#4263eb] transition-colors"
                title="Convert to Project"
              >
                <Briefcase size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); data.onConvertToTask?.('goal'); }}
                className="p-1 hover:bg-[#eef2ff] rounded text-[#8e8e93] hover:text-[#4263eb] transition-colors"
                title="Convert to Goal"
              >
                <Target size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); data.onConvertToTask?.('task'); }}
                className="p-1 hover:bg-[#eef2ff] rounded text-[#8e8e93] hover:text-[#4263eb] transition-colors"
                title="Convert to Task"
              >
                <CheckSquare size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`text-[14px] font-semibold leading-snug pointer-events-none ${isDone ? 'text-[#8e8e93] line-through' : 'text-[#1d1d1f]'}`}>
        {data.label}
      </div>

      {(data.tags && data.tags.length > 0) && (
        <div className="flex flex-wrap gap-1 mt-2 pointer-events-none">
          {data.tags.slice(0, 2).map((tag, i) => (
            <span key={i} className="text-[9px] font-medium text-[#8e8e93]">#{tag}</span>
          ))}
        </div>
      )}

      {data.domain && (
        <div className="mt-2 text-[10px] font-medium text-[#c0c0c7] uppercase tracking-wide">
          {data.domain}
        </div>
      )}
      
      {isTask && data.priority === 'urgent' && !isDone && (
        <div className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-[#ff3b30] border-2 border-white shadow-sm animate-pulse" />
      )}
    </div>
  );
};

export default MindMapNode;
