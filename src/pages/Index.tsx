import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import LiveEditor from '@/components/LiveEditor';
import MarkdownPreview from '@/components/MarkdownPreview';
import FloatingMenu from '@/components/FloatingMenu';
import StatusBar from '@/components/StatusBar';
import QRModal from '@/components/QRModal';
import DocumentsSidebar from '@/components/DocumentsSidebar';
import { useDocuments } from '@/hooks/useDocuments';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { compressText } from '@/lib/compression';
import { parseMarkdown } from '@/lib/markdown';

const Index = () => {
  const [isPreview, setIsPreview] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [content, setContent] = useState('');

  const {
    documents,
    currentDocument,
    currentDocId,
    isLoaded,
    setCurrentDocId,
    createDocument,
    updateDocument,
    deleteDocument,
  } = useDocuments();

  const { isDark, toggleTheme } = useTheme();

  // Load content from URL hash on initial load
  useEffect(() => {
    if (!isLoaded) return;

    const hash = window.location.hash.slice(1);
    if (hash) {
      // URL has content - load it but don't save to documents yet
      try {
        const { decompressText } = require('@/lib/compression');
        const decompressed = decompressText(hash);
        setContent(decompressed);
        setCurrentDocId(null); // Not a saved document
      } catch {
        setContent('');
      }
    } else if (currentDocument) {
      setContent(currentDocument.content);
    }
  }, [isLoaded]);

  // Sync content changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    
    // Update URL with compressed content
    if (newContent) {
      const compressed = compressText(newContent);
      window.history.replaceState(null, '', `#${compressed}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Auto-save to current document if one is selected
    if (currentDocId) {
      updateDocument(currentDocId, newContent);
    }
  }, [currentDocId, updateDocument]);

  // Handle save current content as new document
  const handleSaveDocument = useCallback(() => {
    if (!content.trim()) {
      toast.error('Tidak ada konten untuk disimpan');
      return;
    }

    if (currentDocId) {
      updateDocument(currentDocId, content);
      toast.success('Dokumen tersimpan!');
    } else {
      const newDoc = createDocument(content);
      toast.success('Dokumen baru tersimpan!');
    }
  }, [content, currentDocId, createDocument, updateDocument]);

  // Handle new document
  const handleNewDocument = useCallback(() => {
    setContent('');
    setCurrentDocId(null);
    setIsPreview(false);
    window.history.replaceState(null, '', window.location.pathname);
    toast.success('Dokumen baru dibuat');
  }, [setCurrentDocId]);

  // Handle select document
  const handleSelectDocument = useCallback((id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setCurrentDocId(id);
      setContent(doc.content);
      setIsPreview(false);
      
      // Update URL
      if (doc.content) {
        const compressed = compressText(doc.content);
        window.history.replaceState(null, '', `#${compressed}`);
      }
    }
  }, [documents, setCurrentDocId]);

  // Handle delete document
  const handleDeleteDocument = useCallback((id: string) => {
    deleteDocument(id);
    
    if (currentDocId === id) {
      setContent('');
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    toast.success('Dokumen dihapus');
  }, [currentDocId, deleteDocument]);

  const handleShare = () => {
    toast.success('Link tersalin ke clipboard!');
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  // Download handlers
  const handleDownloadHtml = useCallback(() => {
    const html = parseMarkdown(content);
    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dokumen</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 1rem; line-height: 1.8; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    code { background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 4px; }
    blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 1rem; color: #666; }
  </style>
</head>
<body>${html}</body>
</html>`;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dokumen.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML berhasil diunduh!');
  }, [content]);

  const handleDownloadText = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dokumen.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('TXT berhasil diunduh!');
  }, [content]);

  const handleDownloadMarkdown = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dokumen.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Markdown berhasil diunduh!');
  }, [content]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-editor-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground"
        >
          Memuat...
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen min-h-[100dvh] bg-editor-bg"
    >
      {/* Main Content */}
      <main>
        {isPreview ? (
          <MarkdownPreview content={content} />
        ) : (
          <LiveEditor
            value={content}
            onChange={handleContentChange}
            placeholder="# Mulai menulis...

Ketik apa saja dan otomatis tersimpan ke URL."
          />
        )}
      </main>

      {/* Status Bar */}
      <StatusBar 
        content={content} 
        isPreview={isPreview}
        isSaved={!!currentDocId}
      />

      {/* Floating Menu */}
      <FloatingMenu
        onNew={handleNewDocument}
        onShare={handleShare}
        onSave={handleSaveDocument}
        onOpenDocuments={() => setShowSidebar(true)}
        onDownloadHtml={handleDownloadHtml}
        onDownloadText={handleDownloadText}
        onDownloadMarkdown={handleDownloadMarkdown}
        onShowQR={() => setShowQR(true)}
        isPreview={isPreview}
        onTogglePreview={togglePreview}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        content={content}
        hasDocuments={documents.length > 0}
      />

      {/* Documents Sidebar */}
      <DocumentsSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        documents={documents}
        currentDocId={currentDocId}
        onSelectDocument={handleSelectDocument}
        onNewDocument={handleNewDocument}
        onDeleteDocument={handleDeleteDocument}
      />

      {/* QR Modal */}
      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />
    </motion.div>
  );
};

export default Index;
