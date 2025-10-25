
import React from 'react';

interface DownloadButtonProps {
  imageUrl: string | null;
  filename: string;
  className?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ imageUrl, filename, className = '' }) => {
  if (!imageUrl) {
    return null;
  }

  return (
    <a
      href={imageUrl}
      download={filename}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors duration-200 ${className}`}
    >
      <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download Image
    </a>
  );
};

export default DownloadButton;
