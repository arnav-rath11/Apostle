import { Compass, BookOpen, Settings, Sun, Moon, Bot, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
    onViewChange: (view: 'explore' | 'saved') => void;
    activeView: 'explore' | 'saved';
    onOpenAI: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar = ({ onViewChange, activeView, onOpenAI, isOpen, onClose }: SidebarProps) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-[240px] flex-shrink-0 backdrop-blur-md bg-glass border-r border-border p-6 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-[20px] font-bold text-accent tracking-[4px] drop-shadow-[0_0_15px_rgba(139,92,246,0.4)]">
            APOSTLE
          </h1>
          <button className="md:hidden text-text-dim hover:text-white" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-2">
          <button
              onClick={() => { onViewChange('explore'); onClose?.(); }}
              className={`flex items-center gap-3 text-sm px-4 py-3 rounded-xl transition-all ${
                activeView === 'explore'
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-dim hover:bg-glass hover:text-text'
              }`}
            >
              <Compass size={18} />
              Explore
            </button>
            
            <button
              onClick={() => { onViewChange('saved'); onClose?.(); }}
              className={`flex items-center gap-3 text-sm px-4 py-3 rounded-xl transition-all ${
                activeView === 'saved'
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-dim hover:bg-glass hover:text-text'
              }`}
            >
              <BookOpen size={18} />
              Saved Paths
            </button>
            
            <button 
               onClick={() => { onOpenAI(); onClose?.(); }}
               className="flex items-center gap-3 text-sm px-4 py-3 rounded-xl text-accent font-bold hover:bg-glass cursor-pointer"
            >
               <Bot size={18} />
               Apostle AI
            </button>
            
            <button 
               onClick={toggleTheme}
               className="flex items-center gap-3 text-sm px-4 py-3 rounded-xl text-text-dim hover:bg-glass hover:text-text cursor-pointer"
            >
               {isDark ? <Sun size={18} /> : <Moon size={18} />}
               {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>

            <a href="#" className="flex items-center gap-3 text-sm px-4 py-3 rounded-xl text-text-dim hover:bg-glass hover:text-text">
              <Settings size={18} />
              Settings
            </a>
        </nav>
        <div className="mt-auto text-[11px] text-text-dim opacity-50">
          v1.0.4 Beta "Deep Archive"
        </div>
      </div>
    </>
  );
};
