import { useRef, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LiveEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Parse line for styling - returns React elements
const renderLine = (line: string, lineIndex: number, inCodeBlock: boolean): React.ReactNode => {
  // Inside code block
  if (inCodeBlock) {
    return (
      <span key={lineIndex} className="md-code-content">{line || '\u00A0'}</span>
    );
  }

  // Code block markers
  if (line.startsWith('```')) {
    const lang = line.slice(3);
    return (
      <span key={lineIndex} className="md-code-fence">
        <span className="md-syntax">```</span>
        <span>{lang}</span>
      </span>
    );
  }

  // Headings
  const h6Match = line.match(/^(######\s)(.*)$/);
  if (h6Match) {
    return (
      <span key={lineIndex}>
        <span className="md-syntax">{h6Match[1]}</span>
        <span className="md-h6">{parseInline(h6Match[2])}</span>
      </span>
    );
  }

  const h5Match = line.match(/^(#####\s)(.*)$/);
  if (h5Match) {
    return (
      <span key={lineIndex}>
        <span className="md-syntax">{h5Match[1]}</span>
        <span className="md-h5">{parseInline(h5Match[2])}</span>
      </span>
    );
  }

  const h4Match = line.match(/^(####\s)(.*)$/);
  if (h4Match) {
    return (
      <span key={lineIndex}>
        <span className="md-syntax">{h4Match[1]}</span>
        <span className="md-h4">{parseInline(h4Match[2])}</span>
      </span>
    );
  }

  const h3Match = line.match(/^(###\s)(.*)$/);
  if (h3Match) {
    return (
      <span key={lineIndex}>
        <span className="md-syntax">{h3Match[1]}</span>
        <span className="md-h3">{parseInline(h3Match[2])}</span>
      </span>
    );
  }

  const h2Match = line.match(/^(##\s)(.*)$/);
  if (h2Match) {
    return (
      <span key={lineIndex}>
        <span className="md-syntax">{h2Match[1]}</span>
        <span className="md-h2">{parseInline(h2Match[2])}</span>
      </span>
    );
  }

  const h1Match = line.match(/^(#\s)(.*)$/);
  if (h1Match) {
    return (
      <span key={lineIndex}>
        <span className="md-syntax">{h1Match[1]}</span>
        <span className="md-h1">{parseInline(h1Match[2])}</span>
      </span>
    );
  }

  // Regular line
  return <span key={lineIndex}>{parseInline(line) || '\u00A0'}</span>;
};

// Parse inline formatting
const parseInline = (text: string): React.ReactNode[] => {
  if (!text) return [];

  const elements: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Inline code `code`
    const codeMatch = remaining.match(/^(`[^`]+`)/);
    if (codeMatch) {
      const code = codeMatch[1];
      elements.push(
        <span key={keyIndex++} className="md-inline-code">{code}</span>
      );
      remaining = remaining.slice(code.length);
      continue;
    }

    // Bold **text**
    const boldMatch = remaining.match(/^(\*\*)([^*]+)(\*\*)/);
    if (boldMatch) {
      elements.push(
        <span key={keyIndex++}>
          <span className="md-syntax">{boldMatch[1]}</span>
          <strong className="font-bold">{boldMatch[2]}</strong>
          <span className="md-syntax">{boldMatch[3]}</span>
        </span>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Strikethrough ~~text~~
    const strikeMatch = remaining.match(/^(~~)([^~]+)(~~)/);
    if (strikeMatch) {
      elements.push(
        <span key={keyIndex++}>
          <span className="md-syntax">{strikeMatch[1]}</span>
          <del className="line-through">{strikeMatch[2]}</del>
          <span className="md-syntax">{strikeMatch[3]}</span>
        </span>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Italic *text*
    const italicMatch = remaining.match(/^(\*)([^*]+)(\*)/);
    if (italicMatch) {
      elements.push(
        <span key={keyIndex++}>
          <span className="md-syntax">{italicMatch[1]}</span>
          <em className="italic">{italicMatch[2]}</em>
          <span className="md-syntax">{italicMatch[3]}</span>
        </span>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // URL
    const urlMatch = remaining.match(/^(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      elements.push(
        <span key={keyIndex++} className="md-link">{urlMatch[1]}</span>
      );
      remaining = remaining.slice(urlMatch[1].length);
      continue;
    }

    // Regular character
    elements.push(<span key={keyIndex++}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return elements;
};

// Process all lines
const processContent = (content: string): React.ReactNode[] => {
  const lines = content.split('\n');
  const result: React.ReactNode[] = [];
  let inCodeBlock = false;

  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      const wasInCodeBlock = inCodeBlock;
      inCodeBlock = !inCodeBlock;
      result.push(renderLine(line, index, wasInCodeBlock));
    } else {
      result.push(renderLine(line, index, inCodeBlock));
    }
    
    // Add newline except for last line
    if (index < lines.length - 1) {
      result.push('\n');
    }
  });

  return result;
};

const LiveEditor = ({ value, onChange, placeholder = "Mulai menulis..." }: LiveEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Sync scroll
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Auto-resize
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, window.innerHeight - 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [adjustHeight]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full min-h-screen safe-top bg-editor-bg"
    >
      <div className="relative max-w-3xl mx-auto">
        {/* Highlight overlay */}
        <div
          ref={highlightRef}
          className="live-highlight absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16 lg:px-20 lg:py-20"
          aria-hidden="true"
        >
          {value ? processContent(value) : <span className="md-placeholder">{placeholder}</span>}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          placeholder=""
          className="live-textarea relative w-full min-h-screen resize-none outline-none border-0 bg-transparent px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16 lg:px-20 lg:py-20 pb-32"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="sentences"
          autoCorrect="on"
        />
      </div>
    </motion.div>
  );
};

export default LiveEditor;
