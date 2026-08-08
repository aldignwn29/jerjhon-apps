import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Plus, 
  CheckCircle2, 
  Building, 
  Star, 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  DollarSign, 
  ShoppingBag, 
  ChevronRight, 
  Sparkles, 
  Calendar, 
  ClipboardList, 
  AlertCircle,
  X,
  TrendingUp,
  Download,
  Check,
  Building2,
  Phone,
  Mail,
  Sliders,
  Award,
  Trash2
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { PurchaseOrder, Supplier, ProductItem } from '../../../types';

interface POItem {
  name: string;
  type: 'Bahan Baku' | 'Produk Jadi';
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

// Extend PurchaseOrder to handle optional items array
interface ExtendedPurchaseOrder extends PurchaseOrder {
  items?: POItem[];
  notes?: string;
}

export const PurchasingSupplierView: React.FC = () => {
  const { 
    purchaseOrders, 
    suppliers, 
    products,
    rawMaterialGroups,
    addPurchaseOrder, 
    formatIDR, 
    isStaff,
    isManager,
    isAdmin,
    addAuditLog,
    addNotification,
    currentUser
  } = useERP();

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'po_list' | 'create_po' | 'suppliers'>('po_list');

  // Search & Filter state
  const [poSearch, setPoSearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('all');
  const [poPayFilter, setPoPayFilter] = useState('all');
  const [supplierSearch, setSupplierSearch] = useState('');

  // Custom Local Notification state (alternative to standard window.alert)
  const [localNotification, setLocalNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const triggerNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setLocalNotification({ type, message });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setLocalNotification(null);
    }, 6000);
  };

  // State for custom delete confirmation modal
  const [poToDeleteId, setPoToDeleteId] = useState<string | null>(null);

