import React, { FC, useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
}

export const Toast: FC<ToastProps> = ({ 
  type, 
  message, 
  duration = 3000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for transition to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-800" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-800" />;
      case 'warning':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-800" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-800" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/30';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/30';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/30';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/30';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-400 dark:border-green-600';
      case 'error':
        return 'border-red-400 dark:border-red-600';
      case 'warning':
        return 'border-yellow-400 dark:border-yellow-600';
      case 'info':
      default:
        return 'border-blue-400 dark:border-blue-600';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-500';
      case 'error':
        return 'text-red-800 dark:text-red-500';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-500';
      case 'info':
      default:
        return 'text-blue-800 dark:text-blue-500';
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-md rounded-lg border p-4 shadow-lg transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      } ${getBackgroundColor()} ${getBorderColor()}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className={`inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${getTextColor()}`}
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export type ToastOptions = {
  type: ToastType;
  message: string;
  duration?: number;
};

// Create a ToastContext
export const ToastContext = React.createContext({
  showToast: (options: ToastOptions) => {},
});

export const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<(ToastOptions & { id: number })[]>([]);
  const [lastId, setLastId] = useState(0);

  const showToast = (options: ToastOptions) => {
    const id = lastId + 1;
    setLastId(id);
    setToasts(prevToasts => [...prevToasts, { ...options, id }]);
  };

  const closeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => closeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook to use the toast
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 