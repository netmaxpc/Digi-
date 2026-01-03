
import React, { useState, useRef } from 'react';
import { analyzeMultimodal, speakResponse } from '../services/geminiService';

const NeuralSight: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Analyze this visual input for key information and patterns.');
  const [result, setResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const startAnalysis = async () => {
    if (!file || !preview) return;
    setIsAnalyzing(true);
    try {
      const output = await analyzeMultimodal(prompt, preview, file.type);
      setResult(output);
    } catch (err) {
      console.error(err);
      setResult("Multimodal analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="glass rounded-3xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          Neural Sight Lab
        </h2>
        <p className="text-gray-400 mb-8">Utilize Gemini 3 Pro to interpret high-fidelity images and video streams.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video glass rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/40 transition-all overflow-hidden relative group"
            >
              {preview ? (
                file?.type.startsWith('video') ? (
                  <video src={preview} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={preview} className="w-full h-full object-cover" />
                )
              ) : (
                <>
                  <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="1" /></svg>
                  <span className="text-gray-500 font-medium">Inject Visual Dataset</span>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
            </div>

            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-indigo-500/50 outline-none h-24"
              placeholder="Analysis parameters..."
            />

            <button
              onClick={startAnalysis}
              disabled={!file || isAnalyzing}
              className="w-full py-4 bg-indigo-600 rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-500 transition-all flex items-center justify-center gap-3"
            >
              {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Start Neural Interpretation'}
            </button>
          </div>

          <div className="glass rounded-2xl border border-white/5 p-6 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Insight Output</span>
              {result && (
                <button onClick={() => speakResponse(result)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                </button>
              )}
            </div>
            <div className="flex-1 text-gray-300 text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap">
              {result || (isAnalyzing ? 'Scanning neural patterns...' : 'Awaiting visual input for analysis.')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuralSight;
