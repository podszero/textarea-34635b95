import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical,
  FileText,
  Download,
  QrCode,
  Eye,
  Edit3,
  Check,
  Moon,
  Sun,
  Link,
  ClipboardCopy,
  Save,
  FolderOpen,
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
  onSave: () => void;
  onOpenDocuments: () => void;
  onDownloadHtml: () => void;
  onDownloadText: () => void;
  onDownloadMarkdown: () => void;
  onShowQR: () => void;
  isPreview: boolean;
  onTogglePreview: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  content: string;
  hasDocuments: boolean;
}

const FloatingMenu = ({
  onNew,
  onShare,
  onSave,
  onOpenDocuments,
  onDownloadHtml,
  onDownloadText,
  onDownloadMarkdown,
  onShowQR,
  isPreview,
  onTogglePreview,
  isDark,
  onToggleTheme,
  content,
  hasDocuments,
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
      className="fixed bottom-4 right-4 xs:bottom-5 xs:right-5 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-40 safe-bottom"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="floating-menu h-12 w-12 xs:h-13 xs:w-13 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation ring-2 ring-primary/20"
          >
            <MoreVertical className="h-5 w-5 xs:h-5.5 xs:w-5.5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={14}
          className="floating-menu w-52 xs:w-56 sm:w-60 md:w-64 rounded-2xl p-2 xs:p-2.5 sm:p-3"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Document Management */}
            <DropdownMenuItem
              onClick={onOpenDocuments}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              <FolderOpen className="h-4 w-4" />
              <span>Dokumen Tersimpan</span>
              {hasDocuments && (
                <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  •
                </span>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onSave}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              <Save className="h-4 w-4" />
              <span>Simpan Dokumen</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onNew}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-lg cursor-pointer touch-manipulation"
            >
              <FileText className="h-4 w-4" />
              <span>Dokumen Baru</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5 sm:my-2" />

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
