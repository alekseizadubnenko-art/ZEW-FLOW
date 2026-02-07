
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TaskCard from './components/TaskCard';
import MindMapNode from './components/MindMapNode';
import OmniModal from './components/OmniModal';
import { 
  Task, 
  ViewType, 
  DiagramNode, 
  DiagramEdge, 
  Status,
  Priority 
} from './types';
import { 
  INITIAL_TASKS, 
  INITIAL_NODES, 
  INITIAL_EDGES 
} from './constants';
import { 
  Plus, 
  Network,
  MoreHorizontal,
  Zap
} from 'lucide-react';
import { gemini } from './services/geminiService';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [nodes, setNodes] = useState<DiagramNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<DiagramEdge[]>(INITIAL_EDGES);
  const [activeView, setActiveView] = useState<ViewType>('mindmap');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isOmniOpen, setIsOmniOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  // Canvas State (Mind Map)
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  
  // Kanban Drag State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<Status | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOmniOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Mind Map Drag & Pan Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setViewOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    } else if (draggedNode) {
      setNodes(prev => prev.map(n => 
        n.id === draggedNode 
          ? { ...n, position: { x: n.position.x + e.movementX, y: n.position.y + e.movementY } } 
          : n
      ));
    }
  }, [isPanning, draggedNode]);

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
  };

  // --- Kanban Drag & Drop Logic ---
  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverColumn = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    if (dropTargetStatus !== status) {
      setDropTargetStatus(status);
    }
  };

  const handleTaskDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId') || draggedTaskId;
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== status) {
        handleTaskUpdate({ ...task, status });
      }
    }
    setDraggedTaskId(null);
    setDropTargetStatus(null);
  };

  const handleDragLeaveColumn = () => {
    setDropTargetStatus(null);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setNodes(prev => prev.map(n => {
      if (n.data.taskId === updatedTask.id) {
        return {
          ...n,
          data: { ...n.data, status: updatedTask.status, priority: updatedTask.priority }
        };
      }
      return n;
    }));
  };

  const handleToggleTaskStatus = (task: Task) => {
    const newStatus: Status = task.status === 'done' ? 'todo' : 'done';
    handleTaskUpdate({ ...task, status: newStatus });
  };

  const handleAiExpandNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setIsAiLoading(true);
    const suggestions = await gemini.suggestSubNodes(node.data.label);
    
    const newNodes: DiagramNode[] = suggestions.map((label, idx) => {
      const angle = (idx / suggestions.length) * Math.PI * 1.2 - (Math.PI * 0.6);
      const radius = 220;
      return {
        id: `ai-${Date.now()}-${idx}`,
        position: { 
          x: node.position.x + Math.sin(angle) * radius, 
          y: node.position.y + Math.cos(angle) * radius
        },
        data: { label, tags: [] }
      };
    });

    const newEdges: DiagramEdge[] = newNodes.map(newNode => ({
      id: `e-${node.id}-${newNode.id}`,
      source: node.id,
      target: newNode.id
    }));

    setNodes(prev => [...prev, ...newNodes]);
    setEdges(prev => [...prev, ...newEdges]);
    setIsAiLoading(false);
  };

  const handleAddSubNode = (parentId: string) => {
    setActiveParentId(parentId);
    setIsOmniOpen(true);
  };

  const handlePushToExecution = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.data.isTask) return;

    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: node.data.label,
      description: 'Promoted from Mind Map',
      status: 'todo',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      tags: node.data.tags || ['Idea']
    };

    setTasks(prev => [newTask, ...prev]);
    setNodes(prev => prev.map(n => 
      n.id === nodeId 
        ? { 
            ...n, 
            data: { 
              ...n.data, 
              isTask: true, 
              taskId: newTask.id,
              status: newTask.status,
              priority: newTask.priority
            } 
          }
        : n
    ));
  };

  const handleOmniSubmit = (parsedData: { title: string; priority: string; dueDate: string; tags: string[] }) => {
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: parsedData.title,
      description: '',
      status: 'todo',
      priority: (parsedData.priority as Priority) || 'medium',
      dueDate: parsedData.dueDate,
      tags: parsedData.tags
    };

    setTasks(prev => [newTask, ...prev]);
    
    if (activeView === 'mindmap') {
      let newNodePos = { x: 500 - viewOffset.x, y: 300 - viewOffset.y };
      const parentNode = activeParentId ? nodes.find(n => n.id === activeParentId) : null;
      
      if (parentNode) {
        // Position relative to parent
        newNodePos = {
          x: parentNode.position.x + 220,
          y: parentNode.position.y + (Math.random() * 100 - 50)
        };
      }

      const newNode: DiagramNode = {
        id: `n-${Date.now()}`,
        position: newNodePos,
        data: {
          label: newTask.title,
          isTask: true,
          taskId: newTask.id,
          status: newTask.status,
          priority: newTask.priority,
          tags: newTask.tags
        }
      };

      setNodes(prev => [...prev, newNode]);

      if (activeParentId) {
        setEdges(prev => [...prev, {
          id: `e-${activeParentId}-${newNode.id}`,
          source: activeParentId,
          target: newNode.id
        }]);
      }
    }
    setActiveParentId(null);
  };

  const renderMindMap = () => (
    <div 
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-full bg-[#f9f9fb] overflow-hidden canvas-bg select-none ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
    >
      <div className="absolute top-6 left-6 z-10 bg-white/50 backdrop-blur-md px-3 py-2 rounded-lg border border-[#ececeb] text-[10px] text-[#8e8e93] font-bold uppercase tracking-wider">
        Alt+Drag to Pan • Drag Nodes to Move
      </div>

      <div 
        className="absolute w-full h-full transition-transform duration-75 ease-out"
        style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)` }}
      >
        <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            const sx = sourceNode.position.x + 80;
            const sy = sourceNode.position.y + 20;
            const tx = targetNode.position.x + 80;
            const ty = targetNode.position.y;
            return (
              <path
                key={edge.id}
                d={`M${sx},${sy} C${sx},${(sy + ty) / 2} ${tx},${(sy + ty) / 2} ${tx},${ty}`}
                stroke="#e2e2e7" 
                strokeWidth="1.5"
                fill="none"
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {nodes.map(node => (
          <div 
            key={node.id} 
            style={{ left: node.position.x, top: node.position.y }} 
            className={`absolute transform -translate-x-1/2 cursor-grab active:cursor-grabbing ${draggedNode === node.id ? 'z-50' : 'z-10'}`}
            onMouseDown={(e) => {
              if (e.button === 0 && !e.altKey) {
                e.stopPropagation();
                setDraggedNode(node.id);
              }
            }}
          >
            <MindMapNode 
              data={{ 
                ...node.data, 
                onAiExpand: () => handleAiExpandNode(node.id),
                onConvertToTask: () => handlePushToExecution(node.id),
                onAddChild: () => handleAddSubNode(node.id)
              }} 
              isDragging={draggedNode === node.id}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderKanban = () => {
    const columns: Status[] = ['todo', 'in-progress', 'done'];
    return (
      <div className="flex gap-4 h-full p-8 overflow-x-auto bg-[#f9f9fb] animate-in fade-in duration-300">
        {columns.map(status => {
          const isOver = dropTargetStatus === status;
          const filteredTasks = tasks.filter(t => t.status === status);
          
          return (
            <div 
              key={status} 
              onDragOver={(e) => handleDragOverColumn(e, status)}
              onDrop={(e) => handleTaskDrop(e, status)}
              onDragLeave={handleDragLeaveColumn}
              className={`flex-shrink-0 w-80 flex flex-col h-full px-3 rounded-3xl transition-colors duration-200 ${isOver ? 'bg-[#ececeb]/50' : 'bg-transparent'}`}
            >
              <div className="flex items-center justify-between mb-4 px-2 pt-2">
                 <h3 className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider">{status.replace('-', ' ')}</h3>
                 <span className="text-[11px] font-bold text-[#d1d1d6]">{filteredTasks.length}</span>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl pb-10 scrollbar-hide">
                {filteredTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-xl shadow-sm border border-[#ececeb] overflow-hidden">
                    <TaskCard 
                      task={task} 
                      onToggleStatus={handleToggleTaskStatus}
                      onDragStart={handleTaskDragStart}
                    />
                  </div>
                ))}

                {/* Drop Placeholder */}
                {isOver && (
                  <div className="border-2 border-dashed border-[#4263eb]/30 bg-[#eef2ff]/50 h-20 rounded-xl flex items-center justify-center animate-pulse">
                    <div className="w-8 h-1.5 bg-[#4263eb]/20 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTaskLayout = (title: string, taskList: Task[]) => (
    <div className="h-full bg-white flex flex-col p-12 overflow-y-auto animate-in fade-in duration-300">
      <div className="max-w-3xl w-full mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h2 className="text-[32px] font-bold tracking-tight text-[#1d1d1f] font-outfit">{title}</h2>
          <button className="p-2 hover:bg-[#f1f1f4] rounded-full text-[#8e8e93]">
            <MoreHorizontal size={20} />
          </button>
        </header>
        <div className="space-y-0.5">
          {taskList.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onToggleStatus={handleToggleTaskStatus}
              onDragStart={handleTaskDragStart}
            />
          ))}
          <button 
            onClick={() => setIsOmniOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-3 text-[#d1d1d6] hover:text-[#4263eb] transition-colors group mt-2"
          >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-[14px] font-medium">New Task</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f9f9fb]">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white rounded-l-[32px] shadow-[0_0_40px_rgba(0,0,0,0.02)] border-l border-[#ececeb]">
        <div className="flex-1 overflow-hidden relative">
          {activeView === 'mindmap' && renderMindMap()}
          {activeView === 'list' && renderTaskLayout('Task List', tasks)}
          {activeView === 'kanban' && renderKanban()}
          {activeView === 'flowchart' && (
            <div className="flex items-center justify-center h-full text-[#8e8e93] font-outfit">
              <div className="text-center">
                <Network size={48} className="mx-auto mb-4 opacity-10" />
                <h3 className="text-xl font-bold mb-1">Coming Soon</h3>
                <p className="text-[14px]">The Flowchart builder is under development.</p>
              </div>
            </div>
          )}
          {activeView === 'gantt' && renderTaskLayout('Timeline', tasks)}
          {activeView === 'settings' && (
             <div className="p-16 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-[32px] font-bold mb-8 font-outfit">Settings</h2>
                <div className="bg-[#f9f9fb] p-6 rounded-2xl border border-[#ececeb]">
                   <p className="text-[14px] font-medium text-[#4b4b4b]">ZenFlow AI Engine</p>
                   <p className="text-[12px] text-[#8e8e93] mt-1 mb-4">Gemini 3 Pro enabled for intelligent task parsing.</p>
                   <button className="px-4 py-2 bg-white border border-[#ececeb] rounded-lg text-[13px] font-bold text-[#1d1d1f] shadow-sm hover:bg-[#f1f1f4] transition-colors">
                      Check for Updates
                   </button>
                </div>
             </div>
          )}

          <button 
             onClick={() => {
                setActiveParentId(null);
                setIsOmniOpen(true);
             }}
             className="absolute bottom-10 right-10 w-12 h-12 bg-[#4263eb] text-white rounded-full shadow-[0_8px_20px_-4px_rgba(66,99,235,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
          >
             <Plus size={24} className="group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>
      </main>

      <OmniModal 
        isOpen={isOmniOpen} 
        onClose={() => {
          setIsOmniOpen(false);
          setActiveParentId(null);
        }} 
        onSubmit={handleOmniSubmit}
      />
      
      {isAiLoading && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-[#1d1d1f] text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
            <Zap size={14} className="text-[#4263eb] animate-pulse" />
            <span className="text-[13px] font-bold">ZenFlow AI is working...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
