import { FC, useState } from 'react';
import { generateReport } from '../lib/api';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { DocumentTextIcon, ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface ReportSectionProps {
  selectedSources: string[];
  searchQuery: string;
}

const ReportSection: FC<ReportSectionProps> = ({ selectedSources, searchQuery }) => {
  const [promptTemplate, setPromptTemplate] = useState(
    'Generate a comprehensive report based on the following sources. Format your response using Markdown with proper headings (##), bullet points, numbered lists, and emphasis where appropriate. Include key findings, analysis, and recommendations.'
  );
  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF');
  const [isExporting, setIsExporting] = useState(false);

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

  return (
    <div className="bg-white dark:bg-gray-900 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-lg dark:hover:shadow-indigo-900/20">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-indigo-400" />
        Report Generation
      </h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Prompt Template
        </label>
        <textarea
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
          rows={3}
        />
      </div>
      
      <button
        onClick={handleGenerateReport}
        disabled={isGenerating || selectedSources.length === 0}
        className={`w-full py-3 relative overflow-hidden rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-indigo-500/20 flex items-center justify-center
          ${isGenerating 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-indigo-600 dark:to-purple-600 text-white/80' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-indigo-600 dark:to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 dark:hover:from-indigo-500 dark:hover:to-purple-500'
          }`}
      >
        {isGenerating ? (
          <>
            <div className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            <span className="relative z-10">Generating Report...</span>
          </>
        ) : (
          <>
            <SparklesIcon className="h-5 w-5 mr-2" />
            Generate Report
          </>
        )}
      </button>

      {report && (
        <div className="mt-8 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-indigo-400" />
              Generated Report
            </h3>
            <div className="flex gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-white text-sm"
              >
                <option>PDF</option>
                <option>DOCX</option>
                <option>TXT</option>
              </select>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 dark:bg-indigo-600 text-white rounded-lg hover:bg-blue-500 dark:hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center"
              >
                {isExporting ? (
                  <div className="animate-spin h-4 w-4 border-t-2 border-white border-r-2 border-white rounded-full mr-2"></div>
                ) : (
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 prose dark:prose-invert max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4 text-gray-900 dark:text-white" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3 text-gray-900 dark:text-white" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2 text-gray-900 dark:text-white" {...props} />,
                p: ({node, ...props}) => <p className="my-2 text-gray-700 dark:text-gray-300" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 text-gray-700 dark:text-gray-300" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 text-gray-700 dark:text-gray-300" {...props} />,
                li: ({node, ...props}) => <li className="ml-2 my-1" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-indigo-300" {...props} />,
                em: ({node, ...props}) => <em className="italic text-gray-800 dark:text-purple-300" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-600 dark:text-indigo-400 hover:text-blue-500 dark:hover:text-indigo-300 transition-colors" {...props} />
              }}
            >
              {report}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSection; 
