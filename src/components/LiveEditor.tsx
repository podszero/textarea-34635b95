import { useRef, useCallback, useEffect } from 'react';
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
        <span className="md-code-lang">{lang}</span>
      </span>
    );
  }

  // Headings - check from most specific (######) to least (#)
  const headingMatch = line.match(/^(#{1,6})\s(.*)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const hashes = headingMatch[1];
    const content = headingMatch[2];
    return (
      <span key={lineIndex}>
        <span className="md-syntax">{hashes} </span>
        <span className={`md-h${level}`}>{parseInline(content)}</span>
      </span>
    );
  }

  // Regular line
  if (!line) {
    return <span key={lineIndex}>{'\u00A0'}</span>;
  }
  
  return <span key={lineIndex}>{parseInline(line)}</span>;
};

// Parse inline formatting - optimized to batch regular text
const parseInline = (text: string): React.ReactNode[] => {
  if (!text) return ['\u00A0'];

  const elements: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;
  let regularText = '';

  const flushRegularText = () => {
    if (regularText) {
      elements.push(<span key={keyIndex++}>{regularText}</span>);
      regularText = '';
    }
  };

  while (remaining.length > 0) {
    // Inline code `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      flushRegularText();
      elements.push(
        <span key={keyIndex++} className="md-inline-code">
          <span className="md-syntax">`</span>
          <span className="md-code-text">{codeMatch[1]}</span>
          <span className="md-syntax">`</span>
        </span>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      flushRegularText();
      elements.push(
        <span key={keyIndex++} className="md-bold">
          <span className="md-syntax">**</span>
          <strong>{boldMatch[1]}</strong>
          <span className="md-syntax">**</span>
        </span>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Strikethrough ~~text~~
    const strikeMatch = remaining.match(/^~~([^~]+)~~/);
    if (strikeMatch) {
      flushRegularText();
      elements.push(
        <span key={keyIndex++} className="md-strike">
          <span className="md-syntax">~~</span>
          <del>{strikeMatch[1]}</del>
          <span className="md-syntax">~~</span>
        </span>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Italic *text* (but not **)
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch && !remaining.startsWith('**')) {
      flushRegularText();
      elements.push(
        <span key={keyIndex++} className="md-italic">
          <span className="md-syntax">*</span>
          <em>{italicMatch[1]}</em>
          <span className="md-syntax">*</span>
        </span>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // URL
    const urlMatch = remaining.match(/^(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      flushRegularText();
      elements.push(
        <a 
          key={keyIndex++} 
          href={urlMatch[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="md-link"
        >
          {urlMatch[1]}
        </a>
      );
      remaining = remaining.slice(urlMatch[1].length);
      continue;
    }

    // Accumulate regular characters
    regularText += remaining[0];
    remaining = remaining.slice(1);
  }

  flushRegularText();
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

const findUrlAtPosition = (text: string, pos: number): string | null => {
  if (pos < 0 || pos > text.length) return null;

  const lineStart = text.lastIndexOf('\n', Math.max(0, pos - 1)) + 1;
  const nextNewline = text.indexOf('\n', pos);
  const lineEnd = nextNewline === -1 ? text.length : nextNewline;

  const line = text.slice(lineStart, lineEnd);
  const posInLine = pos - lineStart;

  const urlRegex = /https?:\/\/[^\s)\]]+/g;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(line))) {
    const start = match.index;
    const end = start + match[0].length;
    if (posInLine >= start && posInLine <= end) return match[0];
  }

  return null;
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
    const highlight = highlightRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.max(textarea.scrollHeight, window.innerHeight - 100);
      textarea.style.height = `${newHeight}px`;
      if (highlight) {
        highlight.style.minHeight = `${newHeight}px`;
      }
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

  const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    // Desktop: Ctrl/Cmd + click to open
    if (!e.ctrlKey && !e.metaKey) return;

    // Wait for the caret to update after click
    requestAnimationFrame(() => {
      const textarea = e.currentTarget;
      const pos = textarea.selectionStart;

      const url = findUrlAtPosition(value, pos);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });
  };

  const openLinkAtCaret = (textarea: HTMLTextAreaElement) => {
    const pos = textarea.selectionStart;
    const url = findUrlAtPosition(value, pos);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    // Desktop: double click on a URL to open
    requestAnimationFrame(() => openLinkAtCaret(e.currentTarget));
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLTextAreaElement>) => {
    // Mobile: tap on a URL to open (after caret updates)
    requestAnimationFrame(() => openLinkAtCaret(e.currentTarget));
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
      <div className="live-editor-container relative max-w-3xl mx-auto">
        {/* Highlight overlay */}
        <div
          ref={highlightRef}
          className="live-highlight pointer-events-none whitespace-pre-wrap break-words px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16 lg:px-20 lg:py-20"
          aria-hidden="true"
        >
          {value ? processContent(value) : <span className="md-placeholder">{placeholder}</span>}
        </div>

        {/* Textarea - positioned absolutely over the highlight */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onTouchEnd={handleTouchEnd}
          onScroll={syncScroll}
          placeholder=""
          className="live-textarea absolute inset-0 w-full h-full resize-none outline-none border-0 bg-transparent px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16 lg:px-20 lg:py-20 pb-32"
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
