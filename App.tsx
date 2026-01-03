
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SynapseLive from './components/SynapseLive';
import CreativeEngine from './components/CreativeEngine';
import IntelligenceLab from './components/IntelligenceLab';
import NeuralSight from './components/NeuralSight';
import DeepThought from './components/DeepThought';
import CinematicLab from './components/CinematicLab';
import NeuralChat from './components/NeuralChat';
import SetupWizard from './components/SetupWizard';
import { AppView, Task, UserProfile } from './types';

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Plan my next vacation', status: 'urgent', priority: 1, createdAt: new Date() },
  { id: '2', title: 'Prepare for next week', status: 'pending', priority: 2, createdAt: new Date() },
];

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(() => {
    return localStorage.getItem('ego_link_initialized') === 'true';
  });
  
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ego_link_profile');
    return saved ? JSON.parse(saved) : {
      name: 'User',
      voice: 'Kore',
      persona: 'Assistant',
      syncLevel: 0,
      googleLinked: false,
      memories: []
    };
  });

  const handleInitialization = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setIsInitialized(true);
    localStorage.setItem('ego_link_initialized', 'true');
    localStorage.setItem('ego_link_profile', JSON.stringify(newProfile));
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('ego_link_profile', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = {
      ...taskData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      createdAt: new Date(),
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard profile={profile} tasks={tasks} onUpdateProfile={updateProfile} />;
      case AppView.NEURAL_CHAT:
        return <NeuralChat profile={profile} />;
      case AppView.SYNAPSE:
        return <SynapseLive profile={profile} onAddTask={handleAddTask} onUpdateProfile={updateProfile} />;
      case AppView.RESEARCH:
        return <IntelligenceLab />;
      case AppView.SIGHT:
        return <NeuralSight />;
      case AppView.REASONING:
        return <DeepThought />;
      case AppView.CREATIVE:
        return <CreativeEngine />;
      case AppView.CINEMATIC:
        return <CinematicLab />;
      case AppView.ARCHIVE:
        return (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="glass rounded-[3rem] p-12 border border-white/10">
              <h2 className="text-3xl font-bold mb-8">Memories & History</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">What I've Learned About You</h3>
                  <div className="grid gap-3">
                    {profile.memories?.map((m, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-sm text-gray-300 italic">
                        "{m}"
                      </div>
                    ))}
                    {(!profile.memories || profile.memories.length === 0) && <p className="text-sm text-gray-600">No memories recorded yet. Start a voice chat to teach me.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case AppView.SETTINGS:
        return (
          <div className="max-w-3xl mx-auto glass rounded-[3rem] p-12 border border-white/10 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-3xl font-bold">Settings</h2>
            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {profile.avatar && <img src={profile.avatar} className="w-12 h-12 rounded-full object-cover" />}
                  <div>
                    <div className="font-bold">{profile.name}</div>
                    <div className="text-xs text-gray-500">{profile.persona} mode</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('ego_link_initialized');
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-red-500/10 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20"
                >
                  Reset Profile
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard profile={profile} tasks={tasks} onUpdateProfile={updateProfile} />;
    }
  };

  if (!isInitialized) {
    return <SetupWizard onComplete={handleInitialization} />;
  }

  return (
    <div className="min-h-screen text-gray-100 selection:bg-indigo-500/40">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="md:ml-64 p-6 md:p-12 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
