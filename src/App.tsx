/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Content } from './components/Content';
import { Map } from './components/Map';
import { SavedPathsView } from './components/SavedPathsView';
import { AI } from './pages/AI';
import { PageDetails, fetchWikiData, fetchRandomPage } from './lib/wikipedia';
import { Graph, PathStep } from './types';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<PageDetails | null>(null);
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState<PathStep[]>([]);
  const [isMapVisible, setIsMapVisible] = useState(window.innerWidth >= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'explore' | 'saved'>('explore');
  const navigate = useNavigate();

  const handleClearPath = () => {
    setPath([]);
    setGraph({ nodes: [], edges: [] });
    setCurrentPage(null);
  };

  const handleArticleClick = useCallback(async (title: string) => {
    setActiveView('explore');
    setLoading(true);
    try {
      const data = await fetchWikiData(title);
      
      setPath(prevPath => {
          const existingIndex = prevPath.findIndex(p => p.title === title);
          const isReturning = existingIndex !== -1 && existingIndex < prevPath.length - 1;
          const currentPath = isReturning ? prevPath.slice(0, existingIndex + 1) : prevPath;
          
          const isDuplicate = !isReturning && currentPath.length > 0 && currentPath[currentPath.length - 1].title === title;
          if (isDuplicate) return currentPath;

          if (currentPath.length === 50) {
              setTimeout(() => alert("Map cap reached (50 nodes). Oldest nodes will now fade out, but your path history is safe!"), 0);
          }

          setGraph(prevGraph => {
             const newGraph = { nodes: [...prevGraph.nodes], edges: [...prevGraph.edges] };
             if (!newGraph.nodes.find(n => n.id === title)) {
                 newGraph.nodes.push({ id: title });
             }
             if (currentPath.length > 0) {
                 const prevTitle = currentPath[currentPath.length - 1].title;
                 if (!newGraph.edges.find(e => e.source === prevTitle && e.target === title)) {
                     newGraph.edges.push({ source: prevTitle, target: title });
                 }
             }
             if (newGraph.nodes.length > 50) newGraph.nodes.shift();
             return newGraph;
          });

          return isReturning ? currentPath : [...currentPath, { title, timestamp: Date.now() }];
      });
      
      setCurrentPage(data);
    } catch (e: any) {
      console.error(e);
      alert(`Could not load page: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handleRandom = async () => {
    try {
      const randomTitle = await fetchRandomPage();
      await handleArticleClick(randomTitle);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-bg text-text overflow-hidden relative">
      <Sidebar 
        onViewChange={(v) => { setActiveView(v); navigate('/'); }} 
        activeView={activeView} 
        onOpenAI={() => navigate('/ai')} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      {activeView === 'saved' ? (
        <SavedPathsView onNavigate={(title) => {
           handleArticleClick(title);
           if (window.innerWidth < 768) setIsMapVisible(false);
        }} onMenuToggle={() => setIsSidebarOpen(true)} />
      ) : (
        <>
            <Content
                page={currentPage}
                onNavigate={(title) => {
                   handleArticleClick(title);
                   if (window.innerWidth < 768) setIsMapVisible(false);
                }}
                onSearch={handleArticleClick}
                onRandom={handleRandom}
                loading={loading}
                isMapVisible={isMapVisible}
                toggleMap={() => setIsMapVisible(!isMapVisible)}
                onMenuToggle={() => setIsSidebarOpen(true)}
            />
            {isMapVisible && <Map graph={graph} currentPage={currentPage?.title || ''} path={path} onNavigate={handleArticleClick} onClearPath={handleClearPath} onCloseMap={() => setIsMapVisible(false)} />}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/ai" element={<AI />} />
      </Routes>
    </BrowserRouter>
  );
}
