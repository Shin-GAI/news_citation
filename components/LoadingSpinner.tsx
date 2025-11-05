
import React from 'react';

const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
