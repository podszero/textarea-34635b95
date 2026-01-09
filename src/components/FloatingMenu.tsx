import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical,
  FileText,
  Download,
  QrCode,
  Eye,
  Edit3,
  Copy,
  Check,
  Moon,
  Sun,
  Link,
  ClipboardCopy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { compressText } from '@/lib/compression';

interface FloatingMenuProps {
  onNew: () => void;
  onShare: () => void;
  onDownloadHtml: () => void;
  onDownloadText: () => void;
  onDownloadMarkdown: () => void;
  onShowQR: () => void;
  isPreview: boolean;
  onTogglePreview: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  content: string;
}

const FloatingMenu = ({
  onNew,
  onShare,
  onDownloadHtml,
  onDownloadText,
  onDownloadMarkdown,
  onShowQR,
  isPreview,
  onTogglePreview,
  isDark,
  onToggleTheme,
  content,
}: FloatingMenuProps) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Generate clean shareable URL with compressed content
  const generateShareableUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    if (!content) return baseUrl;
    const compressed = compressText(content);
    return `${baseUrl}#${compressed}`;
  };

  const handleCopyUrl = async () => {
    try {
      const shareableUrl = generateShareableUrl();
      
      // Try native share first on mobile
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url: shareableUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareableUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
      onShare();
    } catch (error) {
      // Fallback to clipboard
      try {
        const shareableUrl = generateShareableUrl();
        await navigator.clipboard.writeText(shareableUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
        onShare();
      } catch (clipError) {
        console.error('Failed to share:', clipError);
      }
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 safe-bottom"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="floating-menu h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation"
          >
            <MoreVertical className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={12}
          className="floating-menu w-52 sm:w-56 rounded-xl p-1.5 sm:p-2"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DropdownMenuItem
              onClick={onNew}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              <FileText className="h-4 w-4" />
              <span>Dokumen Baru</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onTogglePreview}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              {isPreview ? (
                <>
                  <Edit3 className="h-4 w-4" />
                  <span>Mode Edit</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Pratinjau</span>
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5 sm:my-2" />

            <DropdownMenuItem
              onClick={handleCopyText}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              <AnimatePresence mode="wait">
                {copiedText ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-3"
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
                    className="flex items-center gap-3"
                  >
                    <ClipboardCopy className="h-4 w-4" />
                    <span>Salin Teks</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleCopyUrl}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              <AnimatePresence mode="wait">
                {copiedUrl ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-3"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Tersalin!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="link"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-3"
                  >
                    <Link className="h-4 w-4" />
                    <span>Salin URL</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onShowQR}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              <QrCode className="h-4 w-4" />
              <span>Kode QR</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5 sm:my-2" />

            <DropdownMenuItem
              onClick={onDownloadMarkdown}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              <Download className="h-4 w-4" />
              <span>Unduh MD</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onDownloadHtml}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              <Download className="h-4 w-4" />
              <span>Unduh HTML</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onDownloadText}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              <Download className="h-4 w-4" />
              <span>Unduh TXT</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5 sm:my-2" />

            <DropdownMenuItem
              onClick={onToggleTheme}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Mode Gelap</span>
                </>
              )}
            </DropdownMenuItem>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};

export default FloatingMenu;
