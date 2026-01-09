import { useState } from 'react';
import { motion } from 'framer-motion';
import LiveEditor from '@/components/LiveEditor';
import MarkdownPreview from '@/components/MarkdownPreview';
import FloatingMenu from '@/components/FloatingMenu';
import StatusBar from '@/components/StatusBar';
import QRModal from '@/components/QRModal';
import { useDocument } from '@/hooks/useDocument';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

const Index = () => {
  const [isPreview, setIsPreview] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  const {
    content,
    setContent,
    isLoaded,
    handleNew,
    handleDownloadHtml,
    handleDownloadText,
  } = useDocument();

  const { isDark, toggleTheme } = useTheme();

  const handleNewDocument = () => {
    handleNew();
    setIsPreview(false);
    toast.success('Dokumen baru dibuat');
  };

  const handleShare = () => {
    toast.success('Link tersalin ke clipboard!');
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-editor-bg flex items-center justify-center">
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
      className="min-h-screen bg-editor-bg"
    >
      {/* Main Content */}
      <main>
        {isPreview ? (
          <MarkdownPreview content={content} />
        ) : (
          <LiveEditor
            value={content}
            onChange={setContent}
            placeholder="# Mulai menulis...

Ketik apa saja dan otomatis tersimpan ke URL."
          />
        )}
      </main>

      {/* Status Bar */}
      <StatusBar content={content} isPreview={isPreview} />

      {/* Floating Menu */}
      <FloatingMenu
        onNew={handleNewDocument}
        onShare={handleShare}
        onDownloadHtml={handleDownloadHtml}
        onDownloadText={handleDownloadText}
        onShowQR={() => setShowQR(true)}
        isPreview={isPreview}
        onTogglePreview={togglePreview}
        isDark={isDark}
        onToggleTheme={toggleTheme}
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
