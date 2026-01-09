import { motion } from 'framer-motion';
import { parseMarkdown } from '@/lib/markdown';

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  const html = parseMarkdown(content);

  if (!content) {
    return (
      <div className="p-8 md:p-12 lg:p-16 text-muted-foreground italic font-serif text-lg">
        Tidak ada konten untuk ditampilkan...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="markdown-preview p-8 md:p-12 lg:p-16 text-lg"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPreview;
