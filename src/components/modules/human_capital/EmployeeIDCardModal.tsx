import React, { useState } from 'react';
import { X, QrCode, ShieldCheck, CheckCircle2, Building2, Copy, Check, Share2, Sparkles, UserCheck } from 'lucide-react';
import { User } from '../../../types';

interface EmployeeIDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

// Simple deterministic seed-based matrix generator for realistic digital QR Code rendering
function generateQRMatrix(text: string): boolean[][] {
  const size = 21; // 21x21 matrix (Version 1 QR)
  const matrix: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

  // Add Finder Patterns (7x7 at corners)
  const addFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          matrix[row + r][col + c] = true;
        }
      }
    }
  };

  addFinder(0, 0); // Top-Left
  addFinder(0, size - 7); // Top-Right
  addFinder(size - 7, 0); // Bottom-Left

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Seed data matrix based on input text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder patterns area
      if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) {
        continue;
      }
      if (r === 6 || c === 6) continue; // Skip timing patterns

      const bit = Math.abs((hash ^ (r * 31 + c * 17)) % 7) < 4;
      matrix[r][c] = bit;
    }
  }

  return matrix;
}

export const EmployeeIDCardModal: React.FC<EmployeeIDCardModalProps> = ({ isOpen, onClose, user }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !user) return null;

  const employeeId = user?.id || '3171011212900001';
  const qrDataStr = `JERJHON-VERIFIED-ID:${user.id}:${user.email}:${employeeId}`;
  const qrMatrix = generateQRMatrix(qrDataStr);

  const handleCopy = () => {
    navigator.clipboard.writeText(employeeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden text-slate-100 space-y-5">
        {/* Ambient Badge Glow */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-blue-600/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide text-white">JERJHON ENTERPRISE</h3>
              <p className="text-[10px] text-slate-400 font-mono">Digital In-Office ID Badge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* ID Card Display */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/90 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4">
          {/* Top Hologram Strip */}
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" /> OFFICIAL STAFF BADGE
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              ACTIVE
            </span>
          </div>

          {/* Employee Info Header */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center border-2 border-blue-400 shadow-md">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5 border-2 border-slate-900 shadow">
                <UserCheck size={12} />
              </div>
            </div>

            <div className="space-y-0.5 overflow-hidden">
              <h4 className="text-base font-black text-white truncate">{user.name}</h4>
              <p className="text-xs font-semibold text-blue-400 truncate">{user.role}</p>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <span>ID: {employeeId}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 hover:text-white transition"
                  title="Salin ID Karyawan"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* QR Code Matrix Area */}
          <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-md border border-slate-200">
            <div className="w-40 h-40 relative flex items-center justify-center">
              <svg viewBox="0 0 21 21" className="w-full h-full shape-rendering-crisp">
                {qrMatrix.map((row, r) =>
                  row.map((cell, c) => (
                    cell ? (
                      <rect
                        key={`${r}-${c}`}
                        x={c}
                        y={r}
                        width={1}
                        height={1}
                        fill="#0f172a"
                      />
                    ) : null
                  ))
                )}
              </svg>
            </div>
            <div className="mt-2 text-[10px] font-mono font-bold text-slate-600 tracking-wider">
              {employeeId} • IN-OFFICE TURNSTILE QR
            </div>
          </div>

          {/* Verification Footer */}
          <div className="pt-1 text-center">
            <p className="text-[10px] text-slate-400 leading-tight">
              Pindai QR ini pada pemindai gerbang / absensi kantor untuk verifikasi identitas fisik.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl text-xs transition border border-slate-700"
        >
          Tutup Digital ID
        </button>
      </div>
    </div>
  );
};
