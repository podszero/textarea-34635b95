import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

const QRModal = ({ isOpen, onClose, url }: QRModalProps) => {
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState(180);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate optimal QR size based on viewport
  useEffect(() => {
    const calculateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Mobile portrait
      if (vw < 480) {
        setQrSize(Math.min(vw * 0.55, 200));
      }
      // Mobile landscape or small tablet
      else if (vw < 768) {
        setQrSize(Math.min(vw * 0.4, vh * 0.35, 220));
      }
      // Tablet
      else if (vw < 1024) {
        setQrSize(Math.min(vw * 0.3, 260));
      }
      // Desktop
      else {
        setQrSize(280);
      }
    };

    calculateSize();
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, [isOpen]);

  const handleDownload = () => {
    const svg = document.querySelector('.qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Higher resolution for better quality
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

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Catatan',
          text: 'Lihat dokumen ini',
          url: url,
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/25 backdrop-blur-md z-50"
          />
          
          {/* Modal */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 
                       bg-card rounded-2xl xs:rounded-3xl shadow-2xl 
                       p-5 xs:p-6 sm:p-8 md:p-10 
                       w-[92vw] xs:w-[88vw] sm:w-[420px] md:w-[480px] lg:w-[520px]
                       max-w-[520px] max-h-[90vh] overflow-y-auto
                       border border-border/50"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 xs:top-4 xs:right-4 sm:top-5 sm:right-5 
                         p-1.5 xs:p-2 rounded-full bg-muted/50 hover:bg-muted 
                         text-muted-foreground hover:text-foreground 
                         transition-all duration-200 touch-manipulation"
              aria-label="Tutup"
            >
              <X className="h-4 w-4 xs:h-5 xs:w-5" />
            </button>

            {/* Content */}
            <div className="text-center">
              <h2 className="text-lg xs:text-xl sm:text-2xl font-bold mb-1 xs:mb-2 text-foreground">
                Kode QR
              </h2>
              <p className="text-xs xs:text-sm sm:text-base text-muted-foreground mb-4 xs:mb-5 sm:mb-6 max-w-[280px] mx-auto">
                Scan untuk membuka dokumen ini di perangkat lain
              </p>

              {/* QR Code Container */}
              <div className="relative bg-white p-4 xs:p-5 sm:p-6 md:p-8 rounded-xl xs:rounded-2xl inline-block mb-4 xs:mb-5 sm:mb-6 shadow-inner border border-gray-100">
                <QRCodeSVG
                  value={url}
                  size={qrSize}
                  level="H"
                  includeMargin={false}
                  className="qr-code-svg"
                  style={{ 
                    width: qrSize, 
                    height: qrSize,
                    display: 'block'
                  }}
                />
              </div>

              {/* URL Preview */}
              <div className="mb-4 xs:mb-5 sm:mb-6 px-2">
                <div className="bg-muted/50 rounded-lg xs:rounded-xl p-2.5 xs:p-3 sm:p-4 border border-border/30">
                  <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground truncate font-mono">
                    {url.length > 50 ? url.substring(0, 50) + '...' : url}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-4">
                {/* Copy URL Button */}
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  className="flex-1 gap-2 h-10 xs:h-11 sm:h-12 text-xs xs:text-sm sm:text-base touch-manipulation rounded-xl"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Tersalin!</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Salin URL</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>

                {/* Share Button (mobile) or Download Button */}
                {'share' in navigator ? (
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="flex-1 gap-2 h-10 xs:h-11 sm:h-12 text-xs xs:text-sm sm:text-base touch-manipulation rounded-xl"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Bagikan</span>
                  </Button>
                ) : null}

                {/* Download QR Button */}
                <Button
                  onClick={handleDownload}
                  className="flex-1 gap-2 h-10 xs:h-11 sm:h-12 text-xs xs:text-sm sm:text-base touch-manipulation rounded-xl"
                  variant="default"
                >
                  <Download className="h-4 w-4" />
                  <span>Unduh QR</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QRModal;
