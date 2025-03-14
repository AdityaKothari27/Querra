import { FC, useState } from 'react';
import { generateReport } from '../lib/api';
import { SparklesIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { Packer } from 'docx';

interface ReportSectionProps {
  searchQuery: string;
  selectedSources: string[];
  selectedDocumentIds: number[];
  categoryConfig: any;
}

const ReportSection: FC<ReportSectionProps> = ({ 
  searchQuery, 
  selectedSources,
  selectedDocumentIds,
  categoryConfig
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [promptTemplate, setPromptTemplate] = useState('');
  const [exportFormat, setExportFormat] = useState('PDF');
  const [isExporting, setIsExporting] = useState(false);

  const getButtonColorClass = () => {
    if (categoryConfig && categoryConfig.color) {
      return `bg-${categoryConfig.color}-600 hover:bg-${categoryConfig.color}-700 dark:bg-${categoryConfig.color}-700 dark:hover:bg-${categoryConfig.color}-800`;
    }
    return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800';
  };

  const handleGenerateReport = async () => {
    if (selectedSources.length === 0 && selectedDocumentIds.length === 0) {
      alert('Please select at least one source or document');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateReport(
        searchQuery, 
        selectedSources, 
        selectedDocumentIds,
        promptTemplate || getDefaultPrompt()
      );
      setReport(response.report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDefaultPrompt = () => {
    if (categoryConfig && categoryConfig.promptTemplate) {
      return categoryConfig.promptTemplate;
    }
    return 'Generate a comprehensive report based on the provided sources.';
  };

  const handleExport = async () => {
    if (!report) return;
    
    setIsExporting(true);
    try {
      const filename = `${searchQuery.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report`;
      
      if (exportFormat === 'PDF') {
        const doc = new jsPDF();
        doc.text(report,10,10);
        doc.save(`${filename}.pdf`);
      } else if (exportFormat === 'DOCX') {
        // Convert markdown to docx
        const docx = await import('docx');
        const doc = new docx.Document({
          sections: [{
            properties: {},
            children: [
              new docx.Paragraph({
                text: report,
                style: 'Normal',
              }),
            ],
          }],
        });
        
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${filename}.docx`);
      } else if (exportFormat === 'TXT') {
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `${filename}.txt`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-black rounded-xl shadow-xl border border-gray-800 dark:border-white p-6 transition-all duration-300">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Generate Report</h2>
      
      <div className="mb-4">
        <label htmlFor="prompt-template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Prompt Template
        </label>
        <textarea
          id="prompt-template"
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-white"
          rows={4}
          placeholder={getDefaultPrompt()}
        />
        {!promptTemplate && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Default: {getDefaultPrompt()}
          </p>
        )}
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selected sources: {selectedSources.length + selectedDocumentIds.length}
          {selectedDocumentIds.length > 0 && ` (including ${selectedDocumentIds.length} document${selectedDocumentIds.length > 1 ? 's' : ''} from Knowledge Base)`}
        </p>
      </div>
      
      <button
        onClick={handleGenerateReport}
        disabled={isGenerating || (selectedSources.length === 0 && selectedDocumentIds.length === 0)}
        className={`w-full py-3 relative overflow-hidden rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center ${getButtonColorClass()}`}
      >
        {isGenerating ? (
          <div className="relative overflow-hidden">
            <span className="text-white font-medium">Generating Report...</span>
            <div className="absolute top-0 left-0 right-0 bottom-0 -inset-x-full z-10 block transform-gpu bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-fast"></div>
          </div>
        ) : (
          <>
            <SparklesIcon className="h-5 w-5 mr-2 text-white" />
            <span className="text-white">Generate Report</span>
          </>
        )}
      </button>
      
      {report && (
        <div className="mt-6">
          <div className="flex items-center space-x-2 mt-4 mb-4">
            <label htmlFor="exportFormat" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Export as:
            </label>
            <select
              id="exportFormat"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 py-1 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="TXT">TXT</option>
            </select>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 prose dark:prose-invert max-w-none">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSection; 
