import { FC, useState } from 'react';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

interface FileUploadBase64Props {
  onUploadComplete: (files: {name: string, content: string}[]) => void;
}

const FileUploadBase64: FC<FileUploadBase64Props> = ({ onUploadComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    
    try {
      const processedFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          // Convert file to base64
          const base64 = await fileToBase64(file);
          
          // Send to API for OCR processing
          const response = await fetch('/api/extract-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              filename: file.name,
              base64Content: base64
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to process ${file.name}`);
          }
          
          const data = await response.json();
          return {
            name: file.name,
            content: data.text
          };
        })
      );
      
      onUploadComplete(processedFiles);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Failed to process files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <DocumentArrowUpIcon className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">PDF files (MAX. 10MB)</p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </label>
      </div>
      
      {isProcessing && (
        <div className="mt-4 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Processing files...</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadBase64; 