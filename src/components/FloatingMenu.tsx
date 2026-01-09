import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical,
  FileText,
  Share2,
  Download,
  QrCode,
  Eye,
  Edit3,
  Copy,
  Check,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FloatingMenuProps {
  onNew: () => void;
  onShare: () => void;
  onDownloadHtml: () => void;
  onDownloadText: () => void;
  onShowQR: () => void;
  isPreview: boolean;
  onTogglePreview: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const FloatingMenu = ({
  onNew,
  onShare,
  onDownloadHtml,
  onDownloadText,
  onShowQR,
  isPreview,
  onTogglePreview,
  isDark,
  onToggleTheme,
}: FloatingMenuProps) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShare();
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="floating-menu h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <MoreVertical className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={12}
          className="floating-menu w-56 rounded-xl p-2"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DropdownMenuItem
              onClick={onNew}
              className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Dokumen Baru</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onTogglePreview}
              className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer"
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

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              onClick={handleShare}
              className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer"
            >
              <AnimatePresence mode="wait">
                {copied ? (
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
                    <Copy className="h-4 w-4" />
                    <span>Salin Link</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onShowQR}
              className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>Kode QR</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              onClick={onDownloadHtml}
              className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Unduh HTML</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onDownloadText}
              className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Unduh TXT</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              onClick={onToggleTheme}
              className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer"
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
