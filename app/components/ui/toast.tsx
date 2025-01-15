/**
 * Toast Component
 * Last Updated: 2024-03-20 03:45 PST
 * 
 * This component provides toast notifications.
 */

'use client';

import * as React from 'react';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

interface ToastContextValue {
  toast: (props: ToastProps) => void;
  closeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

interface Toast extends ToastProps {
  id: string;
  createdAt: number;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * Toast provider component
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...props,
      id,
      createdAt: Date.now(),
    };

    setToasts(prev => [...prev, newToast]);

    if (props.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, props.duration || 5000);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const value = React.useMemo(() => ({
    toast: addToast,
    closeToast: removeToast,
  }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 w-full md:max-w-sm p-4 md:p-6 pointer-events-none">
        <div className="flex flex-col gap-4">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Toast component
 */
function Toast({
  title,
  description,
  variant = 'default',
  onClose,
}: ToastProps) {
  const variantStyles = {
    default: 'bg-white text-gray-900',
    success: 'bg-green-50 text-green-900',
    error: 'bg-red-50 text-red-900',
    warning: 'bg-yellow-50 text-yellow-900',
    info: 'bg-blue-50 text-blue-900',
  }[variant];

  return (
    <Transition
      appear
      show={true}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5',
        variantStyles
      )}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium">{title}</p>
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>
            {onClose && (
              <div className="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Transition>
  );
}

/**
 * Use toast hook
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Toast function for direct usage
 */
export const toast = (props: ToastProps) => {
  const context = React.useContext(ToastContext);
  if (!context) {
    console.warn('Toast was called outside of ToastProvider');
    return;
  }
  context.toast(props);
}; 