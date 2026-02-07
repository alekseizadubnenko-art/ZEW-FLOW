
import React from 'react';
import { Task } from '../types';
import { Calendar, CheckCircle2, Circle, Flag } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onSelect?: (task: Task) => void;
  onToggleStatus?: (task: Task) => void;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect, onToggleStatus, onDragStart }) => {
  const isDone = task.status === 'done';

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart?.(e, task.id)}
      onClick={() => onSelect?.(task)}
      className={`bg-white border-b border-[#f1f1f4] last:border-0 p-3 hover:bg-[#f9f9fb] transition-colors cursor-grab active:cursor-grabbing group flex items-start gap-3 ${isDone ? 'opacity-75' : ''}`}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleStatus?.(task); }}
        className={`mt-0.5 shrink-0 transition-colors ${isDone ? 'text-[#28c840]' : 'text-[#d1d1d6] hover:text-[#4263eb]'}`}
      >
        {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={`text-[14px] font-medium leading-tight truncate ${isDone ? 'text-[#8e8e93] line-through' : 'text-[#1d1d1f]'}`}>
            {task.title}
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            {task.priority === 'urgent' && !isDone && (
              <span className="w-2 h-2 rounded-full bg-[#ff3b30]" title="Urgent"></span>
            )}
            <span className="text-[9px] font-bold uppercase tracking-wide text-[#8e8e93] bg-[#f1f1f4] px-2 py-0.5 rounded-full">
              {task.level}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-[11px] ${isDone ? 'text-[#d1d1d6]' : 'text-[#8e8e93]'}`}>
              <Calendar size={10} />
              <span>{task.dueDate}</span>
            </div>
          )}
          {task.sprint && (
            <span className="text-[10px] text-[#4263eb] bg-[#eef2ff] px-2 py-0.5 rounded-full font-semibold">
              {task.sprint}
            </span>
          )}
          <div className="flex items-center gap-1 text-[10px] text-[#8e8e93]">
            <Flag size={10} />
            <span className="capitalize">{task.priority}</span>
          </div>
          <div className="flex gap-1 overflow-hidden">
            {task.tags.map((tag, idx) => (
              <span key={idx} className="text-[10px] text-[#8e8e93] truncate">#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
