
import React, { useState, useRef, useEffect } from 'react';
import { startNeuralChat, speakResponse, fastTriage } from '../services/geminiService';
import { UserProfile } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  isQuickReply?: boolean;
}

interface NeuralChatProps {
  profile: UserProfile;
}

const NeuralChat: React.FC<NeuralChatProps> = ({ profile }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const session = await startNeuralChat(`You are ${profile.name}'s digital twin. You handle communications and digital life management. Be intelligent, concise, and helpful. You are powered by Gemini 3 Pro.`);
      setChatSession(session);
    };
    initChat();
  }, [profile]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatSession) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const responseStream = await chatSession.sendMessageStream({ message: userMessage });
      let fullText = '';
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of responseStream) {
        fullText += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullText;
          return newMessages;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error in my neural network.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickTriage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, isQuickReply: true }]);
    setIsTyping(true);

    try {
      const result = await fastTriage(`Context: ${profile.name}'s digital twin. Respond to this quickly: ${userMessage}`);
      setMessages(prev => [...prev, { role: 'model', text: result, isQuickReply: true }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'Triage failed.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col glass rounded-[3rem] border border-white/10 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-indigo-600/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">Neural Link</h2>
            <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Gemini 3 Pro Intelligence</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Core Online</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
             <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             <div className="text-xs font-bold uppercase tracking-[0.4em]">Initialize Transmission</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed relative group ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10' 
                : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
            }`}>
              {msg.isQuickReply && (
                <div className="absolute -top-4 right-0 text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Turbo Response</div>
              )}
              {msg.text || (msg.role === 'model' && <div className="flex gap-1 py-1"><div className="w-1 h-1 bg-white/40 rounded-full animate-bounce"></div><div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></div></div>)}
              {msg.role === 'model' && msg.text && (
                <button onClick={() => speakResponse(msg.text)} className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-full text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeWidth="2" /></svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-white/5 bg-white/5">
        <form onSubmit={handleSend} className="relative flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your command..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleQuickTriage}
              disabled={isTyping || !input}
              className="px-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 disabled:opacity-50 transition-all font-bold text-xs flex items-center gap-2 border border-white/10"
              title="Fast Flash-Lite Response"
            >
              <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
              Fast
            </button>
            <button
              type="submit"
              disabled={isTyping || !input}
              className="px-6 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 disabled:opacity-50 transition-all font-bold shadow-lg shadow-indigo-600/20"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NeuralChat;
