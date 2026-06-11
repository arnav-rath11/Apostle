import { Eye, EyeOff, Loader2, Image as ImageIcon, X, Menu } from 'lucide-react';
import { PageDetails, fetchFullArticle } from '../lib/wikipedia';
import { useState } from 'react';

interface ContentProps {
  page: PageDetails | null;
  onNavigate: (title: string) => void;
  onSearch: (title: string) => void;
  onRandom: () => void;
  loading: boolean;
  isMapVisible: boolean;
  toggleMap: () => void;
  onMenuToggle?: () => void;
}

export const Content = ({ page, onNavigate, onSearch, onRandom, loading, isMapVisible, toggleMap, onMenuToggle }: ContentProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFull, setShowFull] = useState(false);
  const [fullLoading, setFullLoading] = useState(false);
  const [fullContent, setFullContent] = useState<string | null>(null);

  const handleFetchFull = async () => {
    if (!page) return;
    setFullLoading(true);
    setShowFull(true);
    try {
        const content = await fetchFullArticle(page.title);
        setFullContent(content);
    } catch (e) {
        setFullContent('<p>Full article could not be loaded</p>');
    } finally {
        setFullLoading(false);
    }
  };

  return (
    <div className="flex-grow overflow-auto p-4 md:p-10 flex flex-col gap-6 scrollbar-hide">
      <div className="flex gap-2 w-full max-w-full sticky top-0 z-10 bg-bg/80 pb-4 backdrop-blur-md">
        <button onClick={onMenuToggle} className="md:hidden flex-shrink-0 p-2 border border-border rounded-lg bg-bg text-text hover:text-accent">
          <Menu size={24} />
        </button>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Start a rabbit hole…"
          className="min-w-0 flex-1 bg-bg border border-border text-text rounded-lg px-3 py-2 md:px-5 md:py-3 focus:outline-none focus:border-accent"
          onKeyDown={(e) => e.key === 'Enter' && searchTerm.trim() && onSearch(searchTerm)}
        />
        <button 
           disabled={!searchTerm.trim()} 
           className="hidden md:block px-6 py-2 bg-bg border border-accent text-accent rounded-lg font-semibold text-sm cursor-pointer hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
           onClick={() => searchTerm.trim() && onSearch(searchTerm)}>
           Search
        </button>
        <button className="hidden md:block px-6 py-2 bg-bg border border-border text-text-dim rounded-lg font-semibold text-sm cursor-pointer hover:border-accent hover:text-accent" onClick={onRandom}>
           Random
        </button>
        <button onClick={toggleMap} className="flex-shrink-0 px-3 py-2 bg-bg border border-border text-text rounded-lg cursor-pointer hover:border-accent hover:text-accent">
          {isMapVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col justify-center items-center h-full gap-4">
          <Loader2 className="animate-spin text-accent" size={48} />
          <p className="text-text-dim">Fetching article...</p>
        </div>
      )}

      {page && !loading && (
        <div className="flex flex-col gap-8 max-w-4xl animate-in fade-in duration-500">
          <header>
            <h1 className="text-5xl font-bold text-white tracking-tight">{page.title}</h1>
            <p className="text-xl text-text-dim">{page.description}</p>
          </header>

          {page.personInfo && (
            <section className="bg-black border border-accent/20 rounded-3xl p-8">
                <h3 className="text-sm text-accent uppercase tracking-widest mb-6">Quick Facts</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                    {Object.entries(page.personInfo).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                            <dt className="text-xs text-text-dim uppercase">{key}</dt>
                            <dd className="text-white font-medium">{value}</dd>
                        </div>
                    ))}
                </dl>
            </section>
          )}

          {page.images?.length > 0 && (
            <div className="flex gap-4 w-full">
              {page.images.map((img, i) => (
                <img key={i} src={img} alt={page.title} className="rounded-2xl border border-border flex-1 w-0 h-64 md:h-80 object-cover" referrerPolicy="no-referrer" />
              ))}
            </div>
          )}

          <section className="bg-glass border border-border rounded-3xl p-8">
            <h3 className="text-sm text-accent uppercase tracking-widest mb-4">Overview</h3>
            <p className="text-text-dim text-lg leading-relaxed">{page.extract || 'No overview available.'}</p>
          </section>

          {page.keyPoints && page.keyPoints.length > 0 && (
            <section className="bg-black border border-accent/20 rounded-2xl p-8">
                <h3 className="text-sm text-accent uppercase tracking-widest mb-4">Key Points</h3>
                <ul className="list-disc list-inside text-text-dim space-y-2">
                {page.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
            </section>
          )}

          {page.background && (
            <section className="border border-border rounded-3xl p-8">
              <h3 className="text-sm text-accent uppercase tracking-widest mb-4">Context / Background</h3>
              <p className="text-text-dim text-lg leading-relaxed whitespace-pre-line">{page.background}</p>
            </section>
          )}
          
          <button 
            onClick={handleFetchFull}
            className="w-full py-4 bg-accent/10 border border-accent text-accent rounded-2xl font-bold hover:bg-accent hover:text-white transition-all"
          >
            {fullLoading ? <Loader2 className="animate-spin inline mr-2" size={20}/> : "View Full Content"}
          </button>
          
          {showFull && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-sm">
                  <div className="bg-[#0A0A0F] border border-border w-full max-w-5xl max-h-[90vh] overflow-auto rounded-[2rem] p-8 md:p-16 animate-in zoom-in duration-300 shadow-2xl shadow-accent/20">
                      <div className="flex justify-between items-center mb-8 bg-[#0A0A0F] py-4 border-b border-white/10">
                          <h2 className="text-3xl font-bold text-white tracking-tighter">Full Article</h2>
                          <button onClick={() => setShowFull(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="text-white" size={24} /></button>
                      </div>
                      
                      <div className="px-2">
                        {fullLoading ? (
                            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-accent" size={48} /></div>
                        ) : (
                            <article className="prose prose-invert prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:tracking-tighter prose-headings:text-white prose-a:text-accent prose-p:text-text-dim">
                               <div dangerouslySetInnerHTML={{ __html: fullContent || '' }} />
                            </article>
                        )}
                        
                        {fullContent && !fullLoading && (
                            <div className="mt-20 pt-8 border-t border-white/10">
                                <button 
                                  onClick={() => window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(page?.title.replace(/ /g, '_') || '')}`, "_blank")}
                                  className="flex items-center gap-2 text-accent font-semibold hover:text-white transition-colors"
                                >
                                  Read original article on Wikipedia
                                  <span className="text-xs">↗</span>
                                </button>
                            </div>
                        )}
                      </div>
                  </div>
              </div>
          )}
          
          <section>
            <h3 className="text-sm text-accent uppercase tracking-widest mb-4">Forward Pathways</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {page.links?.map((link, i) => (
                <button
                  key={`${link}-${i}`}
                  onClick={() => onNavigate(link)}
                  className="text-left text-sm text-text-dim hover:text-white bg-black border border-border hover:border-accent rounded-xl px-4 py-3 transition-all truncate"
                >
                  {link}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
