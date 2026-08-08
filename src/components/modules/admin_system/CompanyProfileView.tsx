import React, { useState } from 'react';
import { Building2, Save, MapPin, Phone, Mail, Globe, Receipt, ShieldCheck, Scale, FileText, Info, Database, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';

export const CompanyProfileView: React.FC = () => {
  const { companyProfile, updateCompanyProfile } = useERP();
  const [profile, setProfile] = useState({ ...companyProfile });
  const [logoPreview, setLogoPreview] = useState<string | null>(companyProfile.logoUrl || null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyProfile(profile);
    alert('Profil perusahaan berhasil diperbarui.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setProfile(prev => ({ ...prev, logoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNumChange = (field: keyof typeof profile, val: string) => {
    setProfile(prev => ({ ...prev, [field]: Number(val) }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#b90f0f]" />
            Profil Perusahaan & Pengaturan Pajak
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola Identitas Legal, Kontak, Sertifikasi, Tarif BPJS & Pajak Perusahaan.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all w-full sm:w-auto"
        >
          <Save className="w-4 h-4" /> Simpan Perubahan
        </button>
      </div>

      {/* Database Status Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Local Storage & State Persistence</h3>
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Fully Configured & Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem beroperasi dengan penyimpanan lokal berperforma tinggi dan terisolasi. Seluruh data tersimpan aman dan stabil tanpa kendala koneksi cloud.
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-400 font-mono">
          Engine: LocalStorage / Memory State
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Identitas Legal & Struktur */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-5 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Scale className="w-5 h-5 text-[#b90f0f]" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Identitas Legal Badan Usaha</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Logo Perusahaan</label>
              <div className="flex items-center gap-4">
                {logoPreview && <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain border rounded-lg" />}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nama Resmi Badan Usaha (PT/CV)</label>
              <input
                type="text"
                value={profile.legalName || ''}
                onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold focus:ring-1 focus:ring-[#b90f0f]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nama Brand (Commercial)</label>
              <input
                type="text"
                value={profile.brandName || profile.companyName || ''}
                onChange={(e) => setProfile({ ...profile, brandName: e.target.value, companyName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-[#b90f0f] focus:ring-1 focus:ring-[#b90f0f]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nama Direktur Utama</label>
              <input
                type="text"
                value={profile.directorName || ''}
                onChange={(e) => setProfile({ ...profile, directorName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium focus:ring-1 focus:ring-[#b90f0f]"
                placeholder="Misal: Budi Santoso"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">NPWP Perusahaan</label>
              <input
                type="text"
                value={profile.npwpCompany || profile.taxRegistrationNumber || ''}
                onChange={(e) => setProfile({ ...profile, npwpCompany: e.target.value, taxRegistrationNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono focus:ring-1 focus:ring-[#b90f0f]"
                placeholder="00.000.000.0-000.000"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nomor Induk Berusaha (NIB)</label>
              <input
                type="text"
                value={profile.nibNumber || ''}
                onChange={(e) => setProfile({ ...profile, nibNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono focus:ring-1 focus:ring-[#b90f0f]"
              />
            </div>
          </div>
        </div>

        {/* Info Kontak & Alamat */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-5 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <MapPin className="w-5 h-5 text-[#b90f0f]" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Informasi Kontak & Alamat HQ</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Alamat Lengkap</label>
              <textarea
                rows={2}
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium focus:ring-1 focus:ring-[#b90f0f] resize-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Kota</label>
              <input
                type="text"
                value={profile.city || ''}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium focus:ring-1 focus:ring-[#b90f0f]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Provinsi & Kode Pos</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Provinsi"
                  value={profile.province || ''}
                  onChange={(e) => setProfile({ ...profile, province: e.target.value })}
                  className="w-2/3 p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium focus:ring-1 focus:ring-[#b90f0f]"
                />
                <input
                  type="text"
                  placeholder="Kode"
                  value={profile.zipCode || ''}
                  onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
                  className="w-1/3 p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium focus:ring-1 focus:ring-[#b90f0f]"
                />
              </div>
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1"><Phone className="w-3.5 h-3.5"/> No. Telepon</label>
                <input
                  type="text"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium focus:ring-1 focus:ring-[#b90f0f]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1"><Mail className="w-3.5 h-3.5"/> Email Corporate</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium focus:ring-1 focus:ring-[#b90f0f]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1"><Globe className="w-3.5 h-3.5"/> Website</label>
                <input
                  type="text"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium focus:ring-1 focus:ring-[#b90f0f]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pengaturan Pajak & Asuransi */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-5 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Receipt className="w-5 h-5 text-[#b90f0f]" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Pengaturan Pajak & BPJS (%)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Tarif PPN (VAT)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={profile.vatTaxRate ?? profile.taxPpnRate ?? 11}
                  onChange={(e) => {
                    handleNumChange('vatTaxRate', e.target.value);
                    handleNumChange('taxPpnRate', e.target.value);
                  }}
                  className="w-full p-2.5 pr-8 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono font-bold focus:ring-1 focus:ring-[#b90f0f]"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Tarif PPh Badan</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={profile.taxCorporateRate ?? 22}
                  onChange={(e) => handleNumChange('taxCorporateRate', e.target.value)}
                  className="w-full p-2.5 pr-8 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono font-bold focus:ring-1 focus:ring-[#b90f0f]"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">BPJS Kesehatan (Perusahaan)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={profile.bpjsKesehatanRate ?? 4}
                  onChange={(e) => handleNumChange('bpjsKesehatanRate', e.target.value)}
                  className="w-full p-2.5 pr-8 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono font-bold focus:ring-1 focus:ring-[#b90f0f]"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">BPJS Ketenagakerjaan</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={profile.bpjsKetenagakerjaanRate ?? 4.24}
                  onChange={(e) => handleNumChange('bpjsKetenagakerjaanRate', e.target.value)}
                  className="w-full p-2.5 pr-8 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono font-bold focus:ring-1 focus:ring-[#b90f0f]"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
            </div>
            <div className="sm:col-span-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-[11px] text-blue-700 dark:text-blue-300 flex gap-2 items-start mt-2">
              <FileText className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Tarif PPN default adalah 11% (sesuai UU HPP) dan PPh Badan 22%. Pengaturan BPJS di atas adalah porsi tanggungan perusahaan (Employer Share).</p>
            </div>
          </div>
        </div>

        {/* Lokasi Kantor & Geofencing */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-5 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <MapPin className="w-5 h-5 text-[#b90f0f]" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Lokasi Kantor & Geofencing (HCM)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Office Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={profile.officeLat || ''}
                onChange={(e) => setProfile({ ...profile, officeLat: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono focus:ring-1 focus:ring-[#b90f0f]"
                placeholder="-6.123456"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Office Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={profile.officeLng || ''}
                onChange={(e) => setProfile({ ...profile, officeLng: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono focus:ring-1 focus:ring-[#b90f0f]"
                placeholder="106.123456"
              />
            </div>
            <div className="sm:col-span-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 flex gap-2 items-start mt-1">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Koordinat ini digunakan sebagai titik pusat absensi WFO dengan radius maksimal 1 km. Karyawan di luar radius ini akan otomatis tertolak sistem.</p>
            </div>
          </div>
        </div>

        {/* Sertifikasi */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-5 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <ShieldCheck className="w-5 h-5 text-[#b90f0f]" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Sertifikasi & Kepatuhan Standar</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Sertifikat Halal MUI / BPJPH</label>
              <input
                type="text"
                value={profile.halalCertificateNo || ''}
                onChange={(e) => setProfile({ ...profile, halalCertificateNo: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono focus:ring-1 focus:ring-[#b90f0f]"
                placeholder="ID00000000000000000"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Lisensi BPOM / GMP Cosmetics</label>
              <input
                type="text"
                value={profile.bpomLicenseNo || ''}
                onChange={(e) => setProfile({ ...profile, bpomLicenseNo: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono focus:ring-1 focus:ring-[#b90f0f]"
                placeholder="NA182XXXXXXX"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Mata Uang Sistem</label>
                <select
                  value={profile.currency || 'IDR'}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold focus:ring-1 focus:ring-[#b90f0f]"
                >
                  <option value="IDR">IDR (Rupiah)</option>
                  <option value="USD">USD (Dolar AS)</option>
                  <option value="SGD">SGD (Dolar SG)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
