import React from 'react';
import { Users, Award, ShoppingBag, Phone, Mail, Star } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';

export const CRMView: React.FC = () => {
  const { customers, formatIDR, isStaff } = useERP();

  return (
    <div className="space-y-6">
      <RoleAccessBanner moduleName="CRM & Database Pelanggan" />
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#b90f0f]" />
            {isStaff ? 'Direktori Pelanggan & Loyalty' : 'Customer Relationship Management (CRM & Loyalty Points)'}
          </h2>
          <p className="text-xs text-slate-500">
            {isStaff ? 'Lihat daftar pelanggan, riwayat belanja, dan poin loyalitas mereka.' : 'Database Segmen Pelanggan (VIP, Regular, Wholesale), Riwayat Pembelian & Poin Hadiah'}
          </p>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(customers || []).map((c) => (
          <div key={c.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono">{c.phone}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                c.segment === 'VIP' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {c.segment}
              </span>
            </div>

            <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border">
              <div className="flex justify-between"><span>Total Transaksi:</span><span className="font-bold">{c.totalOrders} Order</span></div>
              <div className="flex justify-between"><span>Total Omset Spent:</span><span className="font-bold text-emerald-600">{formatIDR(c.totalSpent)}</span></div>
              <div className="flex justify-between"><span>Loyalty Points:</span><span className="font-extrabold text-[#b90f0f]">{c.loyaltyPoints} Poin</span></div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
