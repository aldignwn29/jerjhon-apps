import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  label?: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportCSV,
  onExportPDF,
  label = 'Export Data'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all"
      >
        <Download className="w-4 h-4 text-[#b90f0f]" />
        <span>{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => {
              setIsOpen(false);
              onExportCSV();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export format CSV</span>
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onExportPDF();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Export format PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};
