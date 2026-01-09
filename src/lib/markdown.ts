import hljs from 'highlight.js';

// Simple markdown parser for preview with HTML support
export function parseMarkdown(text: string): string {
  if (!text) return '';

  let html = text;

  // Store HTML blocks to preserve them
  const htmlBlocks: string[] = [];
  const htmlBlockPlaceholder = '___HTML_BLOCK_PLACEHOLDER___';
  
  // Preserve HTML blocks (block-level HTML tags)
  html = html.replace(/(<(?:p|div|table|thead|tbody|tr|td|th|img|a|center|br|hr)[^>]*>[\s\S]*?<\/(?:p|div|table|thead|tbody|tr|td|th|a|center)>|<(?:img|br|hr)[^>]*\/?>)/gi, (match) => {
    htmlBlocks.push(match);
    return `${htmlBlockPlaceholder}${htmlBlocks.length - 1}${htmlBlockPlaceholder}`;
  });

  // Store inline HTML tags
  const inlineHtml: string[] = [];
  const inlineHtmlPlaceholder = '___INLINE_HTML___';
  html = html.replace(/<[^>]+>/g, (match) => {
    inlineHtml.push(match);
    return `${inlineHtmlPlaceholder}${inlineHtml.length - 1}${inlineHtmlPlaceholder}`;
  });

  // Escape remaining HTML entities
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Restore inline HTML
  html = html.replace(new RegExp(`${inlineHtmlPlaceholder}(\\d+)${inlineHtmlPlaceholder}`, 'g'), (_, index) => {
    return inlineHtml[parseInt(index)];
  });

  // Restore HTML blocks
  html = html.replace(new RegExp(`${htmlBlockPlaceholder}(\\d+)${htmlBlockPlaceholder}`, 'g'), (_, index) => {
    return htmlBlocks[parseInt(index)];
  });

  // Code blocks with syntax highlighting (must be before other replacements)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const trimmedCode = code.trim();
    try {
      const highlighted = lang && hljs.getLanguage(lang)
        ? hljs.highlight(trimmedCode, { language: lang }).value
        : hljs.highlightAuto(trimmedCode).value;
      return `<pre><code class="hljs language-${lang || 'plaintext'}">${highlighted}</code></pre>`;
    } catch {
      return `<pre><code class="hljs">${trimmedCode}</code></pre>`;
    }
  });

  // Images ![alt](url) or ![alt](url "title")
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, url, title) => {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<figure class="md-image"><img src="${url}" alt="${alt}"${titleAttr} loading="lazy" />${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`;
  });

  // Inline code with special styling
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headers (H1-H6)
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Tables - Parse markdown tables
  html = parseMarkdownTables(html);

  // Bold and italic combined
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Markdown links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Auto-link URLs (not already in href or src)
  html = html.replace(
    /(?<!href=["']|src=["'])(https?:\/\/[^\s<>"')\]]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Paragraphs (lines that aren't already wrapped)
  const lines = html.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<')) return line;
    return `<p>${line}</p>`;
  });

  html = processedLines.join('\n');

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');

  // Fix consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

  return html;
}

// Parse markdown tables
function parseMarkdownTables(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  let alignments: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line is a table row (starts and ends with |, or has | in between)
    const isTableRow = line.includes('|') && line.match(/\|.*\|/);
    
    // Check if line is separator row (like |---|---|)
    const isSeparator = line.match(/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/);

    if (isTableRow && !isSeparator) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
        alignments = [];
      }
      tableRows.push(line);
    } else if (isSeparator && inTable && tableRows.length === 1) {
      // Parse alignments from separator
      alignments = line.split('|')
        .filter(cell => cell.trim())
        .map(cell => {
          const trimmed = cell.trim();
          if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
          if (trimmed.endsWith(':')) return 'right';
          return 'left';
        });
    } else {
      if (inTable && tableRows.length > 0) {
        // Finish table and add to result
        result.push(buildTable(tableRows, alignments));
        inTable = false;
        tableRows = [];
        alignments = [];
      }
      result.push(lines[i]);
    }
  }

  // Handle table at end of content
  if (inTable && tableRows.length > 0) {
    result.push(buildTable(tableRows, alignments));
  }

  return result.join('\n');
}

function buildTable(rows: string[], alignments: string[]): string {
  if (rows.length === 0) return '';

  let tableHtml = '<div class="table-wrapper"><table>';
  
  rows.forEach((row, rowIndex) => {
    const cells = row.split('|')
      .map(cell => cell.trim())
      .filter((_, i, arr) => {
        // Remove empty first/last elements from |cell|cell| format
        if (i === 0 && arr[0] === '') return false;
        if (i === arr.length - 1 && arr[arr.length - 1] === '') return false;
        return true;
      });

    if (rowIndex === 0) {
      // Header row
      tableHtml += '<thead><tr>';
      cells.forEach((cell, cellIndex) => {
        const align = alignments[cellIndex] || 'left';
        tableHtml += `<th style="text-align: ${align}">${cell}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';
    } else {
      // Body rows
      tableHtml += '<tr>';
      cells.forEach((cell, cellIndex) => {
        const align = alignments[cellIndex] || 'left';
        tableHtml += `<td style="text-align: ${align}">${cell}</td>`;
      });
      tableHtml += '</tr>';
    }
  });

  tableHtml += '</tbody></table></div>';
  return tableHtml;
}
