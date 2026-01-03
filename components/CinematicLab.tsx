
import React, { useState, useRef } from 'react';
import { generateVeoVideo } from '../services/geminiService';

const CinematicLab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() && !sourceImage) return;

    // MANDATORY: Check if API key is selected for Veo models as per guidelines
    // @ts-ignore
    if (typeof window.aistudio !== 'undefined') {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setError("A paid API key is required for Veo cinematic synthesis.");
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Proceeding as if selection was successful to mitigate race conditions
      }
    }

    setIsGenerating(true);
    setResultVideo(null);
    setError(null);
    try {
      const videoUrl = await generateVeoVideo(prompt, sourceImage || undefined, aspectRatio);
      if (videoUrl) setResultVideo(videoUrl);
    } catch (err: any) {
      console.error(err);
      // Reset key selection state and prompt user again if entity not found
      if (err.message && err.message.includes("Requested entity was not found")) {
         setError("Requested entity not found. Please re-select your paid API key.");
         // @ts-ignore
         if (typeof window.aistudio !== 'undefined') await window.aistudio.openSelectKey();
      } else {
         setError(err.message || "Neural Synthesis failed. Ensure your API Key is configured for paid usage.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenKey = async () => {
    // @ts-ignore
    if (typeof window.aistudio !== 'undefined') {
      await window.aistudio.openSelectKey();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass rounded-3xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Cinematic Synthesis (Veo)
          </div>
          <button onClick={handleOpenKey} className="text-[10px] uppercase font-bold text-indigo-400 border border-indigo-400/30 px-3 py-1 rounded-full hover:bg-indigo-400/10">
            Configure Link Key
          </button>
        </h2>
        
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video glass rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/40 transition-all overflow-hidden relative group"
          >
            {sourceImage ? (
              <img src={sourceImage} className="w-full h-full object-contain" alt="Source frame" />
            ) : (
              <>
                <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="1" /></svg>
                <span className="text-gray-500 font-medium text-center px-4">Inject Starting Frame (Optional)<br/><span className="text-xs opacity-50">Image will animate into video</span></span>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const reader = new FileReader();
                 reader.onloadend = () => setSourceImage(reader.result as string);
                 reader.readAsDataURL(file);
               }
            }} className="hidden" accept="image/*" />
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setAspectRatio('16:9')}
              className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${aspectRatio === '16:9' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}
            >
              Landscape (16:9)
            </button>
            <button 
              onClick={() => setAspectRatio('9:16')}
              className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${aspectRatio === '9:16' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}
            >
              Portrait (9:16)
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Synthesize cinematic movement (e.g. 'A slow cinematic zoom into a cyberpunk city')..."
            className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex flex-col gap-2">
              <p>{error}</p>
              <div className="flex gap-2">
                <button onClick={handleOpenKey} className="underline text-left font-bold">Select Paid API Key</button>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline opacity-70">Billing Docs</a>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt && !sourceImage)}
            className="w-full py-4 bg-indigo-600 rounded-2xl font-bold text-lg hover:bg-indigo-500 disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm">Veo Engine Processing (May take 1-2 mins)...</span>
              </>
            ) : 'Generate Veo Cinematic'}
          </button>
        </div>
      </div>

      {resultVideo && (
        <div className="glass rounded-3xl p-4 border border-indigo-500/20 overflow-hidden shadow-2xl animate-in zoom-in duration-500">
          <video src={resultVideo} controls className="w-full h-auto rounded-2xl" autoPlay loop muted />
          <div className="mt-4 flex justify-between items-center px-2">
            <div>
              <div className="text-xs text-indigo-400 font-bold uppercase">Engine</div>
              <div className="text-sm font-medium">Veo 3.1 Fast Preview</div>
            </div>
            <a 
              href={resultVideo} 
              download 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/10"
            >
              Export to Storage
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default CinematicLab;
