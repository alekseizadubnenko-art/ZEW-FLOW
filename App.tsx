
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
  Priority,
  TaskLevel
} from './types';
import { 
  INITIAL_TASKS, 
  INITIAL_NODES, 
  INITIAL_EDGES,
  INITIAL_FLOW_NODES,
  INITIAL_FLOW_EDGES
} from './constants';
import { 
  Plus, 
  MoreHorizontal,
  Zap,
  Layers,
  Filter,
  CalendarRange,
  Link2
} from 'lucide-react';
import { gemini } from './services/geminiService';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [nodes, setNodes] = useState<DiagramNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<DiagramEdge[]>(INITIAL_EDGES);
  const [flowNodes, setFlowNodes] = useState<DiagramNode[]>(INITIAL_FLOW_NODES);
  const [flowEdges, setFlowEdges] = useState<DiagramEdge[]>(INITIAL_FLOW_EDGES);
  const [activeView, setActiveView] = useState<ViewType>('mindmap');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isOmniOpen, setIsOmniOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  const [mindMapDomain, setMindMapDomain] = useState('Product');
  const [mindMapTags, setMindMapTags] = useState<string[]>(['Strategy']);
  const [mindMapType, setMindMapType] = useState<'topic' | 'action' | 'note'>('topic');
  const [newTagInput, setNewTagInput] = useState('');

  // Canvas State (Mind Map)
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  // Canvas State (Flowchart)
  const [flowOffset, setFlowOffset] = useState({ x: 0, y: 0 });
  const [isFlowPanning, setIsFlowPanning] = useState(false);
  const [draggedFlowNode, setDraggedFlowNode] = useState<string | null>(null);
  const [flowConnectFrom, setFlowConnectFrom] = useState<string | null>(null);
  
  // Kanban Drag State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<Status | null>(null);

  // List Filters
  const [listStatusFilter, setListStatusFilter] = useState<Status | 'all'>('all');
  const [listPriorityFilter, setListPriorityFilter] = useState<Priority | 'all'>('all');
  const [listSprintFilter, setListSprintFilter] = useState<string>('all');
  const [listSearch, setListSearch] = useState('');

  // Settings
  const [customFields, setCustomFields] = useState<{ name: string; type: string }[]>([
    { name: 'Effort', type: 'Number' },
    { name: 'Owner', type: 'Person' }
  ]);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOmniOpen(true);
      }
      if (e.key === 'Escape') {
        setFlowConnectFrom(null);
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

  const handleAddMindMapTag = () => {
    const cleaned = newTagInput.trim();
    if (!cleaned) return;
    setMindMapTags(prev => Array.from(new Set([...prev, cleaned])));
    setNewTagInput('');
  };

  // --- Flowchart Drag & Connect Logic ---
  const handleFlowMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsFlowPanning(true);
    }
  };

  const handleFlowMouseMove = useCallback((e: React.MouseEvent) => {
    if (isFlowPanning) {
      setFlowOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    } else if (draggedFlowNode) {
      setFlowNodes(prev => prev.map(n =>
        n.id === draggedFlowNode
          ? { ...n, position: { x: n.position.x + e.movementX, y: n.position.y + e.movementY } }
          : n
      ));
    }
  }, [isFlowPanning, draggedFlowNode]);

  const handleFlowMouseUp = () => {
    setIsFlowPanning(false);
    setDraggedFlowNode(null);
  };

  const handleFlowNodeClick = (nodeId: string) => {
    if (!flowConnectFrom) {
      setFlowConnectFrom(nodeId);
      return;
    }
    if (flowConnectFrom === nodeId) {
      setFlowConnectFrom(null);
      return;
    }
    const newEdge: DiagramEdge = {
      id: `fe-${flowConnectFrom}-${nodeId}-${Date.now()}`,
      source: flowConnectFrom,
      target: nodeId
    };
    setFlowEdges(prev => [...prev, newEdge]);
    setFlowConnectFrom(null);
  };

  const handleAddFlowNode = (type: 'topic' | 'action' | 'note') => {
    const newNode: DiagramNode = {
      id: `f-${Date.now()}`,
      position: { x: 400 - flowOffset.x, y: 200 - flowOffset.y },
      data: { label: type === 'action' ? 'New Step' : type === 'note' ? 'Decision' : 'Milestone', type }
    };
    setFlowNodes(prev => [...prev, newNode]);
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
          data: { ...n.data, status: updatedTask.status, priority: updatedTask.priority, level: updatedTask.level }
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
        data: { 
          label, 
          tags: mindMapTags, 
          domain: mindMapDomain,
          type: mindMapType
        }
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

  const handlePushToExecution = (nodeId: string, level: TaskLevel) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.data.isTask) return;

    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: node.data.label,
      description: 'Promoted from Mind Map',
      status: 'todo',
      priority: 'medium',
      level,
      startDate,
      dueDate: new Date().toISOString().split('T')[0],
      tags: node.data.tags || ['Idea'],
      sprint: level === 'project' ? 'Sprint 0' : 'Sprint 1'
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
              priority: newTask.priority,
              level: newTask.level
            } 
          }
        : n
    ));
  };

  const handleOmniSubmit = (parsedData: { title: string; priority: string; dueDate: string; tags: string[] }) => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const fallbackDue = parsedData.dueDate || todayString;
    const startDate = parsedData.dueDate
      ? new Date(new Date(parsedData.dueDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : todayString;
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: parsedData.title,
      description: '',
      status: 'todo',
      priority: (parsedData.priority as Priority) || 'medium',
      level: 'task',
      startDate,
      dueDate: fallbackDue,
      tags: parsedData.tags,
      sprint: 'Sprint 1'
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
          tags: newTask.tags,
          domain: mindMapDomain,
          type: mindMapType,
          level: newTask.level
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
      <div className="absolute top-6 right-6 z-10 bg-white/70 backdrop-blur-md px-4 py-3 rounded-2xl border border-[#ececeb] text-[11px] text-[#4b4b4b] shadow-sm w-[300px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e93]">Mind Map Properties</span>
          <span className="text-[10px] text-[#4263eb] font-semibold">Interactive</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-[#8e8e93] w-14">Domain</label>
            <select
              value={mindMapDomain}
              onChange={(e) => setMindMapDomain(e.target.value)}
              className="flex-1 text-[12px] border border-[#ececeb] rounded-lg px-2 py-1 bg-white"
            >
              {['Product', 'Design', 'Engineering', 'Marketing', 'Operations'].map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-[#8e8e93] w-14">Type</label>
            <div className="flex-1 flex gap-2">
              {(['topic', 'action', 'note'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setMindMapType(type)}
                  className={`flex-1 text-[11px] px-2 py-1 rounded-lg border ${mindMapType === type ? 'bg-[#eef2ff] border-[#4263eb] text-[#4263eb]' : 'border-[#ececeb] text-[#8e8e93]'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-[#8e8e93] w-14">Tags</label>
            <div className="flex-1 flex gap-2">
              <input
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMindMapTag();
                  }
                }}
                placeholder="Add interest"
                className="flex-1 text-[12px] border border-[#ececeb] rounded-lg px-2 py-1"
              />
              <button
                onClick={handleAddMindMapTag}
                className="px-2 py-1 text-[11px] bg-[#4263eb] text-white rounded-lg"
              >
                Add
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {mindMapTags.map(tag => (
              <span key={tag} className="text-[10px] text-[#4263eb] bg-[#eef2ff] px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
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
                onConvertToTask: (level) => handlePushToExecution(node.id, level),
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
    const columns: Status[] = ['backlog', 'todo', 'in-progress', 'done'];
    return (
      <div className="flex flex-col h-full bg-[#f9f9fb] animate-in fade-in duration-300">
        <div className="px-8 pt-6 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-[#1d1d1f]">Agile Board</h2>
            <p className="text-[12px] text-[#8e8e93]">Backlog, sprint execution, and done tracking.</p>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#8e8e93]">
            <Layers size={14} />
            <span>Active Sprint: Sprint 1</span>
          </div>
        </div>
        <div className="flex gap-4 h-full px-8 pb-8 overflow-x-auto">
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
      </div>
    );
  };

  const renderListView = () => {
    const sprints = Array.from(new Set(tasks.map(task => task.sprint).filter(Boolean))) as string[];
    const filtered = tasks.filter(task => {
      if (listStatusFilter !== 'all' && task.status !== listStatusFilter) return false;
      if (listPriorityFilter !== 'all' && task.priority !== listPriorityFilter) return false;
      if (listSprintFilter !== 'all' && task.sprint !== listSprintFilter) return false;
      if (listSearch && !task.title.toLowerCase().includes(listSearch.toLowerCase())) return false;
      return true;
    });

    const byParent = filtered.reduce<Record<string, Task[]>>((acc, task) => {
      const key = task.parentId || 'root';
      acc[key] = acc[key] || [];
      acc[key].push(task);
      return acc;
    }, {});

    const renderTree = (parentId: string, depth: number) => {
      const items = byParent[parentId] || [];
      return items.map(task => (
        <div key={task.id} className="space-y-0.5">
          <div style={{ paddingLeft: depth * 20 }} className="rounded-lg overflow-hidden">
            <TaskCard 
              task={task} 
              onToggleStatus={handleToggleTaskStatus}
              onDragStart={handleTaskDragStart}
            />
          </div>
          {renderTree(task.id, depth + 1)}
        </div>
      ));
    };

    return (
      <div className="h-full bg-white flex flex-col p-10 overflow-y-auto animate-in fade-in duration-300">
        <div className="max-w-5xl w-full mx-auto">
          <header className="mb-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-[28px] font-bold tracking-tight text-[#1d1d1f] font-outfit">Hierarchical Task List</h2>
                <p className="text-[12px] text-[#8e8e93]">Organize projects, goals, and tasks with filters.</p>
              </div>
              <button className="p-2 hover:bg-[#f1f1f4] rounded-full text-[#8e8e93]">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#8e8e93] bg-[#f9f9fb] border border-[#ececeb] rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <Filter size={14} />
                <span className="font-semibold">Filters</span>
              </div>
              <input
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search tasks..."
                className="px-3 py-1 rounded-lg border border-[#ececeb] text-[12px]"
              />
              <select
                value={listStatusFilter}
                onChange={(e) => setListStatusFilter(e.target.value as Status | 'all')}
                className="px-3 py-1 rounded-lg border border-[#ececeb] text-[12px]"
              >
                <option value="all">All Status</option>
                {(['backlog', 'todo', 'in-progress', 'done'] as Status[]).map(status => (
                  <option key={status} value={status}>{status.replace('-', ' ')}</option>
                ))}
              </select>
              <select
                value={listPriorityFilter}
                onChange={(e) => setListPriorityFilter(e.target.value as Priority | 'all')}
                className="px-3 py-1 rounded-lg border border-[#ececeb] text-[12px]"
              >
                <option value="all">All Priorities</option>
                {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
              <select
                value={listSprintFilter}
                onChange={(e) => setListSprintFilter(e.target.value)}
                className="px-3 py-1 rounded-lg border border-[#ececeb] text-[12px]"
              >
                <option value="all">All Sprints</option>
                {sprints.map(sprint => (
                  <option key={sprint} value={sprint}>{sprint}</option>
                ))}
              </select>
            </div>
          </header>
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center text-[#8e8e93] py-12">No tasks match the selected filters.</div>
            ) : (
              renderTree('root', 0)
            )}
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
  };

  const renderGantt = () => {
    const parseDate = (value: string) => new Date(`${value}T00:00:00`);
    const allDates = tasks.flatMap(task => [task.startDate, task.dueDate]).filter(Boolean);
    const minDate = allDates.length ? parseDate(allDates.sort()[0]) : new Date();
    const maxDate = allDates.length ? parseDate(allDates.sort().slice(-1)[0]) : new Date();
    const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const getOffset = (date: string) => {
      const diff = parseDate(date).getTime() - minDate.getTime();
      return Math.max(0, Math.floor((diff / (1000 * 60 * 60 * 24)) * 8));
    };

    const getWidth = (start: string, end: string) => {
      const diff = parseDate(end).getTime() - parseDate(start).getTime();
      return Math.max(24, Math.floor((diff / (1000 * 60 * 60 * 24)) * 8) + 32);
    };

    return (
      <div className="h-full bg-white flex flex-col p-10 overflow-y-auto animate-in fade-in duration-300">
        <div className="max-w-5xl w-full mx-auto">
          <header className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-[28px] font-bold tracking-tight text-[#1d1d1f] font-outfit">Gantt Timeline</h2>
              <p className="text-[12px] text-[#8e8e93]">Visualize dependencies, milestones, and delivery windows.</p>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[#8e8e93]">
              <CalendarRange size={16} />
              <span>{totalDays} day range</span>
            </div>
          </header>
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-4">
                <div className="w-52">
                  <div className="text-[13px] font-semibold text-[#1d1d1f] truncate">{task.title}</div>
                  <div className="text-[11px] text-[#8e8e93] capitalize">{task.level}</div>
                </div>
                <div className="flex-1 relative h-8 bg-[#f9f9fb] rounded-full overflow-hidden">
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-4 rounded-full ${task.status === 'done' ? 'bg-[#28c840]' : 'bg-[#4263eb]'}`}
                    style={{
                      left: `${getOffset(task.startDate)}px`,
                      width: `${getWidth(task.startDate, task.dueDate)}px`
                    }}
                  />
                  <span
                    className="absolute text-[10px] text-[#8e8e93] top-1/2 -translate-y-1/2"
                    style={{ left: `${getOffset(task.startDate) + 8}px` }}
                  >
                    {task.startDate} → {task.dueDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFlowchart = () => (
    <div 
      onMouseDown={handleFlowMouseDown}
      onMouseMove={handleFlowMouseMove}
      onMouseUp={handleFlowMouseUp}
      onMouseLeave={handleFlowMouseUp}
      className={`relative w-full h-full bg-[#f9f9fb] overflow-hidden select-none ${isFlowPanning ? 'cursor-grabbing' : 'cursor-default'}`}
    >
      <div className="absolute top-6 left-6 z-10 bg-white/70 backdrop-blur-md px-3 py-2 rounded-lg border border-[#ececeb] text-[10px] text-[#8e8e93] font-bold uppercase tracking-wider">
        Click nodes to connect • Alt+Drag to Pan • Drag to Move
      </div>
      <div className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-[#ececeb] shadow-sm flex items-center gap-2">
        <button
          onClick={() => handleAddFlowNode('topic')}
          className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-white border border-[#ececeb] hover:bg-[#f1f1f4]"
        >
          Add Milestone
        </button>
        <button
          onClick={() => handleAddFlowNode('action')}
          className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-white border border-[#ececeb] hover:bg-[#f1f1f4]"
        >
          Add Step
        </button>
        <button
          onClick={() => handleAddFlowNode('note')}
          className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-white border border-[#ececeb] hover:bg-[#f1f1f4]"
        >
          Add Decision
        </button>
      </div>

      <div 
        className="absolute w-full h-full transition-transform duration-75 ease-out"
        style={{ transform: `translate(${flowOffset.x}px, ${flowOffset.y}px)` }}
      >
        <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
          {flowEdges.map(edge => {
            const sourceNode = flowNodes.find(n => n.id === edge.source);
            const targetNode = flowNodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            const sx = sourceNode.position.x + 80;
            const sy = sourceNode.position.y + 20;
            const tx = targetNode.position.x + 80;
            const ty = targetNode.position.y;
            return (
              <path
                key={edge.id}
                d={`M${sx},${sy} C${sx},${(sy + ty) / 2} ${tx},${(sy + ty) / 2} ${tx},${ty}`}
                stroke="#cbd5ff"
                strokeWidth="2"
                fill="none"
              />
            );
          })}
        </svg>

        {flowNodes.map(node => (
          <div 
            key={node.id} 
            style={{ left: node.position.x, top: node.position.y }} 
            className={`absolute transform -translate-x-1/2 cursor-grab active:cursor-grabbing ${draggedFlowNode === node.id ? 'z-50' : 'z-10'}`}
            onMouseDown={(e) => {
              if (e.button === 0 && !e.altKey) {
                e.stopPropagation();
                setDraggedFlowNode(node.id);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleFlowNodeClick(node.id);
            }}
          >
            <div className={`px-4 py-3 rounded-2xl border shadow-sm bg-white min-w-[160px] max-w-[200px] ${flowConnectFrom === node.id ? 'border-[#4263eb]' : 'border-[#ececeb]'}`}>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-[#8e8e93] font-bold mb-1">
                <span>{node.data.type || 'step'}</span>
                {flowConnectFrom === node.id && (
                  <Link2 size={12} className="text-[#4263eb]" />
                )}
              </div>
              <div className="text-[14px] font-semibold text-[#1d1d1f]">{node.data.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f9f9fb]">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white rounded-l-[32px] shadow-[0_0_40px_rgba(0,0,0,0.02)] border-l border-[#ececeb]">
        <div className="flex-1 overflow-hidden relative">
          {activeView === 'mindmap' && renderMindMap()}
          {activeView === 'list' && renderListView()}
          {activeView === 'kanban' && renderKanban()}
          {activeView === 'flowchart' && renderFlowchart()}
          {activeView === 'gantt' && renderGantt()}
          {activeView === 'settings' && (
             <div className="p-16 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-[32px] font-bold mb-8 font-outfit">Settings</h2>
                <div className="grid gap-6">
                  <div className="bg-[#f9f9fb] p-6 rounded-2xl border border-[#ececeb]">
                     <p className="text-[14px] font-medium text-[#4b4b4b]">ZenFlow AI Engine</p>
                     <p className="text-[12px] text-[#8e8e93] mt-1 mb-4">Gemini 3 Pro enabled for intelligent task parsing.</p>
                     <button className="px-4 py-2 bg-white border border-[#ececeb] rounded-lg text-[13px] font-bold text-[#1d1d1f] shadow-sm hover:bg-[#f1f1f4] transition-colors">
                        Check for Updates
                     </button>
                  </div>
                  <div className="bg-[#f9f9fb] p-6 rounded-2xl border border-[#ececeb]">
                    <p className="text-[14px] font-medium text-[#4b4b4b]">Custom Fields</p>
                    <p className="text-[12px] text-[#8e8e93] mt-1 mb-4">Extend tasks with tailored metadata for each project.</p>
                    <div className="space-y-2 mb-4">
                      {customFields.map((field, index) => (
                        <div key={`${field.name}-${index}`} className="flex items-center justify-between bg-white border border-[#ececeb] rounded-xl px-3 py-2">
                          <div>
                            <div className="text-[13px] font-semibold text-[#1d1d1f]">{field.name}</div>
                            <div className="text-[11px] text-[#8e8e93]">{field.type}</div>
                          </div>
                          <button
                            className="text-[11px] font-semibold text-[#4263eb]"
                            onClick={() => setCustomFields(prev => prev.filter((_, idx) => idx !== index))}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Field name"
                        className="flex-1 px-3 py-2 rounded-lg border border-[#ececeb] text-[12px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            if (!target.value.trim()) return;
                            setCustomFields(prev => [...prev, { name: target.value.trim(), type: 'Text' }]);
                            target.value = '';
                          }
                        }}
                      />
                      <button
                        className="px-4 py-2 bg-[#4263eb] text-white rounded-lg text-[12px] font-semibold"
                        onClick={() => setCustomFields(prev => [...prev, { name: `Field ${prev.length + 1}`, type: 'Text' }])}
                      >
                        Add Field
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#f9f9fb] p-6 rounded-2xl border border-[#ececeb]">
                    <p className="text-[14px] font-medium text-[#4b4b4b]">Agile Controls</p>
                    <p className="text-[12px] text-[#8e8e93] mt-1 mb-4">Manage sprints, backlogs, and iteration cadence.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-[#ececeb] rounded-xl p-4">
                        <p className="text-[12px] font-semibold text-[#8e8e93] uppercase tracking-wide">Active Sprint</p>
                        <p className="text-[16px] font-bold text-[#1d1d1f] mt-1">Sprint 1</p>
                        <p className="text-[11px] text-[#8e8e93] mt-1">Ends Jun 20</p>
                      </div>
                      <div className="bg-white border border-[#ececeb] rounded-xl p-4">
                        <p className="text-[12px] font-semibold text-[#8e8e93] uppercase tracking-wide">Backlog</p>
                        <p className="text-[16px] font-bold text-[#1d1d1f] mt-1">{tasks.filter(task => task.status === 'backlog').length} items</p>
                        <p className="text-[11px] text-[#8e8e93] mt-1">Ready for prioritization</p>
                      </div>
                    </div>
                  </div>
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
