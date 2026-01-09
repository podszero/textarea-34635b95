import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

const QRModal = ({ isOpen, onClose, url }: QRModalProps) => {
  const [qrSize, setQrSize] = useState(200);
  const [copied, setCopied] = useState(false);

  // Calculate optimal QR size based on viewport
  useEffect(() => {
    const calculateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      if (vw < 400) {
        setQrSize(Math.min(vw * 0.55, vh * 0.28, 180));
      } else if (vw < 640) {
        setQrSize(Math.min(vw * 0.5, vh * 0.3, 200));
      } else if (vw < 1024) {
        setQrSize(220);
      } else {
        setQrSize(240);
      }
    };

    if (isOpen) {
      calculateSize();
      window.addEventListener('resize', calculateSize);
      return () => window.removeEventListener('resize', calculateSize);
    }
  }, [isOpen]);

  const handleDownload = useCallback(() => {
    const svg = document.querySelector('.qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const scale = 4; // High resolution
    
    img.onload = () => {
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // White background
      ctx!.fillStyle = '#ffffff';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx?.scale(scale, scale);
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = 'catatan-qr-code.png';
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast.success('QR Code berhasil diunduh!');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('URL tersalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Gagal menyalin URL');
    }
  }, [url]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Catatan',
          text: 'Lihat dokumen ini',
          url: url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopyUrl();
    }
  }, [url, handleCopyUrl]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  // Shorten URL for display
  const displayUrl = url.length > 40 
    ? url.substring(0, 20) + '...' + url.substring(url.length - 15)
    : url;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative bg-card rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[340px] sm:max-w-sm overflow-hidden border border-border"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 touch-manipulation"
              aria-label="Tutup"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Header */}
            <div className="pt-5 pb-3 px-5 sm:pt-6 sm:pb-4 sm:px-6 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Kode QR
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Scan untuk membuka dokumen
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex justify-center px-5 pb-4 sm:px-6 sm:pb-5">
              <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200">
                <QRCodeSVG
                  value={url}
                  size={qrSize}
                  level="L"
                  includeMargin={true}
                  marginSize={2}
                  className="qr-code-svg block"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>

            {/* URL Display */}
            <div className="px-5 pb-4 sm:px-6 sm:pb-5">
              <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center font-mono break-all leading-relaxed">
                  {displayUrl}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-2.5 sm:space-y-3">
              {/* Primary: Download */}
              <Button
                onClick={handleDownload}
                className="w-full h-11 sm:h-12 gap-2.5 text-sm sm:text-base font-semibold touch-manipulation rounded-xl"
                variant="default"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                Unduh QR Code
              </Button>

              {/* Secondary actions */}
              <div className="flex gap-2.5 sm:gap-3">
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  className="flex-1 h-10 sm:h-11 gap-2 text-xs sm:text-sm font-medium touch-manipulation rounded-xl"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Salin URL</span>
                    </>
                  )}
                </Button>

                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="flex-1 h-10 sm:h-11 gap-2 text-xs sm:text-sm font-medium touch-manipulation rounded-xl"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Bagikan</span>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QRModal;
