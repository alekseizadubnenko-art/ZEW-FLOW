
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
    level: 'project',
    startDate: '2024-06-01',
    dueDate: '2024-06-15',
    tags: ['Design', 'Technical'],
    sprint: 'Sprint 1'
  },
  {
    id: 't1-1',
    title: 'Define service boundaries',
    description: 'Map bounded contexts and integration points.',
    status: 'todo',
    priority: 'medium',
    level: 'goal',
    startDate: '2024-06-03',
    dueDate: '2024-06-10',
    parentId: 't1',
    tags: ['Design', 'Technical']
  },
  {
    id: 't2',
    title: 'Setup Gemini API Integration',
    description: 'Implement smart node generation and task synthesis.',
    status: 'todo',
    priority: 'urgent',
    level: 'task',
    startDate: '2024-06-05',
    dueDate: '2024-06-20',
    parentId: 't1-1',
    tags: ['AI', 'Dev'],
    sprint: 'Sprint 1'
  },
  {
    id: 't3',
    title: 'Sprint backlog grooming',
    description: 'Prepare backlog for the upcoming iteration.',
    status: 'backlog',
    priority: 'low',
    level: 'task',
    startDate: '2024-06-08',
    dueDate: '2024-06-18',
    tags: ['Agile'],
    sprint: 'Sprint 2'
  }
];

export const INITIAL_NODES: DiagramNode[] = [
  { 
    id: 'n1', 
    position: { x: 250, y: 50 }, 
    data: { 
      label: 'ZenFlow Launch', 
      type: 'topic', 
      tags: ['Milestone'],
      domain: 'Product' 
    } 
  },
  { 
    id: 'n2', 
    position: { x: 100, y: 150 }, 
    data: { 
      label: 'Backend Development', 
      type: 'topic',
      domain: 'Engineering'
    } 
  },
  { 
    id: 'n3', 
    position: { x: 400, y: 150 }, 
    data: { 
      label: 'Frontend UI/UX', 
      type: 'topic',
      domain: 'Design'
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
      tags: ['Design', 'Technical'],
      domain: 'Engineering'
    } 
  },
];

export const INITIAL_EDGES: DiagramEdge[] = [
  { id: 'e1-2', source: 'n1', target: 'n2' },
  { id: 'e1-3', source: 'n1', target: 'n3' },
  { id: 'e2-4', source: 'n2', target: 'n4' },
];

export const INITIAL_FLOW_NODES: DiagramNode[] = [
  {
    id: 'f1',
    position: { x: 180, y: 140 },
    data: { label: 'Idea intake', type: 'topic' }
  },
  {
    id: 'f2',
    position: { x: 420, y: 140 },
    data: { label: 'Scope & prioritize', type: 'action' }
  },
  {
    id: 'f3',
    position: { x: 660, y: 140 },
    data: { label: 'Ship to sprint', type: 'note' }
  }
];

export const INITIAL_FLOW_EDGES: DiagramEdge[] = [
  { id: 'fe1-2', source: 'f1', target: 'f2' },
  { id: 'fe2-3', source: 'f2', target: 'f3' }
];
