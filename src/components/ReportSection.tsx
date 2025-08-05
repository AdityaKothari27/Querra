import { FC, useState, useEffect } from 'react';
import { generateReport } from '../lib/api';
import { SparklesIcon, BoltIcon, CogIcon } from '@heroicons/react/24/outline';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
import { useToast } from './Toast';
import { useSession } from '../contexts/SessionContext';

interface ReportSectionProps {
  searchQuery: string;
  selectedSources: string[];
  selectedDocumentIds: number[];
  categoryConfig: any;
  initialReport?: string | null;
}

const ReportSection: FC<ReportSectionProps> = ({ 
  searchQuery, 
  selectedSources,
  selectedDocumentIds,
  categoryConfig,
  initialReport = null
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(initialReport);
  const [promptTemplate, setPromptTemplate] = useState('');
  const [exportFormat, setExportFormat] = useState('PDF');
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();
  const { setGeneratedReport, generatedReport, generationMode, setGenerationMode } = useSession();

  useEffect(() => {
    const loadExportLibraries = async () => {
      try {
        if (typeof window !== 'undefined') {
          const jsPDF = (await import('jspdf')).default;
          const { Packer } = await import('docx');
          
          console.log('Export libraries loaded successfully');
        }
      } catch (error) {
        console.error('Failed to load export libraries:', error);
      }
    };
    
    loadExportLibraries();
  }, []);

  useEffect(() => {
    if (report) {
      setGeneratedReport(report);
      console.log('Report updated, syncing to session:', report.substring(0, 50) + '...');
    }
  }, [report, setGeneratedReport]);

  // Initialize from session if available
  useEffect(() => {
    if (generatedReport && (!report || initialReport === null)) {
      console.log('Initializing from session:', generatedReport.substring(0, 50) + '...');
      setReport(generatedReport);
    }
  }, [generatedReport, report, initialReport]);

  // Reset when session is cleared
  useEffect(() => {
    if (generatedReport === null && report !== null) {
      setReport(null);
    }
  }, [generatedReport, report]);

  const getButtonColorClass = () => {
    if (categoryConfig && categoryConfig.color) {
      return `bg-${categoryConfig.color}-600 hover:bg-${categoryConfig.color}-700 dark:bg-${categoryConfig.color}-700 dark:hover:bg-${categoryConfig.color}-800`;
    }
    return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800';
  };

  const handleGenerateReport = async () => {
    if (selectedSources.length === 0 && selectedDocumentIds.length === 0) {
      showToast({
        type: 'warning',
        message: 'Please select at least one source or document',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateReport(
        searchQuery, 
        selectedSources, 
        selectedDocumentIds,
        promptTemplate || getDefaultPrompt(),
        generationMode
      );
      
      // Update local state first
      setReport(response.report);
      
      // Then update session state
      setGeneratedReport(response.report);
      
      showToast({
        type: 'success',
        message: 'Report generated successfully!',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      showToast({
        type: 'error',
        message: 'Failed to generate report. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getDefaultPrompt = () => {
    if (categoryConfig && categoryConfig.promptTemplate) {
      return categoryConfig.promptTemplate;
    }
    return 'Generate a comprehensive report based on the provided sources. Include an introduction, key findings, analysis, and conclusion. Use citation notation like [1], [2], etc. when referencing specific sources.';
  };

  const handleExport = async () => {
    if (!report) {
      showToast({ type: 'error', message: 'No report available to export.' });
      return;
    }

    setIsExporting(true);
    try {
      switch (exportFormat.toLowerCase()) {
        case 'pdf':
          try {
            // Dynamic import jsPDF
            const { default: JsPDF } = await import('jspdf');
            const doc = new JsPDF();
            
            // Set font
            doc.setFont("helvetica");
            
            // Add title
            doc.setFontSize(18);
            doc.text(`Research Report`, 105, 20, { align: 'center' });
            
            doc.setFontSize(14);
            doc.text(`Topic: ${searchQuery}`, 105, 30, { align: 'center' });
            
            // Add date
            doc.setFontSize(12);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });
            
            // Add content with proper formatting
            doc.setFontSize(12);
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const maxWidth = pageWidth - (margin * 2);
            
            // Split content into paragraphs
            const paragraphs = report ? report.split('\n\n') : [];
            let yPosition = 60;
            
            paragraphs.forEach((paragraph) => {
              if (yPosition > 250) { // Check if near page bottom
                doc.addPage();
                yPosition = 20;
              }
              
              const lines = doc.splitTextToSize(paragraph, maxWidth);
              doc.text(lines, margin, yPosition);
              yPosition += (lines.length * 7) + 5; // Add spacing between paragraphs
            });
            
            // Add sources on new page
            doc.addPage();
            doc.setFontSize(14);
            doc.text('Sources:', margin, 20);
            
            let sourceY = 30;
            selectedSources.forEach((source, index) => {
              const sourceText = `${index + 1}. ${source}`;
              const sourceLines = doc.splitTextToSize(sourceText, maxWidth);
              doc.setFontSize(10);
              doc.text(sourceLines, margin, sourceY);
              sourceY += (sourceLines.length * 5) + 5;
            });
            
            doc.save(`${searchQuery}_report.pdf`);
            showToast({
              type: 'success',
              message: 'PDF exported successfully',
            });
          } catch (err) {
            console.error("PDF error:", err);
            showToast({
              type: 'error',
              message: 'Error creating PDF. Try another format.',
            });
          }
          break;
          
        case 'docx':
          try {
            // Dynamic import
            const docx = await import('docx');
            
            // Create document
            const doc = new docx.Document({
              sections: [{
                properties: {},
                children: [
                  // Title
                  new docx.Paragraph({
                    text: "Research Report",
                    heading: docx.HeadingLevel.HEADING_1,
                    spacing: { after: 200 }
                  }),
                  
                  // Topic
                  new docx.Paragraph({
                    children: [
                      new docx.TextRun({
                        text: `Topic: ${searchQuery}`,
                        bold: true,
                        size: 28
                      })
                    ],
                    spacing: { after: 200 }
                  }),
                  
                  // Date
                  new docx.Paragraph({
                    text: `Generated: ${new Date().toLocaleDateString()}`,
                    spacing: { after: 400 }
                  }),
                  
                  // Content - simple implementation
                  ...(report ? report.split('\n\n').map(para => 
                    new docx.Paragraph({
                      text: para,
                      spacing: { after: 200 }
                    })
                  ) : []),
                  
                  // Sources
                  new docx.Paragraph({
                    text: "Sources:",
                    heading: docx.HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 }
                  }),
                  
                  ...selectedSources.map((source, index) => 
                    new docx.Paragraph({
                      text: `${index + 1}. ${source}`,
                      spacing: { after: 100 }
                    })
                  )
                ]
              }]
            });
            
            // Generate and save DOCX
            const buffer = await docx.Packer.toBlob(doc);
            saveAs(buffer, `${searchQuery}_report.docx`);
            showToast({
              type: 'success',
              message: 'DOCX exported successfully',
            });
          } catch (err) {
            console.error("DOCX error:", err);
            showToast({
              type: 'error',
              message: 'Error creating DOCX. Try another format.',
            });
          }
          break;
          
        case 'txt':
          try {
            // Format text file
            const textContent = [
              'Research Report',
              `Topic: ${searchQuery}`,
              `Generated: ${new Date().toLocaleDateString()}`,
              '',
              report || '',
              '',
              'Sources:',
              ...selectedSources.map((source, index) => `${index + 1}. ${source}`)
            ].join('\n\n');
            
            const textBlob = new Blob([textContent], { type: 'text/plain' });
            saveAs(textBlob, `${searchQuery}_report.txt`);
            showToast({
              type: 'success',
              message: 'Text file exported successfully',
            });
          } catch (err) {
            console.error("Text export error:", err);
            showToast({
              type: 'error',
              message: 'Error creating text file.',
            });
          }
          break;
          
        case 'markdown':
        case 'md':
          try {
            // Format markdown content
            const markdownContent = [
              '# Research Report\n',
              `## Topic: ${searchQuery}\n`,
              `Generated: ${new Date().toLocaleDateString()}\n`,
              '\n---\n',
              report,
              '\n## Sources\n',
              selectedSources.map((source, index) => `${index + 1}. ${source}`).join('\n')
            ].join('\n');
            
            const markdownBlob = new Blob([markdownContent], { type: 'text/markdown' });
            saveAs(markdownBlob, `${searchQuery}_report.md`);
            showToast({
              type: 'success',
              message: 'Markdown file exported successfully',
            });
          } catch (err) {
            console.error("Markdown export error:", err);
            showToast({
              type: 'error',
              message: 'Error creating Markdown file.',
            });
          }
          break;
          
        default:
          showToast({
            type: 'error',
            message: 'Unsupported export format',
          });
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast({
        type: 'error',
        message: 'Failed to export report',
      });
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
      </div>
      
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <CogIcon className="h-4 w-4 mr-2" />
          Generation Mode
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            generationMode === 'traditional' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}>
            <input
              type="radio"
              name="generationMode"
              value="traditional"
              checked={generationMode === 'traditional'}
              onChange={(e) => setGenerationMode(e.target.value as 'traditional' | 'fast')}
              className="sr-only"
            />
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <SparklesIcon className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">Thorough Analysis</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Extracts and analyzes full content from sources
              </p>
            </div>
          </label>
          
          <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            generationMode === 'fast' 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}>
            <input
              type="radio"
              name="generationMode"
              value="fast"
              checked={generationMode === 'fast'}
              onChange={(e) => setGenerationMode(e.target.value as 'traditional' | 'fast')}
              className="sr-only"
            />
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <BoltIcon className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                <span className="font-medium text-gray-900 dark:text-white">Quick Insights</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Uses URL context for faster processing
                {selectedDocumentIds.length > 0 && (
                  <span className="block text-yellow-600 dark:text-yellow-400">
                    ⚠️ Documents will use traditional mode
                  </span>
                )}
              </p>
            </div>
          </label>
        </div>
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
            <span className="text-white font-medium">
              {generationMode === 'fast' ? 'Fast Generating...' : 'Generating Report...'}
            </span>
            <div className="absolute top-0 left-0 right-0 bottom-0 -inset-x-full z-10 block transform-gpu bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-fast"></div>
          </div>
        ) : (
          <>
            {generationMode === 'fast' ? (
              <BoltIcon className="h-5 w-5 mr-2 text-white" />
            ) : (
              <SparklesIcon className="h-5 w-5 mr-2 text-white" />
            )}
            <span className="text-white">
              {generationMode === 'fast' ? 'Generate Quick Report' : 'Generate Thorough Report'}
            </span>
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
              className="rounded-md border border-gray-300 dark:border-gray-600 py-1 px-3 bg-white dark:bg-black text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="TXT">TXT</option>
              <option value="MD">Markdown</option>
            </select>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-blue-800 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                   <>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export
                  </>
                    )}
            </button>
          </div>
          
          <div className=" border border-gray-700 dark:border-gray-300 text-gray-900 dark:text-gray-100 rounded-lg shadow-md p-6 prose !prose-invert max-w-none ">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Sources</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-white space-y-1 ml-1">
              {selectedSources.map((source, index) => (
                <li key={index}>
                  <a 
                    href={source} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600 dark:text-blue-400"
                  >
                    {source}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSection; 
