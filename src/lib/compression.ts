import pako from 'pako';

// Compress text and encode to base64 URL-safe string
export function compressText(text: string): string {
  if (!text) return '';
  
  try {
    const encoded = new TextEncoder().encode(text);
    const compressed = pako.deflate(encoded);
    const base64 = btoa(String.fromCharCode(...compressed))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return base64;
  } catch (error) {
    console.error('Compression error:', error);
    return '';
  }
}

// Decompress base64 URL-safe string to text
export function decompressText(compressed: string): string {
  if (!compressed) return '';
  
  try {
    // Restore base64 padding and characters
    let base64 = compressed
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const decompressed = pako.inflate(bytes);
    return new TextDecoder().decode(decompressed);
  } catch (error) {
    console.error('Decompression error:', error);
    return '';
  }
}

// Get hash from URL
export function getHashContent(): string {
  if (typeof window === 'undefined') return '';
  
  const hash = window.location.hash.slice(1);
  if (!hash) return '';
  
  return decompressText(hash);
}

// Set hash in URL
export function setHashContent(text: string): void {
  if (typeof window === 'undefined') return;
  
  if (!text) {
    window.history.replaceState(null, '', window.location.pathname);
    return;
  }
  
  const compressed = compressText(text);
  window.history.replaceState(null, '', `#${compressed}`);
}

// Extract title from markdown content
export function extractTitle(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.slice(2).trim();
    }
  }
  return 'Untitled';
}

// Count words and characters
export function countStats(text: string): { words: number; chars: number } {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, chars };
}
