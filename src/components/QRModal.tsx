import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

const QRModal = ({ isOpen, onClose, url }: QRModalProps) => {
  const [qrSize, setQrSize] = useState(200);

  // Calculate optimal QR size based on viewport
  useEffect(() => {
    const calculateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      if (vw < 400) {
        setQrSize(Math.min(vw * 0.5, vh * 0.3, 160));
      } else if (vw < 640) {
        setQrSize(Math.min(vw * 0.45, vh * 0.32, 180));
      } else if (vw < 1024) {
        setQrSize(200);
      } else {
        setQrSize(220);
      }
    };

    if (isOpen) {
      calculateSize();
      window.addEventListener('resize', calculateSize);
      return () => window.removeEventListener('resize', calculateSize);
    }
  }, [isOpen]);

  const handleDownload = () => {
    const svg = document.querySelector('.qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const scale = 3;
    
    img.onload = () => {
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx?.scale(scale, scale);
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = 'catatan-qr-code.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Kode QR
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Scan untuk membuka dokumen
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center p-5 sm:p-6">
              <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm">
                <QRCodeSVG
                  value={url}
                  size={qrSize}
                  level="M"
                  includeMargin={false}
                  className="qr-code-svg block"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-border bg-muted/30">
              <Button
                onClick={handleDownload}
                className="w-full h-11 sm:h-12 gap-2 text-sm sm:text-base font-medium touch-manipulation"
                variant="default"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                Unduh QR Code
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QRModal;
