import React, { useState, useEffect } from 'react';
import { Fingerprint, ScanFace, ShieldCheck, CheckCircle2, AlertCircle, X, KeyRound, Sparkles, Smartphone, ShieldAlert, RefreshCw } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import {
  isWebAuthnSupported,
  getStoredBiometricCreds,
  isUserBiometricRegistered,
  registerWebAuthnBiometric,
  unregisterBiometricCredential,
  StoredBiometricCred,
} from '../../../lib/webauthn';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useERP();
  const [webAuthnSupported, setWebAuthnSupported] = useState<boolean>(true);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [userCred, setUserCred] = useState<StoredBiometricCred | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [scanType, setScanType] = useState<'fingerprint' | 'face'>('fingerprint');

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen, currentUser]);

  const checkStatus = async () => {
    const supported = await isWebAuthnSupported();
    setWebAuthnSupported(supported);

    if (currentUser?.id) {
      const registered = isUserBiometricRegistered(currentUser.id);
      setIsRegistered(registered);
      const allCreds = getStoredBiometricCreds();
      const found = allCreds.find(c => c.userId === currentUser.id);
      setUserCred(found || null);
    }
  };

  if (!isOpen) return null;

  const handleRegister = async (type: 'fingerprint' | 'face') => {
    if (!currentUser) return;
    setIsProcessing(true);
    setScanType(type);
    setStatusMessage({
      text: `Memulai pendaftaran biometrik WebAuthn (${type === 'face' ? 'Face ID' : 'Fingerprint'}). Sediakan pemindai perangkat Anda...`,
      type: 'info',
    });

    try {
      const res = await registerWebAuthnBiometric(currentUser, type);
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
    if (!currentUser) return;
    if (confirm('Apakah Anda yakin ingin menghapus pendaftaran biometrik untuk akun ini?')) {
      unregisterBiometricCredential(currentUser.id);
      setStatusMessage({ text: 'Biometrik berhasil dihapus dari perangkat ini.', type: 'info' });
      checkStatus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Keamanan Biometrik
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Web Authentication API (WebAuthn)
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

        {/* User Card */}
        <div className="my-4 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{currentUser?.name}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{currentUser?.email} • {currentUser?.role}</div>
            </div>
          </div>
          <div className="text-right">
            {isRegistered ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 size={12} /> Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800">
                Belum Terdaftar
              </span>
            )}
          </div>
        </div>

        {/* Interactive Biometric Scanner Illustration */}
        <div className="my-5 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50/50 to-indigo-50/30 dark:from-slate-800/50 dark:to-slate-800/20 rounded-3xl border border-blue-100 dark:border-slate-700/60 relative overflow-hidden">
          <div className="relative mb-3">
            {/* Outer Pulsing Ring */}
            <div className={`w-24 h-24 rounded-full border-2 border-dashed ${isProcessing ? 'border-blue-500 animate-spin' : isRegistered ? 'border-emerald-500' : 'border-blue-300'} flex items-center justify-center transition-all duration-500`}></div>
            
            {/* Inner Glowing Icon Container */}
            <div className={`absolute inset-2 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
              isRegistered 
                ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                : 'bg-blue-600 text-white shadow-blue-600/30'
            }`}>
              {scanType === 'face' ? (
                <ScanFace size={40} className={isProcessing ? 'animate-pulse' : ''} />
              ) : (
                <Fingerprint size={40} className={isProcessing ? 'animate-pulse' : ''} />
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isProcessing
                ? 'Memindai Biometrik Perangkat...'
                : isRegistered
                ? 'Sidik Jari / Face ID Siap Digunakan'
                : 'Daftarkan Otentikasi Biometrik'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              {isRegistered
                ? `Kredensial terdaftar pada ${userCred?.deviceType || 'Perangkat'} (${userCred?.authenticatorType === 'face' ? 'Face Recognition' : 'Touch ID / Fingerprint'}).`
                : 'Gunakan pemindai sidik jari bawaan (Touch ID) atau Face ID untuk sign-in super cepat tanpa perlu mengetikkan password.'}
            </p>
          </div>
        </div>

        {/* Status Alert Message */}
        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            ) : (
              <RefreshCw size={16} className="shrink-0 text-blue-600 dark:text-blue-400 animate-spin mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isRegistered ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleRegister('fingerprint')}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 px-4 rounded-2xl text-xs font-bold transition shadow-sm active:scale-95"
              >
                <Fingerprint size={18} />
                <span>Set Sidik Jari</span>
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleRegister('face')}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-white py-3 px-4 rounded-2xl text-xs font-bold transition shadow-sm active:scale-95"
              >
                <ScanFace size={18} />
                <span>Set Face ID</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRegister('fingerprint')}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-2xl text-xs font-bold transition shadow-sm"
              >
                <RefreshCw size={14} />
                <span>Perbarui Biometrik</span>
              </button>
              <button
                type="button"
                onClick={handleUnregister}
                className="flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 py-2.5 px-3 rounded-2xl text-xs font-bold transition"
              >
                <ShieldAlert size={14} />
                <span>Hapus</span>
              </button>
            </div>
          )}

          <div className="pt-2 text-center text-[10px] text-slate-400 font-mono">
            {webAuthnSupported ? '✓ WebAuthn Platform Authenticator Ready' : 'ⓘ WebAuthn Native / Fallback Passkey Supported'}
          </div>
        </div>
      </div>
    </div>
  );
};
