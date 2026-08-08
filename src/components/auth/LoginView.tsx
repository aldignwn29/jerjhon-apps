import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, User, Key, Eye, EyeOff, LogIn,
  CheckCircle2, Sparkles, Building2, Server, AlertCircle, Users,
  Fingerprint, ScanFace, Smartphone, RefreshCw, X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { 
  authenticateWebAuthnBiometric, 
  getStoredBiometricCreds, 
  registerWebAuthnBiometric,
  StoredBiometricCred
} from '../../lib/webauthn';
import { User as UserType } from '../../types';

export const LoginView: React.FC = () => {
  const { users, loginWithCredentials, loginDirect, companyProfile, resetPassword } = useERP();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Biometric registration modal state on login page
  const [showSetupBioModal, setShowSetupBioModal] = useState(false);
  const [bioUserId, setBioUserId] = useState<string>('');
  const [bioPassword, setBioPassword] = useState('');
  const [bioType, setBioType] = useState<'fingerprint' | 'face'>('fingerprint');
  const [bioSuccessMsg, setBioSuccessMsg] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Silakan isi username/email dan password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const result = await loginWithCredentials(username, password);
    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setErrorMsg('Silakan isi email Anda.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const result = await resetPassword(resetEmail);
    setLoading(false);
    if (result.success) {
      setResetSuccess(true);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setBioSuccessMsg('');

    const creds = getStoredBiometricCreds();
    if (creds.length === 0) {
      setLoading(false);
      if (users.length > 0) {
        setBioUserId(users[0].id);
      }
      setShowSetupBioModal(true);
      return;
    }

    try {
      const res = await authenticateWebAuthnBiometric(users);
      setLoading(false);
      if (res.success && res.user) {
        setBioSuccessMsg(res.message);
        setTimeout(() => {
          loginDirect(res.user!);
        }, 800);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Gagal autentikasi biometrik.');
    }
  };

  const handleRegisterAndLoginBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const selectedUser = users.find(u => u.id === bioUserId);
    if (!selectedUser) {
      setErrorMsg('Pengguna tidak ditemukan.');
      return;
    }

    setLoading(true);
    const loginCheck = await loginWithCredentials(selectedUser.username || selectedUser.email, bioPassword);
    if (!loginCheck.success) {
      setLoading(false);
      setErrorMsg('Password salah atau akun tidak ditemukan.');
      return;
    }

    const regRes = await registerWebAuthnBiometric(selectedUser, bioType);
    setLoading(false);

    if (regRes.success) {
      setShowSetupBioModal(false);
      setBioSuccessMsg(regRes.message);
      setTimeout(() => {
        loginDirect(selectedUser);
      }, 800);
    } else {
      setErrorMsg(regRes.message);
    }
  };

  const storedCreds = getStoredBiometricCreds();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-[#b90f0f] selection:text-white relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#b90f0f]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#b90f0f] to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-900/20">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">{companyProfile.name}</h1>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Server size={12} className="text-emerald-400" />
          SYSTEM ONLINE
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-[1200px] mx-auto gap-8 lg:flex-row lg:justify-center">
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative">
          
          <div className="mb-8 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700 shadow-xl mb-2">
              <ShieldCheck size={32} className="text-[#b90f0f]" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {forgotPasswordMode ? 'Reset Password' : 'Otorisasi Akses'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {forgotPasswordMode ? 'Masukkan email terdaftar Anda' : 'Silakan masuk untuk mengakses sistem Jerjhon ERP'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-950/50 border border-rose-900/50 rounded-xl flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-200 font-medium leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {bioSuccessMsg && (
            <div className="mb-6 p-4 bg-emerald-950/50 border border-emerald-800/50 rounded-xl flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-200 font-medium leading-relaxed">{bioSuccessMsg}</p>
            </div>
          )}

          {!forgotPasswordMode ? (
            <div className="space-y-6">
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 ml-1">Username / Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#b90f0f] focus:border-transparent transition-all"
                      placeholder="Masukkan username/email..."
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => { setForgotPasswordMode(true); setErrorMsg(''); setResetSuccess(false); setResetEmail(''); }}
                      className="text-[10px] text-rose-500 hover:text-rose-400 font-bold hover:underline"
                    >
                      Lupa Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#b90f0f] focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#b90f0f] to-rose-700 hover:from-rose-700 hover:to-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Memproses...
                    </span>
                  ) : (
                    'Masuk Sekarang'
                  )}
                </button>
              </form>



              {/* Biometric Login Button */}
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={loading}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 group active:scale-[0.99]"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <span>Masuk dengan Biometrik (Face ID / Fingerprint)</span>
              </button>

              {storedCreds.length > 0 && (
                <p className="text-[10px] text-center text-slate-400">
                  Terdeteksi {storedCreds.length} akun terdaftar biometrik pada perangkat ini
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {resetSuccess ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center gap-3 text-emerald-400 animate-fadeIn text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <p className="text-sm font-medium">
                    Tautan reset password telah berhasil dikirim. Silakan cek kotak masuk email Anda <strong>{resetEmail}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setForgotPasswordMode(false); setErrorMsg(''); setResetSuccess(false); setResetEmail(''); }}
                    className="mt-2 text-xs text-slate-300 hover:text-white underline font-medium"
                  >
                    Kembali ke halaman Login
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 ml-1">Email Terdaftar</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#b90f0f] focus:border-transparent transition-all"
                        placeholder="Masukkan alamat email Anda..."
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#b90f0f] to-rose-700 hover:from-rose-700 hover:to-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Memproses...
                      </span>
                    ) : (
                      'Kirim Tautan Reset'
                    )}
                  </button>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => { setForgotPasswordMode(false); setErrorMsg(''); }}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Batal & Kembali ke Login
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </main>

      {/* Biometric Pairing Modal if device has no registered biometrics */}
      {showSetupBioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Fingerprint size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Aktifkan Login Biometrik</h3>
                  <p className="text-[11px] text-slate-400">Hubungkan Face ID / Sidik Jari pada Perangkat Ini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupBioModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-4 leading-relaxed">
              Belum ada kredensial biometrik yang tersimpan di perangkat ini. Silakan konfirmasi akun dan password Anda sekali untuk mendaftarkan sensor Sidik Jari atau Face ID:
            </p>

            <form onSubmit={handleRegisterAndLoginBio} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Pilih Akun Pengguna</label>
                <select
                  value={bioUserId}
                  onChange={(e) => setBioUserId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Password Akun</label>
                <input
                  type="password"
                  value={bioPassword}
                  onChange={(e) => setBioPassword(e.target.value)}
                  placeholder="Masukkan password akun Anda..."
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Tipe Sensor Biometrik Perangkat</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBioType('fingerprint')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      bioType === 'fingerprint'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Fingerprint size={16} /> Sidik Jari
                  </button>
                  <button
                    type="button"
                    onClick={() => setBioType('face')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      bioType === 'face'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <ScanFace size={16} /> Face ID
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {loading ? 'Mendaftarkan Sensor Biometrik...' : 'Daftarkan Sensor Biometrik & Masuk'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <footer className="relative z-10 px-6 py-3 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
        © 2026 PT JERJHON ENTERPRISE INDONESIA • All Rights Reserved • Secure ERP Auth
      </footer>
    </div>
  );
};
