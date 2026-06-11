const CACHE_KEY_PREFIX = 'wiki_cache_';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const decodeHTML = (html: string) => {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

const getCachedPage = (title: string) => {
  const cached = localStorage.getItem(CACHE_KEY_PREFIX + title);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) return data;
  }
  return null;
};

const setCachedPage = (title: string, data: any) => {
  try {
      localStorage.setItem(CACHE_KEY_PREFIX + title, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
      Object.keys(localStorage).forEach(key => {
          if (key.startsWith('wiki_cache_') || key.startsWith('full_wiki_')) localStorage.removeItem(key);
      });
      try { localStorage.setItem(CACHE_KEY_PREFIX + title, JSON.stringify({ data, timestamp: Date.now() })); } catch (err) {}
  }
};

export interface PageDetails {
  title: string;
  description: string;
  extract: string;
  background: string;
  images: string[];
  links: string[];
  sections: { title: string; content: string }[];
  keyPoints: string[];
  personInfo: Record<string, string> | null;
}

export const resolveCanonicalTitle = async (query: string): Promise<string> => {
  // Normalize: trim, remove non-alphanumeric, apply Title Case-ish
  const normalized = query.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  
  // Search Wikipedia to get the best match
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(normalized)}&format=json&origin=*`;
  const response = await fetch(searchUrl);
  const data = await response.json();
  
  if (data.query.search.length > 0) {
    // Return the top result title
    return data.query.search[0].title;
  }
  
  // Fallback if no search result
  return query; 
};

export const fetchWikiData = async (rawTitle: string): Promise<PageDetails> => {
  // 0. Resolve to canonical title first
  const title = await resolveCanonicalTitle(rawTitle);
  
  const cached = getCachedPage(title);
  if (cached) return cached;

  const summaryPromise = fetchWithRetry(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  const parsePromise = fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&redirects=1&prop=extracts|text|links|images|categories&format=json&origin=*`).then(r => r.json());
  
  const [summaryData, parseData] = await Promise.all([summaryPromise, parsePromise]);
  
  if (!parseData) {
      throw new Error('Wikipedia API did not return a valid response.');
  }
  
  if (parseData.error) {
      // Wikipedia API error format: { error: { code: 'some_code', info: 'Some localized message' } }
      // the error might just say "The page you specified doesn't exist." because of normalization discrepancies.
      const rawError = parseData.error?.info || 'Unknown Wikipedia API error';
      // Give a helpful message indicating the exact title it failed on.
      throw new Error(`Could not parse the resolved title "${title}". (API returned: ${rawError})`);
  }
  
  if (!parseData.parse || !parseData.parse.text) {
      throw new Error(`The Wikipedia API didn't return text data for "${title}". It may be a stub or a redirect the API failed to follow.`);
  }

  const parse = parseData.parse;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(parse.text['*'], 'text/html');
  const body = doc.body;

  // REMOVE ARTIFACTS
  [...body.querySelectorAll('.mw-editsection, .reference, .reflist, table, script, style, noscript, .navbox, .sidebar, .metadata, .mbox-small')].forEach(el => el.remove());

  // 1. Better Key Points
  const paragraphs = Array.from(body.querySelectorAll('p')).slice(0, 5);
  // Get text from paragraphs, stripping citations
  const sentences = paragraphs.map(p => p.textContent?.replace(/\[\d+\]/g, '') || "").join(' ').split(/[.!?]/).filter(s => s.trim().length > 30);
  const keyPoints = extractQualityKeyPoints(sentences);

  // 2. Images (Distinct Deduplication)
  const rawImageUrls = [
      ...(summaryData?.originalimage?.source ? [summaryData.originalimage.source] : []),
      ...(summaryData?.thumbnail?.source ? [summaryData.thumbnail.source] : []),
      ...Array.from(body.querySelectorAll('img')).map(img => img.getAttribute('src'))
  ].filter((src): src is string => src !== null && (src.startsWith('http') || src.startsWith('//')));

  const seenNames = new Set<string>();
  let images: string[] = [];
  const junkFilters = ['clear.png', 'ambox', 'magnify-clip', 'folder', 'gpl.png', 'wikipedia-logo', 'wikiquote-logo', 'static/images/'];

  for (let url of rawImageUrls) {
      if (url.startsWith('//')) url = 'https:' + url;
      if (junkFilters.some(j => url.toLowerCase().includes(j))) continue;

      let filename = url.split('/').pop() || '';
      try { filename = decodeURIComponent(filename); } catch (e) {}
      
      // Wikipedia often has multiple resolutions of the same image.
      // E.g., .../thumb/abc.jpg/320px-abc.jpg
      // We strip the "320px-" prefix so we can recognize it's the exact same picture.
      filename = filename.replace(/^\d+px-/, ''); 
      
      const cleanName = filename.toLowerCase();

      if (cleanName && !seenNames.has(cleanName)) {
         seenNames.add(cleanName);
         images.push(url);
      }
  }
  
  images = images.slice(0, 3);

  // 3. Person Info Detection
  const personInfo = extractPersonInfo(body);

  // 4. Improved Links (Only valid articles)
  const validApiLinks = new Set((parseData.parse.links || [])
      .filter((l: any) => l.ns === 0 && 'exists' in l)
      .map((l: any) => l['*'])
  );

  const allTextLinks = Array.from(body.querySelectorAll('p a'))
    .map(a => a.getAttribute('title'))
    .filter((title): title is string => title !== null && validApiLinks.has(title) && !title.startsWith('List of'));
  
  const links = [...new Set(allTextLinks)].slice(0, 8);

  const result: PageDetails = {
    title: parse.title,
    description: decodeHTML(summaryData?.description || ""),
    extract: decodeHTML(summaryData?.extract || paragraphs[0]?.textContent?.trim() || ""),
    background: paragraphs.slice(1, 3).map(p => p.textContent?.trim()).filter(Boolean).join('\n\n') || "",
    images,
    links,
    sections: parseSectionsStructured(body),
    keyPoints,
    personInfo
  };
  
  setCachedPage(title, result);
  return result;
};

