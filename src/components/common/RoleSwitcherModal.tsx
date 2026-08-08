import React, { useState } from 'react';
import { X, ShieldCheck, User, Check, Building2, KeyRound, LogOut, ArrowLeft, Lock, Loader2 } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { User as UserType } from '../../types';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { users, employees, currentUser, setCurrentUser, addAuditLog, logout, sha256 } = useERP();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSelectUser = (user: UserType) => {
    if (currentUser?.id === user.id) {
      onClose();
      return;
    }
    setSelectedUser(user);
    setPassword('');
    setError('');
  };

  const handleVerifyAndSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUser) return;

    const hashedInput = sha256(password);
    // Simulation logic: check against user password or default 'jerjhon123'
    const userPassword = selectedUser.password || 'jerjhon123';
    
    if (password === userPassword || hashedInput === userPassword) {
      setIsVerifying(true);
      
      // Simulate network delay for better UX
      setTimeout(() => {
        const matchedEmp = (employees || []).find(
          e => e.id === selectedUser.id || 
               e.nik === selectedUser.id || 
               (e.email && selectedUser.email && e.email.toLowerCase().trim() === selectedUser.email.toLowerCase().trim()) || 
               e.name.toLowerCase().trim() === selectedUser.name.toLowerCase().trim() ||
               (selectedUser.role?.toLowerCase().includes('admin') && (
                 e.position?.toLowerCase().includes('admin') || 
                 e.email?.toLowerCase().includes('aldy') || 
                 e.name.toLowerCase().includes('ald')
               ))
        );
        const avatarUrl = matchedEmp?.avatar || selectedUser.avatar;
        setCurrentUser({ ...selectedUser, avatar: avatarUrl });
        addAuditLog('SWITCH_ROLE_SECURE', 'RBAC Security', `Switched active session to ${selectedUser.role} (${selectedUser.name}) after password verification`);
        setIsVerifying(false);
        setSelectedUser(null);
        onClose();
      }, 800);
    } else {
      setError('Password salah. Silakan coba lagi.');
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const resetSelection = () => {
    setSelectedUser(null);
    setPassword('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#b90f0f]/10 text-[#b90f0f]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                {selectedUser ? 'Verifikasi Keamanan' : 'Simulasi Hak Akses & Role (RBAC)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedUser 
                  ? `Masukkan password untuk @${selectedUser.username || selectedUser.name.split(' ')[0].toLowerCase()}`
                  : 'Pilih profil pengguna untuk menguji menu & permission per divisi'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!selectedUser ? (
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {(users || []).map((u) => {
              const isSelected = currentUser?.id === u.id;
              const matchedEmp = employees.find(
                e => e.id === u.id || 
                     e.nik === u.id || 
                     (e.email && u.email && e.email.toLowerCase().trim() === u.email.toLowerCase().trim()) || 
                     e.name.toLowerCase().trim() === u.name.toLowerCase().trim() ||
                     (u.role?.toLowerCase().includes('admin') && (
                       e.position?.toLowerCase().includes('admin') || 
                       e.email?.toLowerCase().includes('aldy') || 
                       e.name.toLowerCase().includes('ald')
                     ))
              );
              const avatarUrl = matchedEmp?.avatar || u.avatar;

              return (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-[#b90f0f]/10 border-[#b90f0f] shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-[#b90f0f]/30 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          {u.name}
                        </h4>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-md font-mono uppercase">
                          {u.username || u.id.split('-')[1] || u.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {u.department}
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="p-1.5 rounded-full bg-[#b90f0f] text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 space-y-6">
            {(() => {
              const matchedSelectedEmp = employees.find(
                e => e.id === selectedUser.id || 
                     e.nik === selectedUser.id || 
                     (e.email && selectedUser.email && e.email.toLowerCase().trim() === selectedUser.email.toLowerCase().trim()) || 
                     e.name.toLowerCase().trim() === selectedUser.name.toLowerCase().trim() ||
                     (selectedUser.role?.toLowerCase().includes('admin') && (
                       e.position?.toLowerCase().includes('admin') || 
                       e.email?.toLowerCase().includes('aldy') || 
                       e.name.toLowerCase().includes('ald')
                     ))
              );
              const selectedAvatarUrl = matchedSelectedEmp?.avatar || selectedUser.avatar;

              return (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={selectedAvatarUrl}
                    alt={selectedUser.name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-[#b90f0f]/10 shadow-lg"
                  />
                  <div className="text-center">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      {selectedUser.name}
                    </h3>
                    <p className="text-sm font-semibold text-[#b90f0f]">
                      {selectedUser.department}
                    </p>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleVerifyAndSwitch} className="space-y-4 max-w-sm mx-auto">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                  Password Konfirmasi
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    autoFocus
                    placeholder="Masukkan password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border ${
                      error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'
                    } rounded-2xl focus:ring-2 focus:ring-[#b90f0f]/20 focus:border-[#b90f0f] outline-none transition-all text-sm`}
                  />
                </div>
                {error && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1 ml-1">
                    {error}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 text-center mt-2 italic">
                  Tip: Gunakan password akun atau default "jerjhon123" / "admin123"
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetSelection}
                  disabled={isVerifying}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !password}
                  className="flex-[2] px-4 py-3 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-500/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Login & Pindah Role
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        {!selectedUser && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl text-xs font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" /> Keluar (Logout)
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
