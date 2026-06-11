import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Graph, PathStep } from '../types';

interface MapProps {
  graph: Graph;
  currentPage: string;
  path: PathStep[];
  onNavigate: (title: string) => void;
  onClearPath: () => void;
  onCloseMap?: () => void;
}

interface SavedPath {
  name: string;
  path: PathStep[];
  timestamp: number;
}

export const Map = ({ graph, currentPage, path, onNavigate, onClearPath, onCloseMap }: MapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const prevNodesRef = useRef(new window.Map());
  const [selectedPath, setSelectedPath] = useState<SavedPath | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pathName, setPathName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Resize the d3 graph when fullscreen toggles
  useEffect(() => {
     if (svgRef.current) {
        // Just trigger a re-render/re-simulate of D3 by tricking a dependency update if needed
        // The existing useEffect for d3 simulation will handle it since it depends on graph, which we can't easily force
        // Actually, d3 simulates on mount. Let's add isFullscreen to the d3 useEffect dependencies.
     }
  }, [isFullscreen]);

  const confirmSave = () => {
    if (pathName.trim()) {
      const saved = localStorage.getItem('saved_paths');
      const savedPaths = saved ? JSON.parse(saved) : [];
      const newPath: SavedPath = { name: pathName.trim(), path, timestamp: Date.now() };
      const updated = [...savedPaths, newPath];
      localStorage.setItem('saved_paths', JSON.stringify(updated));
      setIsSaving(false);
      setPathName('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    
    // Check if graph is cleared
    if (graph.nodes.length === 0) {
        svg.selectAll('*').remove();
        prevNodesRef.current.clear();
        return;
    }

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Establish layering for z-index effect (links below nodes)
    if (svg.select('.link-group').empty()) svg.append('g').attr('class', 'link-group');
    if (svg.select('.node-group').empty()) svg.append('g').attr('class', 'node-group');

    // Retain previous physics positions across renders!
    const nodes = graph.nodes.map(d => {
        const existing = prevNodesRef.current.get(d.id);
        return existing ? { ...d, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy } : { ...d };
    });
    const edges = graph.edges.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges).id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Links update pattern
    const linkData = svg.select('.link-group').selectAll('line').data(edges, (d: any) => (d.source.id || d.source) + '-' + (d.target.id || d.target));
    linkData.exit().remove();
    const linkEnter = linkData.enter().append('line')
      .attr('stroke', '#3B82F6')
      .attr('stroke-opacity', 0);
      
    linkEnter.transition().duration(500).attr('stroke-opacity', 0.6);
    const link = linkEnter.merge(linkData as any);

    // Nodes update pattern
    const nodeData = svg.select('.node-group').selectAll('circle').data(nodes, (d: any) => d.id);
    nodeData.exit().transition().duration(300).attr('r', 0).remove();
    
    const nodeEnter = nodeData.enter().append('circle')
      .attr('r', 0)
      .attr('fill', (d: any) => d.id === currentPage ? '#8B5CF6' : '#60A5FA')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer');
      
    // New nodes pop in via elastic transition
    nodeEnter.transition().duration(750).ease(d3.easeElastic).attr('r', 6);

    const node = nodeEnter.merge(nodeData as any);
    
    // Update active node color conditionally
    node.attr('fill', (d: any) => d.id === currentPage ? '#8B5CF6' : '#60A5FA');

    // Enhanced hover physics scaling
    node.on('click', (event, d: any) => onNavigate(d.id))
      .on('mouseover', (event: any, d: any) => {
        d3.select(event.currentTarget)
          .transition().duration(300)
          .attr('r', 10)
          .attr('stroke-width', 2.5);

        const isConnected = (o: any) => graph.edges.some(e => 
          (e.source === d.id && e.target === o.id) || 
          (e.source === o.id && e.target === d.id)
        );
        node.style('opacity', (o: any) => (o.id === d.id || isConnected(o)) ? 1 : 0.2);
        link.style('opacity', (o: any) => (o.source.id === d.id || o.target.id === d.id) ? 1 : 0.1);
      })
      .on('mouseout', (event: any) => {
        d3.select(event.currentTarget)
          .transition().duration(300)
          .attr('r', 6)
          .attr('stroke-width', 1.5);
          
        node.style('opacity', 1);
        link.style('opacity', 0.6);
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x || 0)
        .attr('y1', (d: any) => d.source.y || 0)
        .attr('x2', (d: any) => d.target.x || 0)
        .attr('y2', (d: any) => d.target.y || 0);
      node
        .attr('cx', (d: any) => d.x || 0)
        .attr('cy', (d: any) => d.y || 0);
        
      // Save out positions for next cycle smoothly bypassing standard unmount wiping
      nodes.forEach((n: any) => {
          prevNodesRef.current.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
      });
    });

    return () => {
       simulation.stop();
    };
  }, [graph, currentPage, onNavigate, isFullscreen]);

  return (
    <div className={`backdrop-blur-md bg-bg/95 border-l border-border flex flex-col transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 w-full h-full' : 'absolute md:relative right-0 top-0 bottom-0 z-40 w-full md:w-[380px] flex-shrink-0'}`}>
      <div className="p-4 md:p-6 border-b border-border relative">
        {selectedPath ? (
           <div className="animate-in slide-in-from-right duration-300">
               <button onClick={() => setSelectedPath(null)} className="text-accent mb-4 text-xs font-bold">← Back to Current</button>
               <h3 className="text-text font-bold mb-4">{selectedPath.name}</h3>
               <div className="flex flex-col gap-2">
                 {selectedPath.path.map((step, i) => (
                    <div key={i} className="text-xs p-3 rounded bg-bg/50 border border-border flex justify-between items-center text-text">
                        <div className="flex items-center gap-3">
                            <span className="bg-accent/10 text-accent size-5 flex items-center justify-center rounded-full text-[10px] font-bold">{i + 1}</span>
                            {step.title}
                        </div>
                        <span className="text-[10px] text-text-dim">{new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                 ))}
               </div>
           </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
                <div className="text-[10px] text-accent uppercase">Navigation Path</div>
                <div className="flex gap-1.5 items-center">
                    {path.length > 0 && !isSaving && !saveSuccess && (
                        <>
                            {showClearConfirm ? (
                                <div className="flex gap-1 items-center bg-red-500/10 border border-red-500/20 rounded-md px-1 py-0.5">
                                    <span className="text-[10px] text-red-400 font-bold ml-1">Clear map?</span>
                                    <button onClick={() => { setShowClearConfirm(false); onClearPath(); }} className="text-[10px] hover:bg-red-500 hover:text-white text-red-500 px-2 py-0.5 rounded transition-colors ml-1">Yes</button>
                                    <button onClick={() => setShowClearConfirm(false)} className="text-[10px] hover:bg-white/10 text-text-dim px-2 py-0.5 rounded transition-colors hover:text-white">No</button>
                                </div>
                            ) : (
                                <button onClick={() => setShowClearConfirm(true)} className="text-[10px] text-text-dim hover:text-red-400 px-2 py-1 transition-colors">Clear</button>
                            )}
                            <button onClick={() => setIsSaving(true)} className="text-[10px] bg-accent/10 hover:bg-accent hover:text-white px-2 py-1 rounded text-accent transition-all">Save</button>
                        </>
                    )}
                    {saveSuccess && (
                        <span className="text-[10px] text-green-400 font-bold border border-green-400/30 bg-green-400/10 px-2 py-1 rounded">Saved!</span>
                    )}
                    <button 
                       onClick={() => setIsFullscreen(!isFullscreen)} 
                       className="bg-black/50 hover:bg-accent/20 border border-border text-text hover:text-white p-1.5 rounded-lg transition-colors ml-1 hidden md:block"
                       title={isFullscreen ? "Minimize" : "Fullscreen"}
                    >
                        {isFullscreen ? (
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                        ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                        )}
                    </button>
                    <button 
                       onClick={onCloseMap} 
                       className="md:hidden bg-black/50 hover:bg-accent/20 border border-border text-text hover:text-white p-1.5 rounded-lg transition-colors ml-1"
                       title="Close Map"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
            </div>
            {isSaving && (
                <div className="flex gap-2 mb-3 animate-in fade-in duration-200">
                    <input 
                        type="text" 
                        value={pathName} 
                        onChange={e => setPathName(e.target.value)} 
                        placeholder="Name your path..."
                        className="text-xs bg-black border border-border px-3 py-1.5 rounded-lg text-text flex-grow focus:outline-none focus:border-accent"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && confirmSave()}
                    />
                    <button onClick={confirmSave} className="text-xs bg-accent text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90">✓</button>
                    <button onClick={() => {setIsSaving(false); setPathName('');}} className="text-xs bg-black border border-border px-3 py-1.5 rounded-lg text-text-dim hover:text-white">✕</button>
                </div>
            )}
            <div className="flex flex-wrap gap-2 text-xs mb-4">
              {path.length > 0 ? path.map((crumb, i) => (
                  <span key={`${crumb.title}-${i}`} className={i === path.length - 1 ? 'text-accent font-bold' : 'text-text-dim'}>
                    {crumb.title} {i < path.length - 1 && '→'}
                  </span>
              )) : <span className="text-text-dim">Start Exploring...</span>}
            </div>
          </>
        )}
      </div>
      
      <svg ref={svgRef} className="w-full flex-grow min-h-[300px]"></svg>
    </div>
  );
};
