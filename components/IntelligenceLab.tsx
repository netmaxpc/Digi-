
import React, { useState } from 'react';
import { performResearch, performMapsSearch } from '../services/geminiService';

const IntelligenceLab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'global' | 'local'>('global');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; sources: any[] } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      let data;
      if (mode === 'global') {
        data = await performResearch(query);
      } else {
        // Try to get geolocation for local search
        let location = undefined;
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
          location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch (e) {
          console.warn("Location permission denied, proceeding with general maps search.");
        }
        data = await performMapsSearch(query, location);
      }
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass rounded-3xl p-8 border border-indigo-500/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Cognitive Intelligence
          </h2>
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            <button 
              onClick={() => setMode('global')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'global' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Global Neural
            </button>
            <button 
              onClick={() => setMode('local')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'local' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Local Maps
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'global' ? "Search the global neural network..." : "Search local places and logistics..."}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !query}
            className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Invoke'}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="glass rounded-3xl p-8 border border-white/10">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Transmission Decoded</div>
            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
              {result.text}
            </div>
          </div>

          {result.sources.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass p-4 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-medium text-gray-200 truncate group-hover:text-indigo-300">{source.title}</div>
                    <div className="text-[10px] text-gray-500 truncate">{source.uri}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntelligenceLab;
