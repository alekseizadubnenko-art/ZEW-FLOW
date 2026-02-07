
import React from 'react';
import { 
  Network, 
  ListTodo, 
  Columns3, 
  CalendarRange, 
  Settings as SettingsIcon,
  BrainCircuit
} from 'lucide-react';
import { Task, DiagramNode, DiagramEdge } from './types';

// Grouped View Config for the Sidebar logic
export const VIEW_SECTIONS = {
  ideation: [
    { id: 'mindmap', label: 'Mind Map', icon: <BrainCircuit size={18} /> },
    { id: 'flowchart', label: 'Flowchart', icon: <Network size={18} /> },
  ],
  execution: [
    { id: 'kanban', label: 'Kanban Board', icon: <Columns3 size={18} /> },
    { id: 'list', label: 'Task List', icon: <ListTodo size={18} /> },
  ],
  review: [
    { id: 'gantt', label: 'Gantt Timeline', icon: <CalendarRange size={18} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
  ]
} as const;

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Design Project Architecture',
    description: 'Create technical specifications and system design diagrams.',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-06-15',
    tags: ['Design', 'Technical']
  },
  {
    id: 't2',
    title: 'Setup Gemini API Integration',
    description: 'Implement smart node generation and task synthesis.',
    status: 'todo',
    priority: 'urgent',
    dueDate: '2024-06-20',
    tags: ['AI', 'Dev']
  }
];

export const INITIAL_NODES: DiagramNode[] = [
  { 
    id: 'n1', 
    position: { x: 250, y: 50 }, 
    data: { 
      label: 'ZenFlow Launch', 
      type: 'topic', 
      tags: ['Milestone'] 
    } 
  },
  { 
    id: 'n2', 
    position: { x: 100, y: 150 }, 
    data: { 
      label: 'Backend Development', 
      type: 'topic' 
    } 
  },
  { 
    id: 'n3', 
    position: { x: 400, y: 150 }, 
    data: { 
      label: 'Frontend UI/UX', 
      type: 'topic' 
    } 
  },
  { 
    id: 'n4', 
    position: { x: 100, y: 250 }, 
    data: { 
      label: 'Database Setup', 
      // This node acts as a "Bridge" to Task t1
      isTask: true, 
      taskId: 't1',
      status: 'in-progress',
      priority: 'high',
      tags: ['Design', 'Technical']
    } 
  },
];

export const INITIAL_EDGES: DiagramEdge[] = [
  { id: 'e1-2', source: 'n1', target: 'n2' },
  { id: 'e1-3', source: 'n1', target: 'n3' },
  { id: 'e2-4', source: 'n2', target: 'n4' },
];
