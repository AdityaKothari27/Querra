import { FC, useState, useEffect } from 'react';
import { Document } from '../types/index';
import { getDocuments } from '../lib/api';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface DocumentSelectorProps {
  selectedDocumentIds: number[];
  onDocumentSelect: (documentIds: number[]) => void;
}

const DocumentSelector: FC<DocumentSelectorProps> = ({ 
  selectedDocumentIds, 
  onDocumentSelect 
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentToggle = (id: number) => {
    const newSelectedIds = selectedDocumentIds.includes(id)
      ? selectedDocumentIds.filter(docId => docId !== id)
      : [...selectedDocumentIds, id];
    
    onDocumentSelect(newSelectedIds);
  };

  const handleSelectAll = () => {
    if (selectedDocumentIds.length === documents.length) {
      onDocumentSelect([]);
    } else {
      onDocumentSelect(documents.map(doc => doc.id));
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        No documents available. Upload documents in the Knowledge Base.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Knowledge Base Documents</h3>
        <button
          onClick={handleSelectAll}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {selectedDocumentIds.length === documents.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {documents.map((doc) => (
          <div 
            key={doc.id}
            className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <input
              type="checkbox"
              id={`doc-${doc.id}`}
              checked={selectedDocumentIds.includes(doc.id)}
              onChange={() => handleDocumentToggle(doc.id)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label 
              htmlFor={`doc-${doc.id}`}
              className="ml-3 flex items-center cursor-pointer"
            >
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{doc.name}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentSelector; 