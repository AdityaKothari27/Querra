import { FC, useState, useEffect } from 'react';
import { generateReport } from '../lib/api';
import { SparklesIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
import { useToast } from './Toast';

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
  const [generationProgress, setGenerationProgress] = useState(0);
  const [report, setReport] = useState<string | null>(null);
  const [promptTemplate, setPromptTemplate] = useState('');
  const [exportFormat, setExportFormat] = useState('PDF');
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  // Simulate progress during report generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGenerating) {
      setGenerationProgress(0);
      interval = setInterval(() => {
        setGenerationProgress(prev => {
          // Slow down progress as it gets closer to 90%
          const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 80 ? 1 : 0.5;
          const newProgress = Math.min(prev + increment, 90);
          return newProgress;
        });
      }, 300);
    } else if (generationProgress > 0) {
      // Complete the progress bar when generation is done
      setGenerationProgress(100);
      interval = setTimeout(() => {
        setGenerationProgress(0);
      }, 1000) as unknown as NodeJS.Timeout;
    }
    
    return () => clearInterval(interval);
  }, [isGenerating]);

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
        promptTemplate || getDefaultPrompt()
      );
      setReport(response.report);
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
    return 'Generate a comprehensive report based on the provided sources.';
  };

  const handleExport = async () => {
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
              if (yPosition > 270) { // Check if near page bottom
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
          <div className="w-full relative overflow-hidden">
            <span className="text-white font-medium">Generating Report...</span>
            <div className="absolute top-0 left-0 right-0 bottom-0 -inset-x-full z-10 block transform-gpu bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-fast"></div>
            <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full w-full mt-2">
              <div 
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
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
              className="rounded-md border border-gray-300 dark:border-gray-600 py-1 px-3 bg-white dark:bg-black text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="TXT">TXT</option>
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
              ) : 'Export'}
            </button>
          </div>
          
          <div className="bg-white dark:bg-[#3b3b3b] border border-gray-200 dark:border-gray-300 text-gray-900 dark:text-gray-100 rounded-lg shadow-md p-6 prose dark:prose-invert max-w-none report-container">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSection; 
