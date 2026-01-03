
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SynapseLive from './components/SynapseLive';
import CreativeEngine from './components/CreativeEngine';
import IntelligenceLab from './components/IntelligenceLab';
import NeuralSight from './components/NeuralSight';
import DeepThought from './components/DeepThought';
import SetupWizard from './components/SetupWizard';
import { AppView, Task, UserProfile } from './types';

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Optimize portfolio allocations', status: 'urgent', priority: 1, createdAt: new Date() },
  { id: '2', title: 'Synthesize quarterly reports', status: 'pending', priority: 2, createdAt: new Date() },
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
      name: 'Subject',
      voice: 'Kore',
      persona: 'Uninitialized',
      syncLevel: 0,
      googleLinked: false
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
      case AppView.SYNAPSE:
        return <SynapseLive onAddTask={handleAddTask} />;
      case AppView.RESEARCH:
        return <IntelligenceLab />;
      case AppView.SIGHT:
        return <NeuralSight />;
      case AppView.REASONING:
        return <DeepThought />;
      case AppView.CREATIVE:
        return <CreativeEngine />;
      case AppView.ARCHIVE:
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-12 glass rounded-3xl">
             <div className="text-indigo-400 mb-4 font-mono">/root/logs</div>
             <h2 className="text-2xl font-bold mb-4">Neural Log Storage</h2>
             <div className="w-full max-w-lg space-y-4">
               {tasks.map(t => (
                 <div key={t.id} className="text-left p-4 bg-white/5 rounded-xl border border-white/5 text-xs font-mono">
                    [{t.createdAt.toLocaleTimeString()}] RECORD: "{t.title.toUpperCase()}" | PRIO_{t.priority}
                 </div>
               ))}
             </div>
          </div>
        );
      case AppView.SETTINGS:
        return (
          <div className="max-w-2xl mx-auto glass rounded-3xl p-8 border border-white/10 space-y-8">
            <h2 className="text-2xl font-bold">Core Configuration</h2>
            <div className="space-y-6 text-sm">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold mb-1">Subject Profile</div>
                  <div className="text-gray-400 text-xs">Name: {profile.name} | Archetype: {profile.persona}</div>
                  <div className="text-[10px] text-indigo-400 mt-1 uppercase font-bold tracking-widest">
                    Google Sync: {profile.googleLinked ? 'ACTIVE' : 'NOT LINKED'}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('ego_link_initialized');
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded-lg hover:bg-red-500/20 transition-all"
                >
                  Factory Reset Link
                </button>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="font-bold mb-1">Daily Refresh Protocol</div>
                <div className="text-gray-400 text-xs mb-3">Next scheduled update: {profile.lastUpdate ? new Date(new Date(profile.lastUpdate).getTime() + 24*60*60*1000).toLocaleString() : 'Immediately'}</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-indigo-500 shadow-[0_0_10px_indigo]"></div>
                  </div>
                  <span className="font-mono text-[10px]">SYNCED</span>
                </div>
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
    <div className="min-h-screen bg-[#030712] text-gray-100 selection:bg-indigo-500/30">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="md:ml-64 p-4 md:p-8 min-h-screen pb-16">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-1 md:ml-64">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse opacity-50"></div>
      </div>
    </div>
  );
};

export default App;
