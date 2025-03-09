import { FC, useState, useEffect } from 'react';
import { generateReport } from '../lib/api';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { DocumentTextIcon, ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CategoryConfig } from '../types/index';

interface ReportSectionProps {
  selectedSources: string[];
  searchQuery: string;
  categoryConfig: CategoryConfig;
}

const ReportSection: FC<ReportSectionProps> = ({ 
  selectedSources, 
  searchQuery,
  categoryConfig 
}) => {
  const [promptTemplate, setPromptTemplate] = useState('');
  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF');
  const [isExporting, setIsExporting] = useState(false);

  // Update prompt template when category changes
  useEffect(() => {
    setPromptTemplate(categoryConfig.defaultPrompt || '');
  }, [categoryConfig]);

  const handleGenerateReport = async () => {
    if (selectedSources.length === 0) {
      alert('Please select at least one source');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateReport(searchQuery, selectedSources, promptTemplate);
      setReport(response.report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      switch (exportFormat.toLowerCase()) {
        case 'pdf':
          const doc = new jsPDF();
          
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
          const pageWidth = doc.internal.pageSize.width;
          const margin = 20;
          const maxWidth = pageWidth - (margin * 2);
          
          // Split content into paragraphs
          const paragraphs = report.split('\n\n');
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
          
          doc.save('research_report.pdf');
          break;

        case 'docx':
          // Create DOCX document
          const doc2 = new Document({
            sections: [{
              properties: {},
              children: [
                // Title
                new Paragraph({
                  text: "Research Report",
                  heading: "Heading1",
                  spacing: { after: 200 }
                }),
                
                // Topic
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Topic: ${searchQuery}`,
                      bold: true,
                      size: 28
                    })
                  ],
                  spacing: { after: 200 }
                }),
                
                // Date
                new Paragraph({
                  text: `Generated: ${new Date().toLocaleDateString()}`,
                  spacing: { after: 400 }
                }),
                
                // Content
                ...report.split('\n\n').map(para => 
                  new Paragraph({
                    text: para,
                    spacing: { after: 200 }
                  })
                ),
                
                // Sources
                new Paragraph({
                  text: "Sources:",
                  heading: "Heading2",
                  spacing: { before: 400, after: 200 }
                }),
                
                ...selectedSources.map((source, index) => 
                  new Paragraph({
                    text: `${index + 1}. ${source}`,
                    spacing: { after: 100 }
                  })
                )
              ]
            }]
          });
          
          // Generate and save DOCX
          const buffer = await Packer.toBlob(doc2);
          saveAs(buffer, 'research_report.docx');
          break;

        case 'txt':
          // Format text file
          const textContent = [
            'Research Report',
            `Topic: ${searchQuery}`,
            `Generated: ${new Date().toLocaleDateString()}`,
            '',
            report,
            '',
            'Sources:',
            ...selectedSources.map((source, index) => `${index + 1}. ${source}`)
          ].join('\n\n');
          
          const textBlob = new Blob([textContent], { type: 'text/plain' });
          saveAs(textBlob, 'research_report.txt');
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const getButtonColorClass = () => {
    return `bg-${categoryConfig.color}-600 hover:bg-${categoryConfig.color}-500`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Generate Report</h2>
      
      <div className="mb-4">
        <label htmlFor="prompt-template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Prompt Template
        </label>
        <textarea
          id="prompt-template"
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-white"
          rows={4}
        />
      </div>
      
      <button
        onClick={handleGenerateReport}
        disabled={isGenerating || selectedSources.length === 0}
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
        <div className="mt-8 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Generated Report</h3>
            <div className="flex gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option>PDF</option>
                <option>DOCX</option>
                <option>TXT</option>
              </select>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
          
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 prose dark:prose-invert max-w-none">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSection; 
