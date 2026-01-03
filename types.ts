
export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed' | 'urgent';
  priority: number;
  createdAt: Date;
}

export interface UserProfile {
  name: string;
  avatar?: string;
  voice: string;
  persona: string;
  syncLevel: number;
  googleLinked: boolean;
  neuralDossier?: string;
  lastUpdate?: string;
  memories?: string[];
  voiceSample?: string;
  isVoiceCloned?: boolean;
}

export enum AppView {
  DASHBOARD = 'dashboard',
  SYNAPSE = 'synapse',
  NEURAL_CHAT = 'chat',
  RESEARCH = 'research',
  SIGHT = 'sight',
  REASONING = 'reasoning',
  CREATIVE = 'creative',
  CINEMATIC = 'cinematic',
  ARCHIVE = 'archive',
  SETTINGS = 'settings'
}
