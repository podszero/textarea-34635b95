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
      className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 md:bottom-6 md:left-6 z-50 flex items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground font-sans safe-bottom bg-background/80 backdrop-blur-sm px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border border-border/50"
    >
      <span className="tabular-nums">{words} kata</span>
      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
      <span className="hidden xs:inline tabular-nums">{chars} karakter</span>
      <span className="xs:hidden tabular-nums">{chars}</span>
      {isPreview && (
        <>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span className="text-primary font-medium">Preview</span>
        </>
      )}
    </motion.div>
  );
};

export default StatusBar;
