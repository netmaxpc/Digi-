
import React, { useState, useRef } from 'react';
import { generateCreativeImage, editImage } from '../services/geminiService';

const CreativeEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'edit'>('generate');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setResultImage(null);
    try {
      const img = await generateCreativeImage(prompt);
      if (img) setResultImage(img);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!prompt.trim() || !sourceImage) return;
    setIsProcessing(true);
    setResultImage(null);
    try {
      const img = await editImage(prompt, sourceImage, "image/png");
      if (img) setResultImage(img);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSourceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass rounded-3xl p-8 border border-white/10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.34a2 2 0 01-1.783 0l-.691-.34a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547l-1.162 1.162a2 2 0 00.597 3.332l2.364.79a10 10 0 007.45 0l2.364-.79a2 2 0 00.597-3.332l-1.162-1.162z" /></svg>
            Studio Core Synthesis
          </h2>
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            <button 
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'generate' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Generate
            </button>
            <button 
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'edit' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Edit
            </button>
          </div>
        </div>
        
        <div className="space-y-6">
          {activeTab === 'edit' && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video glass rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/40 transition-all overflow-hidden relative group"
            >
              {sourceImage ? (
                <img src={sourceImage} className="w-full h-full object-contain" />
              ) : (
                <>
                  <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="1" /></svg>
                  <span className="text-gray-500 font-medium">Inject Source Frame</span>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          )}

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={activeTab === 'generate' ? "Describe the visualization you wish to manifest..." : "Describe neural edits (e.g. 'Add a retro filter', 'Remove the background')..."}
            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-200 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          
          <button
            onClick={activeTab === 'generate' ? handleGenerate : handleEdit}
            disabled={isProcessing || !prompt || (activeTab === 'edit' && !sourceImage)}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-bold text-lg hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Neural Synthesis...
              </>
            ) : activeTab === 'generate' ? 'Generate Image' : 'Apply Edits'}
          </button>
        </div>
      </div>

      {resultImage && (
        <div className="glass rounded-3xl p-4 border border-indigo-500/20 overflow-hidden shadow-2xl animate-in zoom-in duration-500">
          <img src={resultImage} alt="AI Output" className="w-full h-auto rounded-2xl" />
          <div className="mt-4 flex justify-between items-center px-2">
            <div>
              <div className="text-xs text-indigo-400 font-bold uppercase">Engine</div>
              <div className="text-sm font-medium">Flash Image Core</div>
            </div>
            <button className="px-4 py-2 glass rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors">
              Commit to Archive
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreativeEngine;
