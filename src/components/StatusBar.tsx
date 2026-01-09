import { motion } from 'framer-motion';
import { countStats } from '@/lib/compression';

interface StatusBarProps {
  content: string;
  isPreview: boolean;
}

const StatusBar = ({ content, isPreview }: StatusBarProps) => {
  const { words, chars } = countStats(content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="fixed bottom-4 left-4 xs:bottom-5 xs:left-5 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 z-50 flex items-center gap-2.5 xs:gap-3 sm:gap-4 text-[11px] xs:text-xs sm:text-sm text-muted-foreground font-sans safe-bottom bg-background/90 backdrop-blur-md px-3 py-2 xs:px-3.5 xs:py-2 sm:px-4 sm:py-2.5 rounded-full border border-border/40 shadow-sm"
    >
      <span className="tabular-nums font-medium">{words} kata</span>
      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
      <span className="hidden xs:inline tabular-nums font-medium">{chars} karakter</span>
      <span className="xs:hidden tabular-nums font-medium">{chars}</span>
      {isPreview && (
        <>
          <span className="w-1 h-1 rounded-full bg-primary/60" />
          <span className="text-primary font-semibold">Preview</span>
        </>
      )}
    </motion.div>
  );
};

export default StatusBar;
