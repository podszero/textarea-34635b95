import { useState, useEffect, useCallback } from 'react';
import {
  getHashContent,
  setHashContent,
  extractTitle,
} from '@/lib/compression';
import { parseMarkdown } from '@/lib/markdown';
import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB } from '@/lib/storage';

const STORAGE_KEY = 'textarea-content';
const SAVE_DELAY = 500;

export function useDocument() {
  const [content, setContent] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load content on mount
  useEffect(() => {
    const loadContent = async () => {
      const hashContent = getHashContent();
      const localContent = localStorage.getItem(STORAGE_KEY) || '';
      const indexedContent = await loadFromIndexedDB();

      // Priority: URL hash > localStorage > IndexedDB
      const initialContent = hashContent || localContent || indexedContent || '';
      setContent(initialContent);
      setIsLoaded(true);

      // Sync to hash if loaded from storage
      if (!hashContent && initialContent) {
        setHashContent(initialContent);
      }
    };

    loadContent();
  }, []);

  // Save content with debounce
  useEffect(() => {
    if (!isLoaded) return;

    const timeoutId = setTimeout(() => {
      // Save to all storage mechanisms
      localStorage.setItem(STORAGE_KEY, content);
      saveToIndexedDB(content);
      setHashContent(content);

      // Update page title from first # heading
      const title = extractTitle(content);
      document.title = title || 'Catatan';
    }, SAVE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [content, isLoaded]);

  // Listen for hash changes (e.g., back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hashContent = getHashContent();
      if (hashContent !== content) {
        setContent(hashContent);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [content]);

  const handleNew = useCallback(() => {
    setContent('');
    localStorage.removeItem(STORAGE_KEY);
    clearIndexedDB();
    window.history.replaceState(null, '', window.location.pathname);
    document.title = 'Catatan';
  }, []);

  const handleDownloadHtml = useCallback(() => {
    const title = extractTitle(content) || 'dokumen';
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: Georgia, serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.8;
      color: #1a1a1a;
    }
    h1, h2, h3 { font-family: system-ui, sans-serif; }
    code { background: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px; }
    pre { background: #f0f0f0; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 3px solid #d97706; padding-left: 1rem; margin-left: 0; color: #666; }
    a { color: #d97706; }
  </style>
</head>
<body>
${parseMarkdown(content)}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content]);

  const handleDownloadText = useCallback(() => {
    const title = extractTitle(content) || 'dokumen';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content]);

  const handleDownloadMarkdown = useCallback(() => {
    const title = extractTitle(content) || 'dokumen';
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content]);

  return {
    content,
    setContent,
    isLoaded,
    handleNew,
    handleDownloadHtml,
    handleDownloadText,
    handleDownloadMarkdown,
  };
}
