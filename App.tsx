
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SynapseLive from './components/SynapseLive';
import CreativeEngine from './components/CreativeEngine';
import IntelligenceLab from './components/IntelligenceLab';
import NeuralSight from './components/NeuralSight';
import DeepThought from './components/DeepThought';
import CinematicLab from './components/CinematicLab';
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
        return <SynapseLive profile={profile} onAddTask={handleAddTask} />;
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
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-12 glass rounded-[3rem] animate-in fade-in duration-700">
             <div className="text-indigo-400 mb-6 font-mono text-xs tracking-widest uppercase">/root/neural_archive</div>
             <h2 className="text-4xl font-black mb-8 tracking-tighter">Event Logs</h2>
             <div className="w-full max-w-2xl space-y-4">
               {tasks.map(t => (
                 <div key={t.id} className="text-left p-6 bg-white/5 rounded-3xl border border-white/5 text-[10px] font-mono group hover:border-indigo-500/30 transition-all">
                    <span className="text-indigo-500 mr-4">[{t.createdAt.toLocaleTimeString()}]</span>
                    <span className="opacity-40 mr-2">LOG_PROTO:</span>
                    <span className="text-gray-300 group-hover:text-white transition-colors">{t.title.toUpperCase()}</span>
                    <span className="float-right text-indigo-400 opacity-50">ST_OK</span>
                 </div>
               ))}
               {tasks.length === 0 && <div className="text-gray-600 font-mono text-[10px]">EMPTY_ARCHIVE</div>}
             </div>
          </div>
        );
      case AppView.SETTINGS:
        return (
          <div className="max-w-3xl mx-auto glass rounded-[3.5rem] p-12 border border-white/10 space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-4xl font-black tracking-tighter">Neural Config</h2>
            <div className="space-y-8 text-sm">
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                <div>
                  <div className="font-bold text-lg mb-1">Subject Identity</div>
                  <div className="text-gray-500 text-xs font-mono uppercase tracking-widest">ID: {profile.name} • TYPE: {profile.persona}</div>
                  <div className={`text-[10px] mt-3 font-bold tracking-widest uppercase ${profile.googleLinked ? 'text-green-400' : 'text-orange-400'}`}>
                    GOOGLE_SYNC: {profile.googleLinked ? 'STABLE' : 'UNLINKED'}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('ego_link_initialized');
                    window.location.reload();
                  }}
                  className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-500/20 transition-all"
                >
                  Terminate Link
                </button>
              </div>

              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6">
                <div>
                   <div className="font-bold text-lg mb-1">Daily Refresh Protocol</div>
                   <div className="text-gray-500 text-xs font-mono uppercase">Next refresh cycle: {profile.lastUpdate ? new Date(new Date(profile.lastUpdate).getTime() + 24*60*60*1000).toLocaleString() : 'IMMEDIATE'}</div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                  </div>
                  <span className="font-mono text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Linked_Fidelity_High</span>
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
    <div className="min-h-screen text-gray-100 selection:bg-indigo-500/40">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="md:ml-64 p-6 md:p-12 min-h-screen pb-24">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-[2px] md:ml-64 z-50">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse opacity-80 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
      </div>
    </div>
  );
};

export default App;
