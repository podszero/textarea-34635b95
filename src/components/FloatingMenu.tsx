import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical,
  FileText,
  QrCode,
  Eye,
  Edit3,
  Check,
  Moon,
  Sun,
  Link,
  ClipboardCopy,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
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
  const [isOpen, setIsOpen] = useState(false);

  const generateShareableUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    if (!content) return baseUrl;
    const compressed = compressText(content);
    return `${baseUrl}#${compressed}`;
  };

  const handleCopyUrl = async () => {
    try {
      const shareableUrl = generateShareableUrl();
      if (navigator.share) {
        await navigator.share({ title: document.title, url: shareableUrl });
      } else {
        await navigator.clipboard.writeText(shareableUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
      onShare();
    } catch {
      try {
        await navigator.clipboard.writeText(generateShareableUrl());
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
        onShare();
      } catch (err) {
        console.error('Failed to share:', err);
      }
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 md:bottom-8 md:right-8 z-50 safe-bottom"
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="group relative h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full shadow-2xl hover:shadow-primary/25 active:scale-90 transition-all duration-300 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary touch-manipulation overflow-hidden"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary-foreground/20"
              animate={isOpen ? { scale: 1.15, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MoreVertical className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 relative z-10" />
            </motion.div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={16}
          className="w-56 sm:w-64 rounded-2xl p-2 sm:p-3 border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl z-50"
        >
          <div className="space-y-1">
            {/* Document Actions */}
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 pb-1">
              Dokumen
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={onNew}
                className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-xl cursor-pointer touch-manipulation hover:bg-primary/10 focus:bg-primary/10 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Dokumen Baru</span>
                  <span className="text-xs text-muted-foreground">Mulai dari awal</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onTogglePreview}
                className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-xl cursor-pointer touch-manipulation hover:bg-primary/10 focus:bg-primary/10 transition-colors"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isPreview ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                  {isPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{isPreview ? 'Mode Edit' : 'Pratinjau'}</span>
                  <span className="text-xs text-muted-foreground">
                    {isPreview ? 'Kembali mengedit' : 'Lihat hasil akhir'}
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-2 bg-border/50" />

            {/* Share Actions */}
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 pb-1">
              Bagikan
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleCopyText}
                className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-xl cursor-pointer touch-manipulation hover:bg-primary/10 focus:bg-primary/10 transition-colors"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${copiedText ? 'bg-green-500/10 text-green-500' : 'bg-violet-500/10 text-violet-500'}`}>
                  <AnimatePresence mode="wait">
                    {copiedText ? (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <ClipboardCopy className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="font-medium text-sm">{copiedText ? 'Tersalin!' : 'Salin Teks'}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleCopyUrl}
                className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-xl cursor-pointer touch-manipulation hover:bg-primary/10 focus:bg-primary/10 transition-colors"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${copiedUrl ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  <AnimatePresence mode="wait">
                    {copiedUrl ? (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <motion.div key="link" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Link className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="font-medium text-sm">{copiedUrl ? 'Tersalin!' : 'Salin URL'}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onShowQR}
                className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-xl cursor-pointer touch-manipulation hover:bg-primary/10 focus:bg-primary/10 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500">
                  <QrCode className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Kode QR</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-2 bg-border/50" />

            {/* Download Actions */}
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 pb-1">
              Unduh
            </DropdownMenuLabel>
            <DropdownMenuGroup className="flex gap-1.5">
              <DropdownMenuItem
                onClick={onDownloadMarkdown}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl cursor-pointer touch-manipulation hover:bg-primary/10 focus:bg-primary/10 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500">
                  <FileDown className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">.md</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onDownloadHtml}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl cursor-pointer touch-manipulation hover:bg-primary/10 focus:bg-primary/10 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <FileDown className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">.html</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onDownloadText}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl cursor-pointer touch-manipulation hover:bg-primary/10 focus:bg-primary/10 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500">
                  <FileDown className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">.txt</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-2 bg-border/50" />

            {/* Theme Toggle */}
            <DropdownMenuItem
              onClick={onToggleTheme}
              className="flex items-center gap-3 py-2.5 sm:py-3 px-3 rounded-xl cursor-pointer touch-manipulation hover:bg-primary/10 focus:bg-primary/10 transition-colors"
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isDark ? 'bg-yellow-500/10 text-yellow-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                <AnimatePresence mode="wait">
                  {isDark ? (
                    <motion.div key="sun" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}>
                      <Sun className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div key="moon" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}>
                      <Moon className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
                <span className="text-xs text-muted-foreground">
                  {isDark ? 'Beralih ke tema terang' : 'Beralih ke tema gelap'}
                </span>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};

export default FloatingMenu;
