import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ApostleAIChatProps {
  onClose: () => void;
}

export const ApostleAIChat = ({ onClose }: ApostleAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://apostle.app",
          "X-Title": "Apostle"
        },
        body: JSON.stringify({
          model: "qwen/qwen3-coder:free",
          messages: [
            {
              role: "system",
              content: "You are Apostle AI, embedded in a Wikipedia mapping and knowledge explorer app. Help users understand Wikipedia topics, explain complex concepts in simple terms, find surprising connections between ideas, and suggest related topics to explore. End every response with 2-3 'You might also explore:' suggestions. Be concise, sharp, and curious in tone. Never say 'As an AI' — you are Apostle AI."
            },
            ...updatedMessages
          ],
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ?? "No response received.";
      setMessages([...updatedMessages, { role: 'assistant', content: reply }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-bg border-l border-border flex flex-col shadow-2xl z-50 animate-in slide-in-from-right">
      <div className="p-4 border-b border-border flex justify-between items-center bg-glass">
        <h2 className="font-bold text-lg flex items-center gap-2 text-accent">
          <Bot size={20} /> Apostle AI
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-glass rounded-full text-text-dim"><X /></button>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`p-2 rounded-full ${m.role === 'user' ? 'bg-accent/20' : 'bg-glass'}`}>
              {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`p-3 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'bg-accent text-white' : 'bg-glass'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-text-dim">Apostle AI is thinking...</div>}
      </div>

      <div className="p-4 border-t border-border bg-glass">
        <div className="flex gap-2">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-bg border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-accent"
              placeholder="Ask me anything..."
            />
            <button onClick={handleSend} className="bg-accent text-white p-2 rounded-xl"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
};