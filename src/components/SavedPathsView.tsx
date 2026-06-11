import React, { useState } from 'react';
import { PathStep } from '../types';
import { Menu } from 'lucide-react';

interface SavedPath {
  name: string;
  path: PathStep[];
  timestamp: number;
}

interface SavedPathsViewProps {
    onNavigate: (title: string) => void;
    onMenuToggle?: () => void;
}

export const SavedPathsView = ({ onNavigate, onMenuToggle }: SavedPathsViewProps) => {
    const [savedPaths, setSavedPaths] = useState<SavedPath[]>(() => {
        const saved = localStorage.getItem('saved_paths');
        return saved ? JSON.parse(saved) : [];
    });

    const [selected, setSelected] = useState<SavedPath | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    const executeDelete = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedPaths = savedPaths.filter((_, i) => i !== index);
        setSavedPaths(updatedPaths);
        localStorage.setItem('saved_paths', JSON.stringify(updatedPaths));
        setConfirmDelete(null);
    };

    return (
        <div className="flex-grow h-full overflow-hidden p-6 md:p-10 flex flex-col gap-6 text-text relative w-full">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={onMenuToggle} className="md:hidden flex-shrink-0 p-2 border border-border rounded-lg bg-bg text-text hover:text-accent">
                   <Menu size={24} />
                </button>
                {!selected && <h2 className="text-3xl font-bold text-white tracking-tighter">Your Saved Paths</h2>}
            </div>

            {selected ? (
                <div className="animate-in fade-in duration-500 flex flex-col h-full w-full max-h-full">
                    <div className="mb-6 flex items-center justify-between flex-shrink-0">
                        <div>
                           <button onClick={() => setSelected(null)} className="text-accent hover:text-white mb-2 text-sm font-bold transition-colors">← Back to Saved Paths</button>
                           <h3 className="text-3xl font-bold text-white tracking-tighter">{selected.name}</h3>
                           <p className="text-text-dim text-sm mt-1">{selected.path.length} stops recorded</p>
                        </div>
                        <button onClick={() => selected.path.forEach((p, idx) => setTimeout(() => onNavigate(p.title), idx * 400))} className="bg-accent/10 border border-accent/20 text-accent px-6 py-3 rounded-xl font-bold hover:bg-accent hover:text-white transition-all shadow-lg shadow-accent/10">
                            Replay Journey →
                        </button>
                    </div>

                    <div className="relative w-full flex-grow overflow-auto bg-bg rounded-3xl border border-border shadow-inner">
                        <div className="min-w-max px-24 min-h-[650px] flex items-center relative h-full">
                            
                            {/* The Main Track Line */}
                            <div className="absolute top-1/2 left-12 right-12 h-3 -translate-y-1/2 bg-gradient-to-r from-accent/5 via-accent/50 to-accent/5 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.3)]" />

                            {selected.path.map((step, i) => {
                                const isTop = i % 2 === 0;
                                return (
                                    <div key={i}
                                         className="relative flex-shrink-0 w-64 flex justify-center group cursor-pointer h-full items-center"
                                         onClick={() => onNavigate(step.title)}>

                                        {/* Stem connecting node to card */}
                                        <div className={`absolute left-1/2 -translate-x-1/2 w-1 bg-accent/20 transition-all group-hover:bg-accent group-hover:shadow-[0_0_10px_rgba(139,92,246,0.8)]
                                            ${isTop ? 'bottom-1/2 h-24' : 'top-1/2 h-24'}`} />

                                        {/* Station Node */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border-[6px] border-bg bg-accent
                                                        group-hover:bg-white group-hover:scale-[1.3] transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)]" />
                                        
                                        {/* Content Card */}
                                        <div className={`absolute ${isTop ? 'bottom-[calc(50%+4rem)]' : 'top-[calc(50%+4rem)]'}
                                                         w-56 text-center transform group-hover:scale-105 transition-transform origin-${isTop ? 'bottom' : 'top'} z-20`}>
                                            
                                            <div className="bg-glass border border-border group-hover:border-accent p-5 rounded-2xl shadow-xl relative backdrop-blur-md">
                                                <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-glass border border-border group-hover:border-accent transform rotate-45
                                                                ${isTop ? '-bottom-2 border-t-0 border-l-0' : '-top-2 border-b-0 border-r-0'}`} />

                                                <div className="relative z-10">
                                                    <h4 className="text-[15px] font-bold text-text mb-3 leading-tight line-clamp-3">{step.title}</h4>
                                                    <div className="flex flex-col items-center gap-1.5 border-t border-border/50 pt-3">
                                                        <span className="bg-accent/10 px-2.5 py-1 rounded-md text-accent text-[10px] font-bold font-mono tracking-widest uppercase">
                                                            {new Date(step.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-xs text-text-dim font-mono">
                                                            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 max-w-2xl overflow-y-auto pr-4">
                    {savedPaths.map((sp, i) => (
                        <div key={i} className="text-left bg-bg border border-border p-5 rounded-2xl flex justify-between items-center hover:border-accent hover:bg-accent/5 transition-all group cursor-pointer"
                                onClick={() => setSelected(sp)}>
                           <div>
                                <h4 className="font-bold text-text mb-2 group-hover:text-accent transition-colors">{sp.name}</h4>
                                <div className="flex items-center gap-3">
                                    <span className="bg-accent/10 text-accent px-2 py-1 rounded text-xs font-bold">{sp.path.length} Stops</span>
                                    {sp.path.length > 0 && <span className="text-xs text-text-dim">{sp.path[0]?.title} → {sp.path[sp.path.length-1]?.title}</span>}
                                </div>
                           </div>
                           <div className="flex items-center gap-4">
                               <span className="text-[11px] font-mono text-text-dim bg-white/5 px-3 py-1.5 rounded-lg border border-border/50">
                                   {new Date(sp.timestamp).toLocaleDateString()}
                               </span>
                               {confirmDelete === i ? (
                                   <div className="flex items-center gap-2">
                                       <button 
                                           onClick={(e) => executeDelete(i, e)}
                                           className="text-white bg-red-600 hover:bg-red-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                                       >
                                           Delete
                                       </button>
                                       <button 
                                           onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                                           className="text-text-dim bg-white/10 hover:text-white px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
                                       >
                                           Cancel
                                       </button>
                                   </div>
                               ) : (
                                   <button 
                                       onClick={(e) => { e.stopPropagation(); setConfirmDelete(i); }}
                                       className="text-text-dim hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                       title="Delete Path"
                                   >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                   </button>
                               )}
                           </div>
                        </div>
                    ))}
                    {savedPaths.length === 0 && (
                        <div className="text-center p-10 border border-dashed border-border rounded-2xl text-text-dim">
                            No saved paths yet. Start exploring and hit the shiny "Save" button on your map!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
