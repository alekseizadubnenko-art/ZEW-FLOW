
export type Status = 'backlog' | 'todo' | 'in-progress' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskLevel = 'project' | 'goal' | 'task';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  level: TaskLevel;
  startDate: string;
  dueDate: string;
  parentId?: string; // For subtasks or linking to specific nodes
  tags: string[];
  sprint?: string;
  customFields?: Record<string, string>;
}

export interface NodeData {
  label: string;
  description?: string;
  type?: 'topic' | 'action' | 'note';
  domain?: string;
  level?: TaskLevel;
  properties?: Record<string, string>;
  // "Bridge" Properties
  isTask?: boolean;
  taskId?: string; // The link to the Execution Layer
  status?: Status; // Synced from Task
  priority?: Priority; // Synced from Task
  tags?: string[];
}

export interface DiagramNode {
  id: string;
  position: { x: number; y: number };
  data: NodeData;
  type?: string;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export type ViewType = 'mindmap' | 'flowchart' | 'list' | 'kanban' | 'gantt' | 'settings';

export interface ProjectState {
  tasks: Task[];
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  activeView: ViewType;
}