function extractQualityKeyPoints(sentences: string[]): string[] {
    const importantKeywords = ['is', 'was', 'born', 'died', 'known for', 'developed', 'discovered', 'first', 'played'];
    return [...new Set(sentences
        .filter(s => importantKeywords.some(kw => s.toLowerCase().includes(kw)))
        .map(s => s.trim().replace(/\[\d+\]/g, '').replace(/\s+/g, ' ')))
        ].slice(0, 6);
}

function extractPersonInfo(body: HTMLElement): Record<string, string> | null {
    const infobox = body.querySelector('.infobox.vcard, .infobox.biography, .infobox');
    if (!infobox) return null;

    const info: Record<string, string> = {};
    const allowedKeys = ['Born', 'Died', 'Occupation', 'Known for', 'Spouse', 'Children', 'Nationality', 'Full name'];
    
    infobox.querySelectorAll('tr').forEach(tr => {
        const key = tr.querySelector('.infobox-label')?.textContent?.trim().replace(':', '');
        const value = tr.querySelector('.infobox-data')?.textContent?.replace(/\s+/g, ' ').trim();
        
        if (key && value && allowedKeys.some(ak => key.includes(ak))) {
             info[key] = value;
        }
    });

    return Object.keys(info).length > 0 ? info : null;
}

function parseSectionsStructured(body: HTMLElement) {
    const sections: { title: string; content: string }[] = [];
    const h2s = body.querySelectorAll('h2');
    
    h2s.forEach(h2 => {
        if(h2.textContent?.includes('References') || h2.textContent?.includes('External')) return;
        let content = '';
        let next = h2.nextElementSibling;
        while(next && next.tagName === 'P') {
            content += next.textContent + '\n\n';
            next = next.nextElementSibling;
        }
        if (content) sections.push({ title: h2.textContent?.replace('[edit]', '').trim() || '', content: content.trim() });
    });
    return sections.slice(0, 4);
}

async function fetchWithRetry(url: string, retries = 2): Promise<any> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch failed');
        return await response.json();
    } catch (e) {
        if (retries > 0) return fetchWithRetry(url, retries - 1);
        return null;
    }
}

export const fetchFullArticle = async (title: string): Promise<string> => {
  const cached = localStorage.getItem(`full_wiki_${title}`);
  if (cached) return cached;

  try {
      const response = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&redirects=1&prop=text&format=json&origin=*`);
      const data = await response.json();
      
      if (data.error || !data.parse || !data.parse.text) {
         throw new Error(data.error?.info || 'The Wikipedia API did not return text for this article.');
      }
      
      const rawHtml = data.parse.text['*'];
      const cleaned = cleanHTML(rawHtml);
      
      try { localStorage.setItem(`full_wiki_${title}`, cleaned); } catch(e) {
          Object.keys(localStorage).forEach(key => key.startsWith('full_wiki_') && localStorage.removeItem(key));
      }
      return cleaned;
  } catch (e: any) {
      console.error(e);
      throw new Error(`Full article could not be loaded: ${e.message}`);
  }
};

export const cleanHTML = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove unwanted elements
    const selectorsToRemove = [
        '.mw-editsection', '.reference', '.reflist', '.infobox', 
        '.navbox', '.sidebar', 'table', 'script', 'style', 'noscript'
    ];
    
    selectorsToRemove.forEach(selector => {
        doc.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Clean up internal links
    doc.querySelectorAll('a').forEach(a => {
        a.removeAttribute('href');
        a.style.color = 'inherit';
        a.style.textDecoration = 'none';
        a.style.pointerEvents = 'none';
    });

    return doc.body.innerHTML;
};

function parseSections(html: string) {
    // Basic parser to split content into sections (Overview, History, Apps/Uses)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const sections: { title: string; content: string }[] = [];
    
    // Simplistic sectioning for demo
    const headers = ['Overview', 'History', 'Applications', 'Uses'];
    headers.forEach(h => {
        const el = Array.from(doc.querySelectorAll('h2, h3')).find(e => e.textContent?.includes(h));
        if (el) {
            let content = '';
            let next = el.nextElementSibling;
            while(next && next.tagName === 'P') {
                content += next.textContent + ' ';
                next = next.nextElementSibling;
            }
            sections.push({ title: h, content: content.trim() });
        }
    });
    return sections;
}

export const fetchRandomPage = async (): Promise<string> => {
  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/random/summary`);
  const data = await response.json();
  return data.title;
};
