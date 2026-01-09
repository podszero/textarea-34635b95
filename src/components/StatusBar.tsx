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
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground font-sans safe-bottom bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full"
    >
      <span>{words} kata</span>
      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
      <span className="hidden sm:inline">{chars} karakter</span>
      <span className="sm:hidden">{chars} chr</span>
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
