import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

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
        <span key={keyIndex++} className="md-link">
          {urlMatch[1]}
        </span>
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

interface LinkTooltip {
  url: string;
  x: number;
  y: number;
}

const LiveEditor = ({ value, onChange, placeholder = "Mulai menulis..." }: LiveEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [linkTooltip, setLinkTooltip] = useState<LinkTooltip | null>(null);

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

  // Hide tooltip when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = () => setLinkTooltip(null);
    window.addEventListener('scroll', handleClickOutside, true);
    return () => window.removeEventListener('scroll', handleClickOutside, true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setLinkTooltip(null);
  };

  const checkForLinkAtCursor = useCallback((textarea: HTMLTextAreaElement) => {
    const pos = textarea.selectionStart;
    const url = findUrlAtPosition(value, pos);

    if (url) {
      // Get cursor position for tooltip
      const rect = textarea.getBoundingClientRect();
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 28;

      // Calculate approximate position
      const textBeforeCursor = value.substring(0, pos);
      const lines = textBeforeCursor.split('\n');
      const currentLineIndex = lines.length - 1;

      const paddingTop = parseFloat(getComputedStyle(textarea).paddingTop) || 32;
      const y = rect.top + paddingTop + (currentLineIndex * lineHeight) - textarea.scrollTop;
      const x = rect.left + 100;

      setLinkTooltip({ url, x, y });
    } else {
      setLinkTooltip(null);
    }
  }, [value]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    // Delay to let cursor position update
    setTimeout(() => {
      checkForLinkAtCursor(e.currentTarget);
    }, 10);
  }, [checkForLinkAtCursor]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for link when moving with arrow keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      checkForLinkAtCursor(e.currentTarget);
    }
  }, [checkForLinkAtCursor]);

  const handleOpenLink = useCallback(() => {
    if (linkTooltip?.url) {
      window.open(linkTooltip.url, '_blank', 'noopener,noreferrer');
      setLinkTooltip(null);
    }
  }, [linkTooltip]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Open link with Ctrl/Cmd + Enter when on a link
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && linkTooltip?.url) {
      e.preventDefault();
      handleOpenLink();
      return;
    }

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

    // Hide tooltip on Escape
    if (e.key === 'Escape') {
      setLinkTooltip(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full min-h-screen safe-top bg-editor-bg"
    >
      <div ref={containerRef} className="live-editor-container relative max-w-3xl mx-auto">
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
          onKeyUp={handleKeyUp}
          onClick={handleClick}
          onScroll={syncScroll}
          placeholder=""
          className="live-textarea absolute inset-0 w-full h-full resize-none outline-none border-0 bg-transparent px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16 lg:px-20 lg:py-20 pb-32"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="sentences"
          autoCorrect="on"
        />

        {/* Link tooltip */}
        <AnimatePresence>
          {linkTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg bg-card border border-border"
              style={{ top: linkTooltip.y + 30, left: linkTooltip.x }}
            >
              <button
                onClick={handleOpenLink}
                className="flex items-center gap-2 text-sm text-primary hover:underline focus:outline-none"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="max-w-[200px] truncate">{linkTooltip.url}</span>
              </button>
              <span className="text-xs text-muted-foreground">(Ctrl+Enter)</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default LiveEditor;
