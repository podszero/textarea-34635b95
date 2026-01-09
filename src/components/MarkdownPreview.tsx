import { motion } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';
import { parseMarkdown } from '@/lib/markdown';

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  const html = parseMarkdown(content);
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = useCallback(async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const preElements = containerRef.current.querySelectorAll('pre');
    
    preElements.forEach((pre, index) => {
      // Skip if button already exists
      if (pre.querySelector('.copy-code-btn')) return;

      // Wrap pre in relative container
      pre.style.position = 'relative';

      const codeElement = pre.querySelector('code');
      const codeText = codeElement?.textContent || '';

      const button = document.createElement('button');
      button.className = 'copy-code-btn';
      button.setAttribute('aria-label', 'Salin kode');
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
      
      button.addEventListener('click', () => handleCopyCode(codeText, index));

      pre.appendChild(button);
    });
  }, [html, handleCopyCode]);

  // Update button states when copiedIndex changes
  useEffect(() => {
    if (!containerRef.current) return;

    const buttons = containerRef.current.querySelectorAll('.copy-code-btn');
    buttons.forEach((btn, index) => {
      if (copiedIndex === index) {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M20 6 9 17l-5-5"/></svg>`;
        btn.classList.add('copied');
      } else {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
        btn.classList.remove('copied');
      }
    });
  }, [copiedIndex]);

  if (!content) {
    return (
      <div className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-10 md:px-10 md:py-14 text-muted-foreground italic font-serif text-base sm:text-lg">
        Tidak ada konten untuk ditampilkan...
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="markdown-preview w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-10 md:px-10 md:py-14 lg:px-16 lg:py-16 xl:px-20 text-base sm:text-lg md:text-lg pb-28 sm:pb-32"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPreview;
