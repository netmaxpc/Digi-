
export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed' | 'urgent';
  priority: number;
  createdAt: Date;
}

export interface ResearchResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export interface UserProfile {
  name: string;
  voice: string;
  persona: string;
  syncLevel: number;
  googleLinked: boolean;
  neuralDossier?: string;
  lastUpdate?: string;
}

export enum AppView {
  DASHBOARD = 'dashboard',
  SYNAPSE = 'synapse',
  RESEARCH = 'research',
  SIGHT = 'sight',
  REASONING = 'reasoning',
  CREATIVE = 'creative',
  CINEMATIC = 'cinematic',
  ARCHIVE = 'archive',
  SETTINGS = 'settings'
}
