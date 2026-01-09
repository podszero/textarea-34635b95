import { useState, useEffect, useCallback, useRef } from 'react';
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
import { compressText, decompressText } from '@/lib/compression';
import { parseMarkdown } from '@/lib/markdown';

const AUTO_SAVE_DELAY = 1500; // 1.5 seconds

const Index = () => {
  const [isPreview, setIsPreview] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

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
      try {
        const decompressed = decompressText(hash);
        setContent(decompressed);
        setCurrentDocId(null);
      } catch {
        setContent('');
      }
    } else if (currentDocument) {
      setContent(currentDocument.content);
    }
  }, [isLoaded]);

  // Auto-save function
  const performAutoSave = useCallback(() => {
    if (!content.trim() || !hasUnsavedChanges.current) return;

    setIsSaving(true);
    
    if (currentDocId) {
      // Update existing document
      updateDocument(currentDocId, content);
    } else {
      // Create new document
      createDocument(content);
    }
    
    hasUnsavedChanges.current = false;
    setLastSaved(Date.now());
    
    setTimeout(() => setIsSaving(false), 500);
  }, [content, currentDocId, updateDocument, createDocument]);

  // Schedule auto-save
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    hasUnsavedChanges.current = true;
    
    autoSaveTimer.current = setTimeout(() => {
      performAutoSave();
    }, AUTO_SAVE_DELAY);
  }, [performAutoSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges.current && content.trim()) {
        performAutoSave();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [content, performAutoSave]);

  // Handle content changes with auto-save
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    
    // Update URL with compressed content
    if (newContent) {
      const compressed = compressText(newContent);
      window.history.replaceState(null, '', `#${compressed}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Schedule auto-save
    if (newContent.trim()) {
      scheduleAutoSave();
    }
  }, [scheduleAutoSave]);

  // Manual save
  const handleSaveDocument = useCallback(() => {
    if (!content.trim()) {
      toast.error('Tidak ada konten untuk disimpan');
      return;
    }

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    setIsSaving(true);

    if (currentDocId) {
      updateDocument(currentDocId, content);
      toast.success('Dokumen tersimpan!');
    } else {
      createDocument(content);
      toast.success('Dokumen baru tersimpan!');
    }

    hasUnsavedChanges.current = false;
    setLastSaved(Date.now());
    setTimeout(() => setIsSaving(false), 500);
  }, [content, currentDocId, createDocument, updateDocument]);

  // Handle new document
  const handleNewDocument = useCallback(() => {
    // Save current content first if there's unsaved changes
    if (hasUnsavedChanges.current && content.trim()) {
      performAutoSave();
    }

    setContent('');
    setCurrentDocId(null);
    setIsPreview(false);
    setLastSaved(null);
    hasUnsavedChanges.current = false;
    window.history.replaceState(null, '', window.location.pathname);
    toast.success('Dokumen baru dibuat');
  }, [content, setCurrentDocId, performAutoSave]);

  // Handle select document
  const handleSelectDocument = useCallback((id: string) => {
    // Save current content first
    if (hasUnsavedChanges.current && content.trim() && currentDocId) {
      updateDocument(currentDocId, content);
    }

    const doc = documents.find(d => d.id === id);
    if (doc) {
      setCurrentDocId(id);
      setContent(doc.content);
      setIsPreview(false);
      setLastSaved(doc.updatedAt);
      hasUnsavedChanges.current = false;
      
      if (doc.content) {
        const compressed = compressText(doc.content);
        window.history.replaceState(null, '', `#${compressed}`);
      }
    }
  }, [documents, setCurrentDocId, content, currentDocId, updateDocument]);

  // Handle delete document
  const handleDeleteDocument = useCallback((id: string) => {
    deleteDocument(id);
    
    if (currentDocId === id) {
      setContent('');
      setLastSaved(null);
      hasUnsavedChanges.current = false;
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

  // Export all documents as JSON backup
  const handleExportBackup = useCallback(() => {
    if (documents.length === 0) {
      toast.error('Tidak ada dokumen untuk diekspor');
      return;
    }

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      documents: documents,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catatan-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${documents.length} dokumen berhasil diekspor!`);
  }, [documents]);

  // Import documents from JSON backup
  const handleImportBackup = useCallback((file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const backup = JSON.parse(text);

        if (!backup.documents || !Array.isArray(backup.documents)) {
          toast.error('Format file backup tidak valid');
          return;
        }

        let importedCount = 0;
        backup.documents.forEach((doc: { content?: string }) => {
          if (doc.content) {
            createDocument(doc.content);
            importedCount++;
          }
        });

        toast.success(`${importedCount} dokumen berhasil diimpor!`);
      } catch {
        toast.error('Gagal membaca file backup');
      }
    };

    reader.onerror = () => {
      toast.error('Gagal membaca file');
    };

    reader.readAsText(file);
  }, [createDocument]);

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

Ketik apa saja — otomatis tersimpan."
          />
        )}
      </main>

      {/* Status Bar */}
      <StatusBar 
        content={content} 
        isPreview={isPreview}
        isSaved={!!currentDocId || !!lastSaved}
        isSaving={isSaving}
        lastSaved={lastSaved}
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
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
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
