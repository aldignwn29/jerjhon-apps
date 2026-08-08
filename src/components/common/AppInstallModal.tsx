import React, { useState } from 'react';
import { Smartphone, Monitor, Download, CheckCircle2, X, Globe, Shield } from 'lucide-react';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Instal JerhonERP (Desktop & Mobile)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Jalankan aplikasi sebagai Native App di PC, Laptop, & HP Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Intro Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 text-rose-900 dark:text-rose-200 text-xs leading-relaxed flex items-start gap-3">
            <Globe className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1 text-sm">PWA (Progressive Web App) Ready</span>
              JerhonERP dirancang khusus agar dapat dipasang langsung di perangkat Desktop (Windows/macOS/Linux) maupun Handphone (Android/iOS) tanpa perlu download dari App Store/Play Store yang berat.
            </div>
          </div>

          {/* Desktop Instructions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Monitor className="w-4 h-4 text-rose-600" />
              <span>Cara Instal di Komputer / Laptop (Windows & Mac)</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <div>
                  Buka aplikasi ini menggunakan browser <b>Google Chrome</b>, <b>Microsoft Edge</b>, atau <b>Brave</b>.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <div>
                  Perhatikan bilah alamat (URL bar) di bagian paling atas kanan, klik ikon <b>Install (ikon komputer dengan tanda panah ke bawah)</b> atau klik menu titik tiga (⋮) di pojok kanan atas browser, lalu pilih <b>"Instal JerhonERP..."</b> atau <b>"Save and share &gt; Install app"</b>.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <div>
                  Aplikasi akan terbuka di jendela mandiri (standalone desktop app) dengan shortcut di Desktop / Taskbar Anda!
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Instructions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Smartphone className="w-4 h-4 text-rose-600" />
              <span>Cara Instal di HP Android & iPhone (iOS)</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">Android</span>
                <div>
                  Buka URL aplikasi di <b>Google Chrome HP</b> &rarr; Tap menu titik tiga (⋮) di kanan atas &rarr; Pilih <b>"Tambahkan ke Layar Utama" (Add to Home screen)</b> atau <b>"Instal Aplikasi"</b>.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">iOS</span>
                <div>
                  Buka URL aplikasi di <b>Safari iPhone/iPad</b> &rarr; Tap ikon <b>Share (Kotak dengan panah ke atas)</b> di bagian bawah &rarr; Scroll dan pilih <b>"Tambahkan ke Layar Utama" (Add to Home Screen)</b>.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition shadow-md"
          >
            Mengerti & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
