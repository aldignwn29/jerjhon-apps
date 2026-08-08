import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface RoleAccessBannerProps {
  moduleName?: string;
  onOpenRoleSwitcher?: () => void;
}

export const RoleAccessBanner: React.FC<RoleAccessBannerProps> = ({ moduleName }) => {
  const { currentUser, isStaff } = useERP();

  if (!currentUser) return null;

  return (
    <div className={`mb-6 p-4 sm:p-5 rounded-3xl border backdrop-blur-xl transition-all shadow-xs ${
      isStaff 
        ? 'bg-amber-500/10 border-amber-300/40 text-amber-950 dark:text-amber-200 dark:border-amber-900/40' 
        : 'bg-emerald-500/10 border-emerald-300/40 text-emerald-950 dark:text-emerald-200 dark:border-emerald-900/40'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-2xl mt-0.5 sm:mt-0 shrink-0 ${
            isStaff ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
          }`}>
            {isStaff ? <Lock className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm">
                Mode Hak Akses: <span className="underline decoration-wavy underline-offset-4">{currentUser.role}</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                isStaff 
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300' 
                  : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              }`}>
                {isStaff ? 'STAF OPERASIONAL' : 'MANAGER / EXECUTIVE'}
              </span>
            </div>
            <p className="text-xs font-medium opacity-90 mt-1 leading-relaxed">
              {isStaff 
                ? `Tampilan ${moduleName || 'halaman'} ini disesuaikan khusus untuk Staf. Informasi sensitif (gaji direksi, jurnal internal, laba rugi) disembunyikan.`
                : `Anda memiliki akses kontrol penuh & pengubahan data di modul ${moduleName || 'ini'}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

