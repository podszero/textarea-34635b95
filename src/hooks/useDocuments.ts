import { useState, useEffect, useCallback } from 'react';

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'catatan_documents';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const extractTitle = (content: string): string => {
  // Try to extract title from first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].substring(0, 50);
  }
  
  // Use first non-empty line
  const firstLine = content.split('\n').find(line => line.trim().length > 0);
  if (firstLine) {
    return firstLine.replace(/^#+\s*/, '').substring(0, 50);
  }
  
  return 'Dokumen Tanpa Judul';
};

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load documents from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Document[];
        setDocuments(parsed.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
    setIsLoaded(true);
  }, []);

  // Save documents to localStorage
  const saveToStorage = useCallback((docs: Document[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } catch (err) {
      console.error('Failed to save documents:', err);
    }
  }, []);

  // Create new document
  const createDocument = useCallback((content: string = ''): Document => {
    const now = Date.now();
    const newDoc: Document = {
      id: generateId(),
      title: content ? extractTitle(content) : 'Dokumen Baru',
      content,
      createdAt: now,
      updatedAt: now,
    };
    
    setDocuments(prev => {
      const updated = [newDoc, ...prev];
      saveToStorage(updated);
      return updated;
    });
    
    setCurrentDocId(newDoc.id);
    return newDoc;
  }, [saveToStorage]);

  // Update document
  const updateDocument = useCallback((id: string, content: string) => {
    setDocuments(prev => {
      const updated = prev.map(doc => {
        if (doc.id === id) {
          return {
            ...doc,
            title: extractTitle(content),
            content,
            updatedAt: Date.now(),
          };
        }
        return doc;
      }).sort((a, b) => b.updatedAt - a.updatedAt);
      
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Delete document
  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== id);
      saveToStorage(updated);
      return updated;
    });
    
    if (currentDocId === id) {
      setCurrentDocId(null);
    }
  }, [currentDocId, saveToStorage]);

  // Get current document
  const currentDocument = documents.find(doc => doc.id === currentDocId);

  // Search documents
  const searchDocuments = useCallback((query: string): Document[] => {
    if (!query.trim()) return documents;
    
    const lowerQuery = query.toLowerCase();
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery)
    );
  }, [documents]);

  return {
    documents,
    currentDocument,
    currentDocId,
    isLoaded,
    setCurrentDocId,
    createDocument,
    updateDocument,
    deleteDocument,
    searchDocuments,
  };
};
