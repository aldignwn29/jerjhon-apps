import React, { useState } from 'react';
import { useERP } from '../../../context/ERPContext';
import { User as UserIcon, Lock, ShieldCheck, AlertCircle, Fingerprint, ScanFace, CheckCircle2, X } from 'lucide-react';
import { 
  authenticateWebAuthnBiometric, 
  getStoredBiometricCreds, 
  registerWebAuthnBiometric 
} from '../../../lib/webauthn';

export const MobileLogin: React.FC = () => {
  const { users, loginWithCredentials, loginDirect } = useERP();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Biometric registration modal state on mobile login page
  const [showSetupBioModal, setShowSetupBioModal] = useState(false);
  const [bioUserId, setBioUserId] = useState<string>('');
  const [bioPassword, setBioPassword] = useState('');
  const [bioType, setBioType] = useState<'fingerprint' | 'face'>('fingerprint');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
        setError('Harap isi username/email dan password.');
        return;
    }
    setLoading(true);
    setError('');
    const result = await loginWithCredentials(username, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

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
        setSuccessMsg(res.message);
        setTimeout(() => {
          loginDirect(res.user!);
        }, 800);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Gagal autentikasi biometrik.');
    }
  };

  const handleRegisterAndLoginBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const selectedUser = users.find(u => u.id === bioUserId);
    if (!selectedUser) {
      setError('Pengguna tidak ditemukan.');
      return;
    }

    setLoading(true);
    const loginCheck = await loginWithCredentials(selectedUser.username || selectedUser.email, bioPassword);
    if (!loginCheck.success) {
      setLoading(false);
      setError('Password salah atau akun tidak ditemukan.');
      return;
    }

    const regRes = await registerWebAuthnBiometric(selectedUser, bioType);
    setLoading(false);

    if (regRes.success) {
      setShowSetupBioModal(false);
      setSuccessMsg(regRes.message);
      setTimeout(() => {
        loginDirect(selectedUser);
      }, 800);
    } else {
      setError(regRes.message);
    }
  };

  const storedCreds = getStoredBiometricCreds();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-900 text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20 mb-1">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Human Capital <span className="text-blue-400">Mobile</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Sistem ERP Karyawan & Presensi Terpadu
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 ml-1">Username / Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Masukkan username atau email..."
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-slate-700"></div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Opsi Login Cepat</span>
          <div className="flex-1 h-px bg-slate-700"></div>
        </div>

        {/* Biometric Button */}
        <button
          type="button"
          onClick={handleBiometricLogin}
          disabled={loading}
          className="w-full bg-slate-700/80 hover:bg-slate-700 border border-slate-600 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2.5 shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
        >
          <Fingerprint className="w-5 h-5 text-blue-400" />
          <span>Masuk dengan Biometrik (Face ID / Fingerprint)</span>
        </button>

        {storedCreds.length > 0 && (
          <p className="text-[10px] text-center text-slate-400 font-medium">
            Terdeteksi {storedCreds.length} akun terdaftar biometrik di HP ini
          </p>
        )}
      </div>

      {/* Biometric Setup Modal for Mobile */}
      {showSetupBioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Fingerprint size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Aktifkan Biometrik HP</h3>
                  <p className="text-[11px] text-slate-400">Hubungkan Face ID / Sidik Jari</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupBioModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-4 leading-relaxed">
              Belum ada kredensial biometrik yang tersimpan di HP ini. Konfirmasi akun dan password Anda sekali untuk mendaftarkan Sidik Jari / Face ID:
            </p>

            <form onSubmit={handleRegisterAndLoginBio} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Pilih Akun Karyawan</label>
                <select
                  value={bioUserId}
                  onChange={(e) => setBioUserId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Tipe Sensor Biometrik HP</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBioType('fingerprint')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      bioType === 'fingerprint'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
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
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
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
    </div>
  );
};
