import React, { useState, useEffect } from 'react';
import { Fingerprint, ScanFace, ShieldCheck, CheckCircle2, AlertCircle, X, Smartphone, ShieldAlert, RefreshCw, Sparkles } from 'lucide-react';
import { User } from '../../../types';
import {
  isWebAuthnSupported,
  getStoredBiometricCreds,
  isUserBiometricRegistered,
  registerWebAuthnBiometric,
  unregisterBiometricCredential,
  StoredBiometricCred,
} from '../../../lib/webauthn';

interface UserBiometricSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

export const UserBiometricSetupModal: React.FC<UserBiometricSetupModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [webAuthnSupported, setWebAuthnSupported] = useState<boolean>(true);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [userCred, setUserCred] = useState<StoredBiometricCred | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [scanType, setScanType] = useState<'fingerprint' | 'face'>('fingerprint');

  useEffect(() => {
    if (isOpen && user) {
      checkStatus();
    }
  }, [isOpen, user]);

  const checkStatus = async () => {
    const supported = await isWebAuthnSupported();
    setWebAuthnSupported(supported);

    if (user?.id) {
      const registered = isUserBiometricRegistered(user.id);
      setIsRegistered(registered);
      const allCreds = getStoredBiometricCreds();
      const found = allCreds.find(c => c.userId === user.id);
      setUserCred(found || null);
    }
  };

  if (!isOpen || !user) return null;

  const handleRegister = async (type: 'fingerprint' | 'face') => {
    setIsProcessing(true);
    setScanType(type);
    setStatusMessage({
      text: `Menghubungkan pemindai biometrik HP (${type === 'face' ? 'Face ID' : 'Fingerprint'}) untuk @${user.username || 'user'}...`,
      type: 'info',
    });

    try {
      const res = await registerWebAuthnBiometric(user, type);
      setIsProcessing(false);

      if (res.success) {
        setStatusMessage({ text: res.message, type: 'success' });
        checkStatus();
        if (onSuccess) onSuccess();
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage({ text: err.message || 'Gagal mendaftarkan biometrik.', type: 'error' });
    }
  };

  const handleUnregister = () => {
    if (confirm(`Apakah Anda yakin ingin menghapus kredensial biometrik untuk ${user.name}?`)) {
      unregisterBiometricCredential(user.id);
      setStatusMessage({ text: 'Biometrik berhasil dinonaktifkan pada perangkat ini.', type: 'info' });
      checkStatus();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden text-left">
        {/* Top Glow Decor */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Fingerprint size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">
                Konfigurasi Biometrik HP
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase font-mono mt-0.5">
                Face ID & Fingerprint Setup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info Details */}
        <div className="my-4 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{user.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">@{user.username} • {user.role}</div>
              </div>
            </div>
            <div>
              {isRegistered ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 size={12} /> Aktif (ON)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800">
                  Belum Aktif (OFF)
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            Biometrik WebAuthn beroperasi di tingkat perangkat HP / Browser pengguna. Aktifkan Face ID atau Sidik Jari agar karyawan dapat login ke portal ERP HCM dalam hitungan detik.
          </p>
        </div>

        {/* Interactive Scanner Zone */}
        <div className="my-4 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-50/50 to-blue-50/30 dark:from-slate-800/50 dark:to-slate-800/20 rounded-3xl border border-indigo-100 dark:border-slate-700/60 relative overflow-hidden">
          <div className="relative mb-3">
            {/* Outer Circular Ring */}
            <div className={`w-20 h-20 rounded-full border-2 border-dashed ${isProcessing ? 'border-indigo-500 animate-spin' : isRegistered ? 'border-emerald-500' : 'border-indigo-300'} flex items-center justify-center transition-all duration-500`}></div>
            
            {/* Inner Icon */}
            <div className={`absolute inset-2.5 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              isRegistered 
                ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                : 'bg-indigo-600 text-white shadow-indigo-600/30'
            }`}>
              {scanType === 'face' ? (
                <ScanFace size={32} className={isProcessing ? 'animate-pulse' : ''} />
              ) : (
                <Fingerprint size={32} className={isProcessing ? 'animate-pulse' : ''} />
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {isProcessing
                ? 'Sedang Memproses Sensor Biometrik...'
                : isRegistered
                ? 'Sidik Jari / Face ID Terdaftar'
                : 'Konfigurasikan Biometrik Sekarang'}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs">
              {isRegistered
                ? `Kredensial disimpan pada perangkat ini (${userCred?.deviceType || 'HP / Device'}). Tipe: ${userCred?.authenticatorType === 'face' ? 'Face ID (Wajah)' : 'Fingerprint (Sidik Jari)'}.`
                : 'Dapat didaftarkan langsung menggunakan pemindai wajah (Face ID) atau sidik jari internal HP karyawan.'}
            </p>
          </div>
        </div>

        {/* Status Notification Box */}
        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle size={15} className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            ) : (
              <RefreshCw size={15} className="shrink-0 text-indigo-600 dark:text-indigo-400 animate-spin mt-0.5" />
            )}
            <span className="text-[11px] leading-snug">{statusMessage.text}</span>
          </div>
        )}

        {/* Form Actions */}
        <div className="space-y-2">
          {!isRegistered ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleRegister('fingerprint')}
                className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 min-h-[38px]"
              >
                <Fingerprint size={16} />
                <span>Aktifkan Fingerprint</span>
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleRegister('face')}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 min-h-[38px]"
              >
                <ScanFace size={16} />
                <span>Aktifkan Face ID</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRegister(userCred?.authenticatorType || 'fingerprint')}
                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-sm"
              >
                <RefreshCw size={14} className="animate-pulse" />
                <span>Registrasi Ulang</span>
              </button>
              <button
                type="button"
                onClick={handleUnregister}
                className="flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 py-2.5 px-3 rounded-xl text-xs font-bold transition"
              >
                <ShieldAlert size={14} />
                <span>Nonaktifkan</span>
              </button>
            </div>
          )}

          <div className="pt-2 text-center text-[9px] text-slate-400 font-mono flex items-center justify-center gap-1">
            <Smartphone size={10} className="text-indigo-400" />
            {webAuthnSupported ? 'Mendukung Sensor Perangkat HP' : 'Mode Simulasi & Passkey Fallback Aktif'}
          </div>
        </div>
      </div>
    </div>
  );
};
