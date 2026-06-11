import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

// WARNING: Proxying requests through backend to keep API key secure.

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  "Explain the French Revolution",
  "What connects Tesla and Edison?",
  "Summarize quantum entanglement"
];

export const AI = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I am Apostle AI, your Wikipedia explorer guide. What would you like to learn about today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch("/api/apostle-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "user", content: `System: You are Apostle AI, embedded in a Wikipedia mapping app. Help users understand Wikipedia topics, explain complex concepts simply, find connections between ideas, and suggest related topics to explore. End every response with 2-3 related topic suggestions. Be concise, sharp, and curious in tone.\n\n${messages[0].content}` },
            ...newMessages.slice(1)
          ]
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("API Error:", data);
        throw new Error(data.error?.message || `API error: ${response.status}`);
      }
      
      const assistantMessage = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Sorry, I'm having trouble thinking right now. Please try again later.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-gray-100" id="ai-page">
      <header className="p-6 border-b border-gray-800 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-800 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-indigo-400">Apostle AI</h1>
          <p className="text-sm text-gray-400">Ask anything about Wikipedia topics</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`p-2 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800'}`}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={20} className="text-indigo-400" />}
              </div>
              <div className={`p-4 rounded-2xl max-w-[70%] ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#111118]'}`}>
                {m.role === 'assistant' && <div className="text-xs font-bold text-indigo-400 mb-1">Apostle AI</div>}
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="p-2 h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                <Bot size={20} className="text-indigo-400" />
              </div>
              <div className="p-4 rounded-2xl bg-[#111118] text-gray-400 text-sm animate-pulse">Thinking...</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {messages.length === 1 && (
        <div className="px-6 py-4 flex gap-3">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => handleSend(s)} className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="p-6 border-t border-gray-800 bg-[#0a0a0f]">
        <div className="flex gap-2">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(input)}
              className="flex-1 bg-[#111118] border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
              placeholder="Ask about Wikipedia topics..."
            />
            <button onClick={() => handleSend(input)} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-colors">
              <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};