  // Selected PO for detailed modal
  const [selectedPO, setSelectedPO] = useState<ExtendedPurchaseOrder | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Form State - Add New Supplier
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'Tekstil & Jersey Fabric',
    rating: 5,
  });
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);

  // Form State - Create PO (Multi-Item!)
  const [poSupplier, setPoSupplier] = useState<string>(suppliers[0]?.name || '');
  const [poExpectedDelivery, setPoExpectedDelivery] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  );
  const [poNotes, setPoNotes] = useState<string>('');
  
  // Multi-item rows state
  const [poRows, setPoRows] = useState<{
    id: string;
    name: string;
    type: 'Bahan Baku' | 'Produk Jadi';
    quantity: number;
    unit: string;
    unitPrice: number;
  }[]>([
    { id: '1', name: '', type: 'Bahan Baku', quantity: 100, unit: 'Pcs', unitPrice: 50000 }
  ]);

  // Extract all available raw material names from groups
  const availableRawMaterialsList = useMemo(() => {
    const listSet = new Set<string>();
    (rawMaterialGroups || []).forEach(g => {
      (g.materials || []).forEach(m => {
        if (m.name) listSet.add(m.name);
      });
    });
    // Add default materials if list is empty
    if (listSet.size === 0) {
      listSet.add('Jersey Polyester Premium');
      listSet.add('YKK Zipper Premium 15cm');
      listSet.add('Inks Sublimation Cyan C60');
      listSet.add('Inks Sublimation Magenta M60');
    }
    return Array.from(listSet);
  }, [rawMaterialGroups]);

  // Handle PO Row operations
  const handleAddRow = () => {
    setPoRows(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', type: 'Bahan Baku', quantity: 10, unit: 'Pcs', unitPrice: 10000 }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (poRows.length === 1) return;
    setPoRows(prev => prev.filter(r => r.id !== id));
  };

  const handleRowChange = (id: string, field: string, value: any) => {
    setPoRows(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value };
        // Auto set unit price and unit if catalog product is selected
        if (field === 'name') {
          if (r.type === 'Produk Jadi') {
            const matchedProd = products.find(p => p.name === value);
            if (matchedProd) {
              updated.unitPrice = matchedProd.unitCostPrice || matchedProd.sellingPrice * 0.6;
              updated.unit = matchedProd.unit || 'Pcs';
            }
          }
        }
        return updated;
      }
      return r;
    }));
  };

  // Live total calculation for PO form
  const computedPOTotal = useMemo(() => {
    return poRows.reduce((acc, r) => acc + (r.quantity * r.unitPrice), 0);
  }, [poRows]);

  // Filtered PO list
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchSearch = 
        po.poNumber.toLowerCase().includes(poSearch.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(poSearch.toLowerCase());

      const matchStatus = poStatusFilter === 'all' || po.approvalStatus === poStatusFilter;
      const matchPay = poPayFilter === 'all' || po.paymentStatus === poPayFilter;

      return matchSearch && matchStatus && matchPay;
    });
  }, [purchaseOrders, poSearch, poStatusFilter, poPayFilter]);

  // Filtered Suppliers list
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      return (
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(supplierSearch.toLowerCase())
      );
    });
  }, [suppliers, supplierSearch]);

  // Stats
  const poStats = useMemo(() => {
    const totalCount = purchaseOrders.length;
    const totalSpend = purchaseOrders.reduce((acc, po) => acc + po.totalAmount, 0);
    const pendingApproval = purchaseOrders.filter(po => po.approvalStatus === 'Pending').length;
    const unpaidCount = purchaseOrders.filter(po => po.paymentStatus === 'Belum Dibayar').length;

    return {
      totalCount,
      totalSpend,
      pendingApproval,
      unpaidCount
    };
  }, [purchaseOrders]);

  // Create PO Submit Handler
  const handleCreatePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplier || poRows.some(r => !r.name) || computedPOTotal <= 0) {
      triggerNotification('error', 'Harap lengkapi semua baris item pembelian!');
      return;
    }

    try {
      const formattedItems: POItem[] = poRows.map(r => ({
        name: r.name,
        type: r.type,
        quantity: r.quantity,
        unit: r.unit,
        unitPrice: r.unitPrice,
        subtotal: r.quantity * r.unitPrice
      }));

      const newPoId = `PO-${Date.now().toString().slice(-6)}`;
      const poNum = `PO/JJ/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;

      const newPO: ExtendedPurchaseOrder = {
        id: newPoId,
        poNumber: poNum,
        supplierName: poSupplier,
        orderDate: new Date().toISOString().substring(0, 10),
        expectedDelivery: poExpectedDelivery,
        totalAmount: computedPOTotal,
        paymentStatus: 'Belum Dibayar',
        approvalStatus: 'Pending',
        itemsCount: poRows.length,
        items: formattedItems,
        notes: poNotes
      };

      // Save PO directly to local state
      addPurchaseOrder(newPO);

      // Save audit log & notifications
      addAuditLog('CREATE_PURCHASE_ORDER', 'Purchasing', `Created Multi-Item PO ${poNum} for supplier ${poSupplier}`);
      addNotification(
        'Pengajuan PO Baru',
        `Purchase Order ${poNum} telah diajukan dan menunggu approval pimpinan.`,
        'warning',
        'PurchasingSupplierView'
      );

      // Reset
      setPoRows([{ id: '1', name: '', type: 'Bahan Baku', quantity: 100, unit: 'Pcs', unitPrice: 50000 }]);
      setPoNotes('');
      setActiveTab('po_list');
      triggerNotification('success', `Purchase Order ${poNum} berhasil diajukan!`);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Gagal membuat Purchase Order.');
    }
  };

  // Add New Supplier Handler
  const handleAddSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.contactPerson || isSubmittingSupplier) return;

    setIsSubmittingSupplier(true);
    try {
      const codeNum = suppliers.length + 1;
      const supplierCode = `VND-${codeNum.toString().padStart(2, '0')}`;
      const newSupplierId = `SUPP-${Date.now().toString().slice(-5)}`;

      const newSupplier: Supplier = {
        id: newSupplierId,
        code: supplierCode,
        name: supplierForm.name,
        contactPerson: supplierForm.contactPerson,
        phone: supplierForm.phone,
        email: supplierForm.email,
        category: supplierForm.category,
        rating: supplierForm.rating,
        totalPurchases: 0
      };

      const updatedSuppliers = [...suppliers, newSupplier];
      localStorage.setItem('jerjhon_suppliers', JSON.stringify(updatedSuppliers));

      addAuditLog('CREATE_SUPPLIER', 'Purchasing', `Added vendor supplier: ${supplierForm.name}`);
      addNotification(
        'Supplier Ditambahkan',
        `Vendor baru ${supplierForm.name} telah terdaftar dalam sistem.`,
        'success',
        'PurchasingSupplierView'
      );

      setShowAddSupplierModal(false);
      setSupplierForm({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        category: 'Tekstil & Jersey Fabric',
        rating: 5,
      });
      triggerNotification('success', 'Supplier baru berhasil didaftarkan!');
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Gagal menyimpan data supplier.');
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  // Update PO Approval / Payment states
  const handleUpdatePOStatus = async (approval: 'Approved' | 'Pending' | 'Rejected', payment: 'Lunas' | 'Partial' | 'Belum Dibayar') => {
    if (!selectedPO) return;
    setIsUpdatingStatus(true);
    try {
      const updatedPO = {
        ...selectedPO,
        approvalStatus: approval,
        paymentStatus: payment
      };

      const updatedList = purchaseOrders.map((p: any) => p.id === selectedPO.id ? updatedPO : p);
      localStorage.setItem('jerjhon_purchaseOrders', JSON.stringify(updatedList));

      // If PO status changed to Approved, automatically issue notification
      if (approval === 'Approved' && selectedPO.approvalStatus !== 'Approved') {
        addNotification(
          'Purchase Order Disetujui',
          `PO ${selectedPO.poNumber} telah disetujui pimpinan dan siap diproses ke Supplier.`,
          'success',
          'PurchasingSupplierView'
        );
      }

      // Add audit log
      addAuditLog(
        'UPDATE_PURCHASE_ORDER', 
        'Purchasing', 
        `Updated status of PO ${selectedPO.poNumber} to Approval: ${approval}, Payment: ${payment}`
      );

      setSelectedPO(updatedPO);
      triggerNotification('success', 'Status Purchase Order berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Gagal memperbarui status PO.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete Purchase Order (without standard confirm box)
  const handleDeletePO = async (poId: string) => {
    try {
      const updatedList = purchaseOrders.filter((p: any) => p.id !== poId);
      localStorage.setItem('jerjhon_purchaseOrders', JSON.stringify(updatedList));
      addAuditLog('DELETE_PURCHASE_ORDER', 'Purchasing', `Archived/Deleted PO with ID ${poId}`);
      setSelectedPO(null);
      setPoToDeleteId(null);
      triggerNotification('success', 'PO berhasil dihapus.');
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Gagal menghapus PO.');
    }
  };

  return (
    <div className="space-y-6">
      <RoleAccessBanner moduleName="Purchasing & Procurement" />

      {localNotification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold animate-fade-in ${
          localNotification.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300' 
            : localNotification.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300'
              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {localNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : localNotification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            ) : (
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <span>{localNotification.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => setLocalNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-red-800 to-red-950 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-red-700/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-red-500/25 text-red-200 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-red-500/30">
                Procurement Management
              </span>
              <span className="bg-emerald-500/25 text-emerald-200 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Vendor Integrated
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Purchasing, PO & Supplier Vendor</h2>
            <p className="text-slate-200 text-xs max-w-xl">
              {isStaff 
                ? 'Kelola pengajuan PR/PO, tambahkan daftar supplier baru, & lacak approval pembelian bahan baku produksi.' 
                : 'Penerbitan PO multi-item otomatis, approval order bahan baku, integrasi HPP produk jadi, & performa vendor.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('po_list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'po_list' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              Daftar PO
            </button>
            <button 
              onClick={() => setActiveTab('create_po')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'create_po' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              Buat PO (Multi-Item)
            </button>
            <button 
              onClick={() => setActiveTab('suppliers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'suppliers' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              Supplier Directory
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Total Spend PO</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-950 dark:text-white">{formatIDR(poStats.totalSpend)}</span>
          </div>
          <p className="text-[10px] text-slate-400">Total belanja pengadaan yang diajukan</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-amber-500 font-bold block">Menunggu Approval</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{poStats.pendingApproval}</span>
            <span className="text-xs text-slate-500">PO</span>
          </div>
          <p className="text-[10px] text-slate-400">Memerlukan tanda tangan SPV/Pimpinan</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-red-500 font-bold block">Belum Terbayar</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600 dark:text-red-400">{poStats.unpaidCount}</span>
            <span className="text-xs text-slate-500">Invoice</span>
          </div>
          <p className="text-[10px] text-slate-400">Tagihan supplier yang belum dilunasi finance</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold block">Jumlah Vendor Aktif</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{suppliers.length}</span>
            <span className="text-xs text-slate-500">Mitra</span>
          </div>
          <p className="text-[10px] text-slate-400">Supplier/vendor terdaftar draf resmi</p>
        </div>
      </div>

      {/* Main Sections */}
      {activeTab === 'po_list' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-red-600" />
                Arsip & Kontrol Purchase Orders (PO) Resmi
              </h3>
              <p className="text-[11px] text-slate-500">Lacak, cetak nota, dan ubah status pengadaan bahan baku konveksi Jerjhon.</p>
            </div>

            <button
              onClick={() => setActiveTab('create_po')}
              className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Buat PO Baru
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-750 text-xs">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari PO Number, Supplier..."
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <select
                value={poStatusFilter}
                onChange={(e) => setPoStatusFilter(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="all">Semua Status Approval</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending Approval</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <select
                value={poPayFilter}
                onChange={(e) => setPoPayFilter(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="all">Semua Status Bayar</option>
                <option value="Lunas">Lunas</option>
                <option value="Partial">Partial Paid</option>
                <option value="Belum Dibayar">Belum Dibayar</option>
              </select>
            </div>
          </div>

          {/* PO Table */}
          <div className="overflow-x-auto border border-slate-100 dark:border-slate-750 rounded-xl">
            <table className="whitespace-nowrap min-w-full w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-750 text-slate-500 font-bold">
                  <th className="p-3">Nomor PO</th>
                  <th className="p-3">Supplier Vendor</th>
                  <th className="p-3">Tanggal PO</th>
                  <th className="p-3">Estimasi Delivery</th>
                  <th className="p-3 text-right">Total Nilai (Rp)</th>
                  <th className="p-3">Status Bayar</th>
                  <th className="p-3">Status Approval</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Tidak ada Purchase Order yang terdaftar atau cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                      <td className="p-3 font-mono font-extrabold text-[#b90f0f]">{po.poNumber}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-950 dark:text-white">{po.supplierName}</div>
                        <span className="text-[10px] text-slate-400 block">{po.itemsCount} Unit Items</span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{po.orderDate}</td>
                      <td className="p-3 font-mono font-medium text-slate-600 dark:text-slate-300">
                        {po.expectedDelivery}
                      </td>
                      <td className="p-3 font-black text-right pr-6 text-slate-950 dark:text-white">
                        {formatIDR(po.totalAmount)}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                          po.paymentStatus === 'Lunas' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' :
                          po.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' :
                          'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                        }`}>
                          {po.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                          po.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' :
                          po.approvalStatus === 'Pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30' :
                          'bg-rose-50 text-rose-700 dark:bg-rose-950/30'
                        }`}>
                          {po.approvalStatus}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedPO(po)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-lg text-[10px] font-bold text-slate-700 dark:text-white transition-all cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" /> Detail Nota PO
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'create_po' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-red-600" />
              Buat Purchase Order (PO) Bahan Baku / Produk Jadi
            </h3>
            <p className="text-[11px] text-slate-500">Pilih supplier vendor, lalu tentukan item apa saja yang ingin Anda beli dengan rincian biaya satuan dan kuantitas.</p>
          </div>

          <form onSubmit={handleCreatePOSubmit} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Supplier Vendor</label>
                <select
                  value={poSupplier}
                  onChange={(e) => setPoSupplier(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl font-bold"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>
                      [{s.code}] {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Estimasi Tanggal Pengiriman</label>
                <input
                  type="date"
                  value={poExpectedDelivery}
                  onChange={(e) => setPoExpectedDelivery(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Metode / Catatan Tambahan PO</label>
                <input
                  type="text"
                  placeholder="Contoh: DP 50%, sisanya COD 7 Hari Kerja"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl"
                />
              </div>
            </div>

            {/* Dynamic Items Rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                  Daftar Barang yang Dibeli
                </span>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Baris Barang
                </button>
              </div>

              <div className="space-y-2">
                {poRows.map((row, index) => (
                  <div key={row.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-750 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Tipe Item</label>
                      <select
                        value={row.type}
                        onChange={(e) => {
                          handleRowChange(row.id, 'type', e.target.value);
                          handleRowChange(row.id, 'name', '');
                        }}
                        className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg font-medium"
                      >
                        <option value="Bahan Baku">Bahan Baku</option>
                        <option value="Produk Jadi">Produk Jadi</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Pilih Item</label>
                      {row.type === 'Bahan Baku' ? (
                        <select
                          value={row.name}
                          onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                          required
                          className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg font-bold"
                        >
                          <option value="">-- Pilih Bahan Baku --</option>
                          {availableRawMaterialsList.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={row.name}
                          onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                          required
                          className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg font-bold"
                        >
                          <option value="">-- Pilih Catalog Produk --</option>
                          {products.map((p, idx) => (
                            <option key={`${p.id}-${p.sku || ''}-${idx}`} value={p.name}>[{p.sku}] {p.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="sm:col-span-1.5 col-span-4">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Kuantitas</label>
                      <input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) => handleRowChange(row.id, 'quantity', Number(e.target.value))}
                        required
                        className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-center font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-1 col-span-4">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Satuan</label>
                      <input
                        type="text"
                        value={row.unit}
                        onChange={(e) => handleRowChange(row.id, 'unit', e.target.value)}
                        required
                        placeholder="Pcs"
                        className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-center font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-2 col-span-4">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Harga Satuan (Rp)</label>
                      <input
                        type="number"
                        min={0}
                        value={row.unitPrice}
                        onChange={(e) => handleRowChange(row.id, 'unitPrice', Number(e.target.value))}
                        required
                        className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-1 flex items-center justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={poRows.length === 1}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg disabled:opacity-30 cursor-pointer"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-semibold text-xs text-slate-800 dark:text-slate-200">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Total Estimasi Anggaran Pembelian
              </span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Total Biaya PO:</span>
                <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                  {formatIDR(computedPOTotal)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-slate-750">
              <button
                type="button"
                onClick={() => {
                  setPoRows([{ id: '1', name: '', type: 'Bahan Baku', quantity: 100, unit: 'Pcs', unitPrice: 50000 }]);
                  setPoNotes('');
                  setActiveTab('po_list');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-xl font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Ajukan PO & Kirim Approval
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-red-600" />
                Master Direktori Supplier & Penilaian Kinerja Vendor
              </h3>
              <p className="text-[11px] text-slate-500">Daftar legal produsen bahan mentah, kain jersey, printing ink sublimation, dan kemasan box.</p>
            </div>

            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Daftarkan Supplier Baru
            </button>
          </div>

          {/* Search bar */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari supplier, produk, penanggung jawab..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredSuppliers.map((s) => (
              <div key={s.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] bg-red-50 text-red-700 dark:bg-red-950/20 px-2 py-0.5 rounded font-extrabold border border-red-100 dark:border-red-900/30">
                        {s.code}
                      </span>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">{s.name}</h4>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-500 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-amber-100 dark:border-amber-900 shrink-0">
                      <Star className="w-3 h-3 fill-amber-400" /> {s.rating.toFixed(1)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">Kategori: {s.category}</p>

                  <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-1 text-[11px] text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.phone} ({s.contactPerson})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Total PO yang Terbit:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {s.totalPurchases || 0} Kali
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PO Details Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedPO(null)}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo and invoice style */}
            <div className="flex items-start justify-between border-b pb-4 dark:border-slate-750 text-xs">
              <div className="space-y-1">
                <span className="text-[#b90f0f] font-black text-lg tracking-wider">JERJHON CORP ERP</span>
                <p className="text-slate-400 text-[10px]">PT. Jerjhon Jersey Indonesia<br />Sistem Procurement Terintegrasi</p>
              </div>
              <div className="text-right space-y-0.5">
                <span className="font-extrabold text-xs uppercase tracking-widest text-slate-400 block">Purchase Order (PO)</span>
                <span className="font-mono font-black text-[#b90f0f] block text-sm">{selectedPO.poNumber}</span>
                <span className="font-mono text-slate-400 text-[10px] block">Issued: {selectedPO.orderDate}</span>
              </div>
            </div>

            {/* Vendor & Details */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b pb-4 dark:border-slate-750">
              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Supplier Vendor</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm block">{selectedPO.supplierName}</span>
                <span>Estimasi Tgl Pengiriman: {selectedPO.expectedDelivery}</span>
                {selectedPO.notes && <p className="text-[11px] italic bg-slate-50 dark:bg-slate-800 p-2 rounded-lg mt-1 border">Catatan: {selectedPO.notes}</p>}
              </div>

              <div className="text-right space-y-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Status Approval</span>
                  <span className={`inline-block px-3 py-1 rounded-full font-bold text-[10px] ${
                    selectedPO.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' :
                    selectedPO.approvalStatus === 'Pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30' :
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/30'
                  }`}>
                    {selectedPO.approvalStatus}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Status Pembayaran</span>
                  <span className={`inline-block px-3 py-1 rounded-full font-bold text-[10px] ${
                    selectedPO.paymentStatus === 'Lunas' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' :
                    selectedPO.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30' :
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/30'
                  }`}>
                    {selectedPO.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Rincian Item Pembelian</span>
              <div className="border border-slate-100 dark:border-slate-750 rounded-xl overflow-x-auto text-xs">
                <table className="min-w-full w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-750 font-bold text-slate-500">
                      <th className="p-2.5">Nama Item</th>
                      <th className="p-2.5 text-center">Tipe</th>
                      <th className="p-2.5 text-center">Jumlah (Qty)</th>
                      <th className="p-2.5 text-right">Harga Satuan</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-750 font-medium">
                    {selectedPO.items && selectedPO.items.length > 0 ? (
                      selectedPO.items.map((item, index) => (
                        <tr key={index}>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                          <td className="p-2.5 text-center">
                            <span className="bg-slate-100 dark:bg-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded text-slate-500">
                              {item.type}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-mono">{item.quantity} {item.unit || 'Pcs'}</td>
                          <td className="p-2.5 text-right font-mono">{formatIDR(item.unitPrice)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">{formatIDR(item.subtotal)}</td>
                        </tr>
                      ))
                    ) : (
                      // Compatibility Fallback
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white">Pembelian Bahan Baku & Perlengkapan Konveksi</td>
                        <td className="p-2.5 text-center">
                          <span className="bg-slate-100 dark:bg-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded text-slate-500">
                            Bahan Baku
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono">{selectedPO.itemsCount} Lot</td>
                        <td className="p-2.5 text-right font-mono">--</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">{formatIDR(selectedPO.totalAmount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Price */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">TOTAL SELURUHNYA (NETTO):</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                {formatIDR(selectedPO.totalAmount)}
              </span>
            </div>

            {/* Approval Controls for Managers & Admins */}
            {(isManager || isAdmin) && (
              <div className="p-4 bg-red-50/50 dark:bg-red-950/15 rounded-2xl border border-red-100 dark:border-red-900/30 space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                  Panel Approval & Otorisasi Pimpinan
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Setel Status Approval</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdatePOStatus('Approved', selectedPO.paymentStatus)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          selectedPO.approvalStatus === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Set Approved
                      </button>
                      <button
                        onClick={() => handleUpdatePOStatus('Rejected', selectedPO.paymentStatus)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          selectedPO.approvalStatus === 'Rejected' ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Set Rejected
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Setel Status Pembayaran</label>
                    <select
                      value={selectedPO.paymentStatus}
                      onChange={(e) => handleUpdatePOStatus(selectedPO.approvalStatus, e.target.value as any)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg font-bold"
                    >
                      <option value="Belum Dibayar">Belum Dibayar</option>
                      <option value="Partial">Partial Paid</option>
                      <option value="Lunas">Lunas</option>
                    </select>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setPoToDeleteId(selectedPO.id)}
                      className="text-rose-600 hover:text-rose-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus/Arsipkan PO Ini
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1">
              <Building className="w-5 h-5 text-red-600" />
              Daftarkan Supplier Baru
            </h3>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Perusahaan / Supplier</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT. Sinar Garment Textile"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">PIC Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Kontak"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">No. Telp / HP</label>
                  <input
                    type="text"
                    required
                    placeholder="0812XXXXXXXX"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Email Resmi</label>
                <input
                  type="email"
                  placeholder="admin@supplier.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori Vendor</label>
                  <select
                    value={supplierForm.category}
                    onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl"
                  >
                    <option value="Tekstil & Jersey Fabric">Tekstil & Jersey Fabric</option>
                    <option value="Printing Ink Sublimation">Printing Ink Sublimation</option>
                    <option value="Aksesoris & Zipper">Aksesoris & Zipper</option>
                    <option value="Packaging & Kemasan Box">Packaging & Kemasan Box</option>
                    <option value="Logistik Ekspedisi">Logistik Ekspedisi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Evaluasi Awal Rating</label>
                  <select
                    value={supplierForm.rating}
                    onChange={(e) => setSupplierForm({ ...supplierForm, rating: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl font-bold text-amber-500"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                    <option value={3}>⭐⭐⭐ (3/5)</option>
                    <option value={2}>⭐⭐ (2/5)</option>
                    <option value={1}>⭐ (1/5)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-slate-750">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupplier}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmittingSupplier ? 'Mendaftarkan...' : 'Daftarkan Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {poToDeleteId && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 text-xs text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Hapus Purchase Order?
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus Purchase Order ini secara permanen dari arsip sistem? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPoToDeleteId(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-xl font-bold text-slate-700 dark:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeletePO(poToDeleteId)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
