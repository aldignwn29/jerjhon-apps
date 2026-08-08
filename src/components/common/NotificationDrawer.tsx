import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert, Check } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead } = useERP();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#b90f0f]" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Notification Center
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(!notifications || notifications.length === 0) ? (
            <p className="text-center text-xs text-slate-400 py-10">
              Tidak ada notifikasi baru.
            </p>
          ) : (
            (notifications || []).map((n) => {
              const getIcon = () => {
                switch (n.type) {
                  case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
                  case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                  case 'alert': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
                  default: return <Info className="w-4 h-4 text-sky-500" />;
                }
              };

              return (
                <div
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                      : 'bg-white dark:bg-slate-800 border-[#b90f0f]/30 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-100">
                      {getIcon()}
                      <span>{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                    {n.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-400">
                      {n.linkModule || 'System Log'}
                    </span>
                    {!n.read && (
                      <span className="inline-flex items-center gap-1 text-[#b90f0f] font-semibold">
                        <Check className="w-3 h-3" /> Tandai Dibaca
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400">
            Automated Notification Engine - Jerjhon ERP
          </p>
        </div>

      </div>
    </div>
  );
};
