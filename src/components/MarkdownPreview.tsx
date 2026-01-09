import { motion } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { parseMarkdown } from '@/lib/markdown';
import ImageLightbox from './ImageLightbox';
import mermaid from 'mermaid';

interface MarkdownPreviewProps {
  content: string;
}

interface LightboxState {
  isOpen: boolean;
  src: string;
  alt: string;
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
  sequence: {
    diagramMarginX: 20,
    diagramMarginY: 20,
    actorMargin: 50,
    width: 150,
    height: 65,
    boxMargin: 10,
    useMaxWidth: true,
  },
});

const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  const html = parseMarkdown(content);
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState>({
    isOpen: false,
    src: '',
    alt: ''
  });
  const [mermaidKey, setMermaidKey] = useState(0);

  const handleCopyCode = useCallback(async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const openLightbox = useCallback((src: string, alt: string) => {
    setLightbox({ isOpen: true, src, alt });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Render Mermaid diagrams
  useEffect(() => {
    if (!containerRef.current) return;

    const renderMermaidDiagrams = async () => {
      const mermaidDivs = containerRef.current?.querySelectorAll('.mermaid-diagram');
      if (!mermaidDivs || mermaidDivs.length === 0) return;

      // Check if dark mode
      const isDark = document.documentElement.classList.contains('dark');
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, sans-serif',
      });

      for (let i = 0; i < mermaidDivs.length; i++) {
        const div = mermaidDivs[i] as HTMLElement;
        const code = decodeURIComponent(div.getAttribute('data-mermaid') || '');
        
        if (!code || div.classList.contains('mermaid-rendered')) continue;

        try {
          const id = `mermaid-${Date.now()}-${i}`;
          const { svg } = await mermaid.render(id, code);
          div.innerHTML = svg;
          div.classList.add('mermaid-rendered');
        } catch (error) {
          console.error('Mermaid render error:', error);
          div.innerHTML = `<div class="mermaid-error">Diagram error: Invalid syntax</div>`;
          div.classList.add('mermaid-rendered');
        }
      }
    };

    // Slight delay to ensure DOM is ready
    const timer = setTimeout(renderMermaidDiagrams, 100);
    return () => clearTimeout(timer);
  }, [html, mermaidKey]);

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

    // Add click handlers for lightbox images
    const images = containerRef.current.querySelectorAll('img[data-lightbox="true"]');
    images.forEach((img) => {
      const imgElement = img as HTMLImageElement;
      imgElement.style.cursor = 'zoom-in';
      
      const handleClick = () => {
        openLightbox(imgElement.src, imgElement.alt);
      };
      
      imgElement.addEventListener('click', handleClick);
    });

    return () => {
      // Cleanup image listeners
      const images = containerRef.current?.querySelectorAll('img[data-lightbox="true"]');
      images?.forEach((img) => {
        const imgElement = img as HTMLImageElement;
        imgElement.removeEventListener('click', () => {});
      });
    };
  }, [html, handleCopyCode, openLightbox]);

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
      <div className="w-full max-w-[92%] xs:max-w-[88%] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 py-6 xs:px-5 xs:py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 text-muted-foreground italic font-serif">
        Tidak ada konten untuk ditampilkan...
      </div>
    );
  }

  return (
    <>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="markdown-preview w-full max-w-[92%] xs:max-w-[88%] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 py-6 xs:px-5 xs:py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-12 lg:py-16 pb-20 xs:pb-24 sm:pb-28"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      <ImageLightbox
        src={lightbox.src}
        alt={lightbox.alt}
        isOpen={lightbox.isOpen}
        onClose={closeLightbox}
      />
    </>
  );
};

export default MarkdownPreview;
