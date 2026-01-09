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
      className="fixed bottom-6 left-6 z-40 flex items-center gap-4 text-sm text-muted-foreground font-sans"
    >
      <span>{words} kata</span>
      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
      <span>{chars} karakter</span>
      {isPreview && (
        <>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span className="text-primary font-medium">Pratinjau</span>
        </>
      )}
    </motion.div>
  );
};

export default StatusBar;
