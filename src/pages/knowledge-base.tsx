import { FC, useState, useEffect } from 'react';
import Layout from '../components/Layout';
import FileUpload from '../components/FileUpload';
import { getReports, getDocuments, deleteReport, deleteDocument } from '../lib/api';
import { Report, Document } from '../types/index';
import { TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const KnowledgeBasePage: FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'documents'>('reports');
  const [isVercelEnvironment, setIsVercelEnvironment] = useState(false);

  useEffect(() => {
    // Check if running on Vercel
    const checkEnvironment = async () => {
      try {
        setIsVercelEnvironment(
          typeof window !== 'undefined' && 
          (window.location.hostname.includes('vercel.app') || 
          process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined)
        );
        
        await loadData();
      } catch (error) {
        console.error("Error initializing knowledge base:", error);
      }
    };
    
    checkEnvironment();
  }, []);

  const loadData = async () => {
    try {
      // Try to load data regardless of environment
      const [reportsData, documentsData] = await Promise.all([
        getReports().catch(err => {
          console.error("Error fetching reports:", err);
          return [];
        }),
        getDocuments().catch(err => {
          console.error("Error fetching documents:", err);
          return [];
        })
      ]);
      
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error) {
      console.error("Error loading data:", error);
      // Set empty arrays as fallback
      setReports([]);
      setDocuments([]);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (confirm('Are you sure you want to delete this report?')) {
      await deleteReport(id);
      loadData();
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await fetch(`/api/documents?id=${id}`, {
          method: 'DELETE'
        });
        loadData();
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
        
        {isVercelEnvironment ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 dark:bg-yellow-900/30 dark:border-yellow-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  <strong>Note:</strong> The Knowledge Base feature is only available when running the application locally.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`py-2 px-4 ${
                  activeTab === 'reports'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('reports')}
              >
                Reports
              </button>
              <button
                className={`py-2 px-4 ${
                  activeTab === 'documents'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('documents')}
              >
                Documents
              </button>
            </div>
            
            {activeTab === 'documents' && (
              <div>
                <FileUpload onUploadComplete={loadData} />
                
                <div className="mt-6 space-y-4">
                  {documents.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet.</p>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-3" />
                          <div>
                            <h3 className="font-medium">{doc.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'reports' && (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No reports generated yet.</p>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold">{report.query}</h2>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="prose dark:prose-invert max-w-none">{report.content}</div>
                      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default KnowledgeBasePage; 