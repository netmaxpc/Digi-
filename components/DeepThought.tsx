
import React, { useState } from 'react';
import { solveComplexProblem, speakResponse } from '../services/geminiService';

const DeepThought: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [result, setResult] = useState('');

  const handleReasoning = async () => {
    if (!query.trim()) return;
    setIsThinking(true);
    try {
      const output = await solveComplexProblem(query);
      setResult(output);
    } catch (err) {
      setResult("Neural grid overload. Reasoning aborted.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative">
        {isThinking && (
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-30 animate-pulse"></div>
        )}
        <div className="glass rounded-3xl p-8 border border-indigo-500/20 relative">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" /></svg>
            Deep Thought Core
          </h2>
          <p className="text-gray-400 mb-8">Deploying Gemini 3 Pro in 32K Thinking Mode for your most complex logic puzzles.</p>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pose a complex query requiring high-fidelity reasoning..."
            className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-lg focus:outline-none focus:border-purple-500/50 transition-colors mb-6"
          />

          <button
            onClick={handleReasoning}
            disabled={isThinking || !query}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-lg hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition-all flex items-center justify-center gap-4"
          >
            {isThinking ? (
              <>
                <div className="flex gap-1">
                  {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }}></div>)}
                </div>
                Calculating Neural Pathways...
              </>
            ) : 'Initiate Deep Thought'}
          </button>
        </div>
      </div>

      {result && (
        <div className="glass rounded-3xl p-10 border border-white/10 animate-in fade-in duration-1000">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Logic Output</span>
            <button onClick={() => speakResponse(result)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
          </div>
          <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeepThought;
