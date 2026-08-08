import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface InventoryToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const InventoryToast: React.FC<InventoryToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-900/90 border-emerald-700 text-white dark:bg-emerald-950/95 dark:border-emerald-600',
    error: 'bg-rose-900/90 border-rose-700 text-white dark:bg-rose-950/95 dark:border-rose-600',
    warning: 'bg-amber-900/90 border-amber-700 text-white dark:bg-amber-950/95 dark:border-amber-600',
    info: 'bg-indigo-900/90 border-indigo-700 text-white dark:bg-indigo-950/95 dark:border-indigo-600',
  };

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full p-1 animate-in fade-in slide-in-from-top-3 duration-200">
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 ${bgStyles[toast.type]}`}>
        {iconMap[toast.type]}
        <div className="flex-1 min-w-0 pr-2">
          <h5 className="font-bold text-sm tracking-tight leading-tight">{toast.title}</h5>
          <p className="text-xs opacity-90 mt-1 leading-snug">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
