import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  ChevronLeft,
  Clock,
  File
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Document } from '@/hooks/useDocuments';
import { cn } from '@/lib/utils';

interface DocumentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  currentDocId: string | null;
  onSelectDocument: (id: string) => void;
  onNewDocument: () => void;
  onDeleteDocument: (id: string) => void;
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 1 minute
  if (diff < 60000) return 'Baru saja';
  
  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} menit lalu`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} jam lalu`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} hari lalu`;
  }
  
  // Otherwise show date
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const DocumentsSidebar = ({
  isOpen,
  onClose,
  documents,
  currentDocId,
  onSelectDocument,
  onNewDocument,
  onDeleteDocument,
}: DocumentsSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    
    const query = searchQuery.toLowerCase();
    return documents.filter(doc =>
      doc.title.toLowerCase().includes(query) ||
      doc.content.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDeleteDocument(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleSelect = (id: string) => {
    onSelectDocument(id);
    onClose();
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[300px] sm:w-[320px] bg-card border-r border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <File className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">Dokumen</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {documents.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Search & New */}
            <div className="p-3 space-y-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari dokumen..."
                  className="pl-9 pr-8 h-10 bg-muted/50 border-border/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <Button
                onClick={() => {
                  onNewDocument();
                  onClose();
                }}
                className="w-full h-10 gap-2"
              >
                <Plus className="h-4 w-4" />
                Dokumen Baru
              </Button>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? 'Tidak ada dokumen ditemukan'
                      : 'Belum ada dokumen tersimpan'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredDocuments.map((doc) => (
                    <motion.button
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleSelect(doc.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all duration-200 group relative",
                        currentDocId === doc.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/80 border border-transparent"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className={cn(
                          "h-4 w-4 mt-0.5 flex-shrink-0",
                          currentDocId === doc.id ? "text-primary" : "text-muted-foreground"
                        )} />
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={cn(
                            "font-medium text-sm truncate pr-8",
                            currentDocId === doc.id ? "text-primary" : "text-foreground"
                          )}>
                            {doc.title}
                          </h3>
                          
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {doc.content.substring(0, 60).replace(/^#+ /, '') || 'Kosong'}
                          </p>
                          
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(doc.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(doc.id, e)}
                        className={cn(
                          "absolute right-2 top-2 p-1.5 rounded-lg transition-all",
                          deleteConfirm === doc.id
                            ? "bg-destructive text-destructive-foreground"
                            : "opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Disimpan di browser lokal
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default DocumentsSidebar;
