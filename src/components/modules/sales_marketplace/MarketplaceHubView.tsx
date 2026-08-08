import React, { useState, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { 
  ShoppingCart, Store, Plus, Filter, ArrowUpRight, CheckCircle2, RefreshCw, 
  PackageCheck, Upload, Download, Trash2, Edit3, Search, Calendar, BarChart3, AlertTriangle, X, DollarSign, Info,
  TrendingUp, Wallet, PieChart, Activity, Layers, ArrowRight, MoreVertical, Eye, Package, Tag
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { ExportDropdown } from '../../common/ExportDropdown';
import { exportToCSV, exportToPDF } from '../../../utils/exportUtils';
import { ChannelType, MarketplaceOrder } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';

export const MarketplaceHubView: React.FC = () => {
  const { 
    marketplaceOrders, 
    addMarketplaceOrder, 
    updateMarketplaceOrder, 
    deleteMarketplaceOrder, 
    clearMarketplaceOrders, 
    formatIDR, 
    products, 
    isStaff 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'data' | 'summary' | 'analytics'>('data');
  const [selectedChannel, setSelectedChannel] = useState<string>('Semua Channel');
  const [selectedMonth, setSelectedMonth] = useState<string>('Semua Bulan');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeChannel = (ch: string): string => {
    const c = (ch || '').trim().toLowerCase();
    if (c.includes('tiktok') || c.includes('tik tok')) return 'TikTok Shop';
    if (c.includes('shopee')) return 'Shopee';
    if (c.includes('tokopedia') || c.includes('tokped')) return 'Tokopedia';
    if (c.includes('lazada')) return 'Lazada';
    if (c.includes('web')) return 'Website';
    if (c.includes('pos') || c.includes('retail') || c.includes('offline')) return 'POS Retail';
    return ch || 'Tokopedia';
  };

  const parseMonthToISO = (val: string) => {
    if (!val) return new Date().toISOString();
    const s = String(val).trim().toLowerCase();
    
    const indoMonths: Record<string, string> = {
      'januari': '01', 'jan': '01',
      'februari': '02', 'feb': '02',
      'maret': '03', 'mar': '03',
      'april': '04', 'apr': '04',
      'mei': '05', 'may': '05',
      'juni': '06', 'jun': '06',
      'juli': '07', 'jul': '07',
      'agustus': '08', 'ags': '08', 'aug': '08',
      'september': '09', 'sep': '09',
      'oktober': '10', 'okt': '10', 'oct': '10',
      'november': '11', 'nov': '11',
      'desember': '12', 'des': '12', 'dec': '12'
    };

    for (const [name, num] of Object.entries(indoMonths)) {
      if (s.includes(name)) {
        const yearMatch = s.match(/20\d{2}/);
        const year = yearMatch ? yearMatch[0] : '2026';
        return `${year}-${num}-01T00:00:00.000Z`;
      }
    }

    const yyyyMmMatch = s.match(/(20\d{2})[-/](\d{1,2})/);
    if (yyyyMmMatch) {
      const year = yyyyMmMatch[1];
      const month = yyyyMmMatch[2].padStart(2, '0');
      return `${year}-${month}-01T00:00:00.000Z`;
    }

    const mmYyyyMatch = s.match(/(\d{1,2})[-/](20\d{2})/);
    if (mmYyyyMatch) {
      const month = mmYyyyMatch[1].padStart(2, '0');
      const year = mmYyyyMatch[2];
      return `${year}-${month}-01T00:00:00.000Z`;
    }

    if (!isNaN(Date.parse(val))) {
      return new Date(val).toISOString();
    }

    return new Date().toISOString();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const aggregatedOrders = new Map<string, any>();
          
            results.data.forEach((row: any) => {
            const orderNo = row.OrderNumber || row.no_pesanan || row.order_number || `ORD-${Date.now().toString().slice(-6)}`;
            
            const existing = aggregatedOrders.get(orderNo);
            const qty = parseInt(row.Qty || row.qty_terjual || row.quantity) || 1;
            const normalPrice = parseInt(row.NormalPrice || row.normal_price || row.harga_normal) || 150000;
            const discountPctRaw = row.DiscountPct || row.discount_pct || row.diskon_persen || '0';
            const discountPct = parseFloat(String(discountPctRaw).replace('%', '')) || 0;
            const voucherDiscount = Math.round((normalPrice * discountPct) / 100);
            const gross = parseInt(row.GrossAmount || row.gross_amount || row.grossAmount) || ((normalPrice - voucherDiscount) * qty);
            const adminFeeRaw = row.AdminFee || row.biaya_admin || row.adminFee || '23';
            const adminFee = parseFloat(String(adminFeeRaw).replace('%', '')) || 23;
            const channel = normalizeChannel(row.Channel || row.channel || 'Tokopedia');
            const productName = row.Product || row.nama_produk || row.product_name || 'Jersey Sepeda Gowes';
            const variant = row.Variant || row.variasi || '-';
            const skuCode = row.SKU || row.sku || 'SKU-JJ-SRM50';
            const customerName = row.Customer || row.customer_name || 'Pelanggan Import';
            const status = row.Status || row.status || 'Selesai';
            const unitPrice = normalPrice;
            const monthRaw = row.Month || row.month || row.bulan || row.OrderDate || row.order_date || row.tanggal;
            const orderDate = parseMonthToISO(monthRaw);

            const foundProd = products.find(p => p.sku === skuCode);
            const defaultUnitCost = foundProd ? (foundProd.unitCostPrice || 85000) : 85000;
            const rowCogs = parseInt(row.COGS || row.cogs || row.cogs_total);
            const cogsVal = !isNaN(rowCogs) && rowCogs > 0 ? rowCogs : defaultUnitCost * qty;
            
            if (existing) {
                existing.quantity += qty;
                existing.grossAmount += gross;
                existing.cogs += cogsVal;
                if (!existing.productName.includes(productName)) {
                  existing.productName += `, ${productName}`;
                }
            } else {
                aggregatedOrders.set(orderNo, {
                  orderNumber: orderNo,
                  channel,
                  productName,
                  variant,
                  skuCode,
                  quantity: qty,
                  unitPrice,
                  grossAmount: gross,
                  marketplaceAdminFee: adminFee,
                  status,
                  customerName,
                  customerPhone: '-',
                  orderDate,
                  voucherDiscount,
                  adsCost: 0,
                  shippingFee: 0,
                  cogs: cogsVal,
                  paymentMethod: 'Bank Transfer'
                });
            }
          });
          
          aggregatedOrders.forEach((order) => {
            addMarketplaceOrder(order, true);
          });
          
          setShowImportModal(false);
          alert('✓ Data penjualan berhasil diimpor!');
        }
      });
    }
  };

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showProductReportModal, setShowProductReportModal] = useState<boolean>(false);
  const [productReportSearch, setProductReportSearch] = useState<string>('');
  const [editingOrder, setEditingOrder] = useState<MarketplaceOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
    channel: 'Tokopedia' as ChannelType,
    customerName: 'Pelanggan Setia Jerjhon',
    customerPhone: '+62 812-3456-7890',
    orderDate: '2026-06-15 10:00',
    skuCode: products[0]?.sku || 'SKU-JJ-SRM50',
    productName: products[0]?.name || 'Jersey Sepeda Jersey Gowes Kaos Sepeda Pria',
    quantity: 1,
    unitPrice: 150000,
    grossAmount: 150000,
    voucherDiscount: 0,
    marketplaceAdminFee: 23,
    adsCost: 5000,
    shippingFee: 15000,
    cogs: 85000,
    variant: 'Lengan Pendek- L',
    status: 'Selesai' as any,
    paymentMethod: 'GoPay' as any
  });

  // Category detector helper from SKU
  const getCategoryFromSku = (sku: string): string => {
    const cleanSku = (sku || '').trim().toLowerCase();
    const foundProd = products.find(p => p.sku.trim().toLowerCase() === cleanSku || cleanSku.includes(p.sku.trim().toLowerCase()));
    if (foundProd && foundProd.category) return foundProd.category;
    
    const parts = (sku || '').split('-');
    if (parts.length > 1) {
      const code = parts[1].toUpperCase();
      if (code === 'JJ' || code === 'JER') return 'Jersey & Apparel';
      if (code === 'SRM') return 'Skincare & Serum';
      if (code === 'CRM') return 'Cream & Skincare';
      if (code === 'SUN') return 'Sunscreen & Protection';
      if (code === 'SET') return 'Set Bundling Product';
      if (code === 'FAC') return 'Facial Wash & Cleanser';
      if (code === 'TON') return 'Toner & Essence';
      if (code === 'MOI') return 'Moisturizer & Hydration';
      if (code === 'ACT' || code === 'ACTV') return 'Activewear';
      if (code === 'ROK' || code === 'SKR') return 'Skirt & Bottoms';
      return `Kategori ${code}`;
    }
    return 'General Category';
  };

  const getFormattedMonth = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split(/[- :]/);
    if (parts.length >= 2) {
      const year = parts[0];
      const monthNum = parts[1];
      const monthNames: Record<string, string> = {
        '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
        '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
        '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
      };
      return `${monthNames[monthNum] || monthNum} ${year}`;
    }
    return dateStr;
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return marketplaceOrders.filter(o => {
      const normChannel = normalizeChannel(o.channel);
      const matchChannel = selectedChannel === 'Semua Channel' || normChannel === selectedChannel || (selectedChannel === 'TikTok Shop' && (normChannel === 'TikTok Shop' || o.channel === 'TikTok' || o.channel === 'TikTok Shop'));
      
      let matchMonth = true;
      if (selectedMonth === 'Semua Bulan') {
        matchMonth = true;
      } else if (selectedMonth === 'Tahun 2026') {
        matchMonth = o.orderDate && o.orderDate.includes('2026');
      } else if (selectedMonth === 'Q1 2026') {
        matchMonth = o.orderDate && (o.orderDate.includes('-01-') || o.orderDate.includes('-02-') || o.orderDate.includes('-03-'));
      } else if (selectedMonth === 'Q2 2026') {
        matchMonth = o.orderDate && (o.orderDate.includes('-04-') || o.orderDate.includes('-05-') || o.orderDate.includes('-06-'));
      } else if (selectedMonth === 'Q3 2026') {
        matchMonth = o.orderDate && (o.orderDate.includes('-07-') || o.orderDate.includes('-08-') || o.orderDate.includes('-09-'));
      } else if (selectedMonth === 'Q4 2026') {
        matchMonth = o.orderDate && (o.orderDate.includes('-10-') || o.orderDate.includes('-11-') || o.orderDate.includes('-12-'));
      } else if (selectedMonth === 'Juli 2026') {
        matchMonth = o.orderDate && o.orderDate.includes('2026-07');
      } else if (selectedMonth === 'Juni 2026') {
        matchMonth = o.orderDate && o.orderDate.includes('2026-06');
      } else if (selectedMonth === 'Mei 2026') {
        matchMonth = o.orderDate && o.orderDate.includes('2026-05');
      } else if (selectedMonth === 'April 2026') {
        matchMonth = o.orderDate && o.orderDate.includes('2026-04');
      } else if (selectedMonth === 'Maret 2026') {
        matchMonth = o.orderDate && o.orderDate.includes('2026-03');
      } else if (selectedMonth === 'Februari 2026') {
        matchMonth = o.orderDate && o.orderDate.includes('2026-02');
      } else if (selectedMonth === 'Januari 2026') {
        matchMonth = o.orderDate && o.orderDate.includes('2026-01');
      }

      const matchSearch = searchTerm === '' || 
        o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.skuCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchChannel && matchMonth && matchSearch;
    });
  }, [marketplaceOrders, selectedChannel, selectedMonth, searchTerm]);

  // Top 5 Best-Selling Products
  const top5Products = useMemo(() => {
    const source = filteredOrders.length > 0 ? filteredOrders : marketplaceOrders;
    const map: Record<string, { sku: string; name: string; totalQty: number; totalRevenue: number }> = {};
    source.forEach(o => {
      const key = o.skuCode || 'UNKNOWN';
      if (!map[key]) {
        map[key] = { sku: o.skuCode, name: o.productName, totalQty: 0, totalRevenue: 0 };
      }
      map[key].totalQty += (o.quantity || 1);
      map[key].totalRevenue += (o.grossAmount || 0);
    });
    return Object.values(map)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);
  }, [marketplaceOrders, filteredOrders]);

  // Top 20 Categories based on SKU
  const top20Categories = useMemo(() => {
    const source = filteredOrders.length > 0 ? filteredOrders : marketplaceOrders;
    const map: Record<string, { category: string; totalQty: number; totalRevenue: number }> = {};
    source.forEach(o => {
      const cat = getCategoryFromSku(o.skuCode);
      if (!map[cat]) {
        map[cat] = { category: cat, totalQty: 0, totalRevenue: 0 };
      }
      map[cat].totalQty += (o.quantity || 1);
      map[cat].totalRevenue += (o.grossAmount || 0);
    });
    return Object.values(map)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 20);
  }, [marketplaceOrders, filteredOrders, products]);

  const getAdminFeePct = (feeVal: number | undefined, channel: string) => {
    const isApplicable = ['Shopee', 'Tokopedia', 'Lazada', 'TikTok Shop'].includes(channel);
    if (!isApplicable) return 0;
    const val = feeVal !== undefined && !isNaN(feeVal) ? feeVal : 23;
    if (val > 1) {
      if (val <= 100) return val / 100;
      return 0.23;
    }
    return val;
  };

  // Metrics calculation
  const stats = useMemo(() => {
    const metricsSource = filteredOrders.length > 0 ? filteredOrders : marketplaceOrders;
    const totalRevenue = metricsSource.reduce((acc, o) => acc + (o.grossAmount || 0), 0);
    const totalCogs = metricsSource.reduce((acc, o) => {
      const cogsUnit = Math.round((o.cogs || 0) / (o.quantity || 1));
      const cogsTotal = cogsUnit * (o.quantity || 1);
      return acc + cogsTotal;
    }, 0);
    const netRevenue = metricsSource.reduce((acc, o) => {
      const normalPrice = o.unitPrice || 150000;
      const discountRp = o.voucherDiscount || 0;
      const asp = normalPrice - discountRp;
      const revenue = o.grossAmount || asp * o.quantity;
      const feePct = getAdminFeePct(o.marketplaceAdminFee, o.channel);
      return acc + (revenue * (1 - feePct));
    }, 0);
    const grossProfit = netRevenue - totalCogs;
    const totalQty = metricsSource.reduce((acc, o) => acc + (o.quantity || 1), 0);
    const avgMargin = netRevenue > 0 ? Math.round((grossProfit / netRevenue) * 10000) / 100 : 0;
    
    const uniqueOrders = new Set(metricsSource.map(o => o.orderNumber));
    const totalOrders = uniqueOrders.size;

    return {
      totalRevenue,
      totalCogs,
      grossProfit,
      netRevenue,
      totalQty,
      avgMargin,
      totalOrders
    };
  }, [filteredOrders, marketplaceOrders]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(filteredOrders.map(o => o.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleChannelChange = (channel: ChannelType) => {
    const fee = ['Shopee', 'Tokopedia', 'Lazada', 'TikTok Shop'].includes(channel) ? 23 : 0;
    setFormData({ ...formData, channel, marketplaceAdminFee: fee });
  };

  const handleOpenEdit = (order: MarketplaceOrder) => {
    setEditingOrder(order);
    setFormData({
      orderNumber: order.orderNumber,
      channel: order.channel,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      orderDate: order.orderDate,
      skuCode: order.skuCode,
      productName: order.productName,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      grossAmount: order.grossAmount,
      voucherDiscount: order.voucherDiscount,
      marketplaceAdminFee: 23,
      adsCost: order.adsCost,
      shippingFee: order.shippingFee,
      cogs: order.cogs,
      variant: order.variant,
      status: order.status,
      paymentMethod: order.paymentMethod
    });
    setShowAddModal(true);
  };

  const handleOpenDetail = (order: MarketplaceOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleExportCSV = () => {
    const data = filteredOrders.map(o => {
      const normalPrice = o.unitPrice || 150000;
      const discountPct = normalPrice > 0 ? Math.round(((o.voucherDiscount || 0) / normalPrice) * 100) : 0;
      return {
        Month: getFormattedMonth(o.orderDate),
        OrderNumber: o.orderNumber,
        Channel: o.channel,
        Product: o.productName,
        Variant: o.variant || '-',
        SKU: o.skuCode,
        Quantity: o.quantity,
        NormalPrice: normalPrice,
        DiscountPct: `${discountPct}%`,
        GrossAmount: o.grossAmount,
        AdminFee: `${Math.round(getAdminFeePct(o.marketplaceAdminFee, o.channel) * 100)}%`,
        COGS: o.cogs || 85000 * o.quantity,
        Status: o.status
      };
    });
    exportToCSV('marketplace_orders', data);
  };

  const handleExportPDF = () => {
    const headers = ['Bulan', 'Channel', 'Nama Produk', 'SKU', 'Qty', 'Gross Amount', 'Admin Fee', 'COGS', 'Status'];
    const rows = filteredOrders.map(o => [
      getFormattedMonth(o.orderDate),
      o.channel,
      o.productName,
      o.skuCode,
      o.quantity,
      formatIDR(o.grossAmount),
      `${Math.round(getAdminFeePct(o.marketplaceAdminFee, o.channel) * 100)}%`,
      formatIDR(o.cogs || 85000 * o.quantity),
      o.status
    ]);
    exportToPDF('Laporan Penjualan Marketplace Hub', headers, rows);
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrder) {
      updateMarketplaceOrder(editingOrder.id, formData);
      setEditingOrder(null);
    } else {
      addMarketplaceOrder(formData);
    }
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 px-2 sm:px-0">
      <RoleAccessBanner moduleName="Marketplace Channel Hub" />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Store className="w-8 h-8 text-emerald-600 shrink-0" />
            Marketplace Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 font-medium">
            Pusat kendali penjualan multi-channel, analisis profit, dan monitoring SKU.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {!isStaff && (
            <>
              <button
                onClick={() => {
                  setEditingOrder(null);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all text-xs sm:text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Tambah Transaksi
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95 text-xs sm:text-sm cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-600" /> Import CSV
              </button>
            </>
          )}

          <ExportDropdown onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} label="Export Hub" />

          {marketplaceOrders.length > 0 && (
            <button
              onClick={() => {
                clearMarketplaceOrders();
                setSelectedRows([]);
              }}
              className="p-2.5 sm:p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl border border-rose-100 transition-all active:scale-95 flex items-center gap-2 px-3 sm:px-4 cursor-pointer"
              title="Bersihkan Semua Data"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs font-bold hidden sm:inline">Clear All</span>
            </button>
          )}

          {selectedRows.length > 0 && (
            <button
              onClick={() => {
                selectedRows.forEach(id => deleteMarketplaceOrder(id));
                setSelectedRows([]);
              }}
              className="flex items-center gap-2 bg-rose-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold shadow-lg shadow-rose-200 transition-all active:scale-95 text-xs sm:text-sm cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> 
              <span>Hapus {selectedRows.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {[
          { label: 'Total Revenue', value: stats.totalRevenue, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total COGS', value: stats.totalCogs, icon: Layers, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Gross Profit', value: stats.grossProfit, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', highlight: true },
          { label: 'Net Revenue', value: stats.netRevenue, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Order', value: stats.totalOrders, icon: Store, color: 'text-indigo-600', bg: 'bg-indigo-50', isQty: true },
          { label: 'Qty Terjual', value: stats.totalQty, icon: ShoppingCart, color: 'text-amber-600', bg: 'bg-amber-50', isQty: true },
          { label: 'Avg Margin', value: `${stats.avgMargin}%`, icon: PieChart, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className={`p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all`}>
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all`}>
              <stat.icon className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 truncate">{stat.label}</p>
            <p className={`text-base sm:text-lg font-black tracking-tight ${stat.color} truncate`}>
              {typeof stat.value === 'number' ? (stat.isQty ? stat.value.toLocaleString() : formatIDR(stat.value)) : stat.value}
            </p>
            {stat.highlight && (
              <div className="mt-2 flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-600 font-bold">
                <ArrowUpRight className="w-3 h-3" /> Profitability Peak
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        {/* Navigation Tabs */}
        <div className="px-4 sm:px-8 pt-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
          <div className="flex gap-6 sm:gap-8 min-w-max">
            {[
              { id: 'data', label: 'Data Transaksi', icon: ShoppingCart },
              { id: 'summary', label: 'Summary Analytics', icon: BarChart3 },
              { id: 'analytics', label: 'Analytics & Insight', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
                  activeTab === tab.id 
                    ? 'text-emerald-600' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="pb-4 hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">
            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> Live Channel Sync
          </div>
        </div>

        {/* Filters Bar */}
        {activeTab === 'data' && (
          <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-700 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-auto">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Semua Channel">Semua Channel</option>
                  <option value="Shopee">Shopee</option>
                  <option value="Tokopedia">Tokopedia</option>
                  <option value="Lazada">Lazada</option>
                  <option value="TikTok Shop">TikTok Shop</option>
                  <option value="Website">Website</option>
                  <option value="POS Retail">POS Retail</option>
                </select>
              </div>

              <div className="relative w-full sm:w-auto">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Semua Bulan">Semua Bulan / Periode</option>
                  <optgroup label="Per 1 Tahun">
                    <option value="Tahun 2026">Tahun 2026</option>
                  </optgroup>
                  <optgroup label="Per Kuartal (Quarter)">
                    <option value="Q1 2026">Q1 2026 (Jan - Mar)</option>
                    <option value="Q2 2026">Q2 2026 (Apr - Jun)</option>
                    <option value="Q3 2026">Q3 2026 (Jul - Sep)</option>
                    <option value="Q4 2026">Q4 2026 (Okt - Des)</option>
                  </optgroup>
                  <optgroup label="Per Bulan">
                    <option value="Juli 2026">Juli 2026</option>
                    <option value="Juni 2026">Juni 2026</option>
                    <option value="Mei 2026">Mei 2026</option>
                    <option value="April 2026">April 2026</option>
                    <option value="Maret 2026">Maret 2026</option>
                    <option value="Februari 2026">Februari 2026</option>
                    <option value="Januari 2026">Januari 2026</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU, nama produk, atau no. pesanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Table View with Separated Product & SKU Columns */}
        {activeTab === 'data' && (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                  <th className="p-4 sm:p-6 text-center w-12">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={filteredOrders.length > 0 && selectedRows.length === filteredOrders.length}
                      className="rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-6">BULAN</th>
                  <th className="px-4 py-6">CHANNEL</th>
                  <th className="px-4 py-6">NAMA PRODUK</th>
                  <th className="px-4 py-6">VARIASI</th>
                  <th className="px-4 py-6 text-center">QTY TERJUAL</th>
                  <th className="px-4 py-6 text-right">HARGA NORMAL</th>
                  <th className="px-4 py-6 text-right">DISKON (%)</th>
                  <th className="px-4 py-6 text-right">DISKON (RP)</th>
                  <th className="px-4 py-6 text-right">HARGA JUAL (ASP)</th>
                  <th className="px-4 py-6 text-right">REVENUE</th>
                  <th className="px-4 py-6 text-right">BIAYA ADMIN (%)</th>
                  <th className="px-4 py-6 text-right">NET REVENUE</th>
                  <th className="px-4 py-6">NO. PESANAN</th>
                  <th className="px-4 py-6 text-right text-amber-600">COGS/UNIT</th>
                  <th className="px-4 py-6 text-right text-emerald-600">GROSS PROFIT</th>
                  <th className="px-4 py-6 text-center">MARGIN %</th>
                  <th className="px-4 py-6 text-right">CONTRIBUTION MARGIN</th>
                  <th className="px-6 sm:px-8 py-6 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300">
                          <ShoppingCart className="w-10 h-10" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">Belum ada data transaksi ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o, idx) => {
                    const normalPrice = o.unitPrice || 150000;
                    const discountRp = o.voucherDiscount || 0;
                    const discountPct = normalPrice > 0 ? Math.round((discountRp / normalPrice) * 100) : 0;
                    const asp = normalPrice - discountRp;
                    const revenue = o.grossAmount || asp * o.quantity;
                    const adminFeePct = getAdminFeePct(o.marketplaceAdminFee, o.channel);
                    const adminFeeRp = Math.round(revenue * adminFeePct);
                    const netRev = revenue * (1 - adminFeePct);
                    const cogsUnit = Math.round((o.cogs || 85000) / (o.quantity || 1));
                    const cogsTotal = cogsUnit * o.quantity;
                    const grossProfitItem = netRev - cogsTotal;
                    const marginPct = netRev > 0 ? Math.round(((netRev - cogsTotal) / netRev) * 10000) / 100 : 0;
                    const contributionMargin = grossProfitItem - (o.adsCost || 0);

                    return (
                      <tr key={`${o.id}-${idx}`} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="p-4 sm:p-6 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(o.id)}
                            onChange={() => handleToggleRow(o.id)}
                            className="rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-6">
                          <p className="text-xs font-black text-slate-900 dark:text-white bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg w-fit border border-emerald-100 dark:border-emerald-800">
                            {getFormattedMonth(o.orderDate)}
                          </p>
                        </td>
                        <td className="px-4 py-6">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 
                            ${o.channel === 'Shopee' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                              o.channel === 'Tokopedia' ? 'bg-green-50 text-green-600 border border-green-100' :
                              o.channel === 'TikTok Shop' ? 'bg-slate-900 text-white' :
                              'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                            {o.channel}
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                               <PackageCheck className="w-5 h-5" />
                            </div>
                            <div className="max-w-[200px]">
                              <p className="text-sm font-black text-slate-900 dark:text-white truncate" title={o.productName}>
                                {o.productName}
                              </p>
                              <p className="text-[10px] font-mono font-bold text-emerald-600 mt-0.5">{o.skuCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {o.variant || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-6 text-center font-black text-slate-900 dark:text-white">{o.quantity}</td>
                        <td className="px-4 py-6 text-right font-medium text-slate-700 dark:text-slate-300">{formatIDR(normalPrice)}</td>
                        <td className="px-4 py-6 text-right font-medium text-amber-600">{discountPct}%</td>
                        <td className="px-4 py-6 text-right font-medium text-slate-600">{formatIDR(discountRp)}</td>
                        <td className="px-4 py-6 text-right font-black text-slate-900 dark:text-white">{formatIDR(asp)}</td>
                        <td className="px-4 py-6 text-right font-black text-slate-900 dark:text-white">{formatIDR(revenue)}</td>
                        <td className="px-4 py-6 text-right font-black text-slate-900 dark:text-white">
                          {Math.round(adminFeePct * 100)}% 
                          <span className="block text-[10px] text-slate-400 font-normal">{formatIDR(adminFeeRp)}</span>
                        </td>
                        <td className="px-4 py-6 text-right font-black text-emerald-600">{formatIDR(netRev)}</td>
                        <td className="px-4 py-6 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{o.orderNumber}</td>
                        <td className="px-4 py-6 text-right font-black text-amber-600 dark:text-amber-400">
                          {formatIDR(cogsUnit)}
                          <span className="block text-[10px] text-slate-400 font-normal">Tot: {formatIDR(cogsTotal)}</span>
                        </td>
                        <td className="px-4 py-6 text-right font-black text-emerald-600">{formatIDR(grossProfitItem)}</td>
                        <td className="px-4 py-6 text-center">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${marginPct >= 30 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {marginPct}%
                          </span>
                        </td>
                        <td className="px-4 py-6 text-right font-black text-indigo-600 dark:text-indigo-400">{formatIDR(contributionMargin)}</td>
                        <td className="px-6 sm:px-8 py-6 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(o)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/35 rounded-xl transition-all cursor-pointer"
                              title="Edit Transaksi"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteMarketplaceOrder(o.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/35 rounded-xl transition-all cursor-pointer"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenDetail(o)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/35 rounded-xl transition-all cursor-pointer"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Analytics View - Enhanced with Top 5 Best-Selling Products & Top 20 Categories */}
        {activeTab === 'summary' && (
          <div className="p-4 sm:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Top Row: Channel Share & Top 5 Best-Selling Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Channel Distribution */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Channel Market Share</h3>
                    <p className="text-xs text-slate-500">Kontribusi net revenue per platform penjualan</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                    <PieChart className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {['Shopee', 'Tokopedia', 'Lazada', 'TikTok Shop', 'Website', 'POS Retail'].map(ch => {
                    const sourceOrders = filteredOrders.length > 0 ? filteredOrders : marketplaceOrders;
                    const chOrders = sourceOrders.filter(o => {
                      const norm = normalizeChannel(o.channel);
                      return norm === ch || (ch === 'TikTok Shop' && (norm === 'TikTok Shop' || o.channel === 'TikTok' || o.channel === 'TikTok Shop'));
                    });
                    const count = chOrders.length;
                    const revenueVal = chOrders.reduce((s, o) => {
                      const normalPrice = o.unitPrice || 150000;
                      const discountRp = o.voucherDiscount || 0;
                      const asp = normalPrice - discountRp;
                      const revenue = o.grossAmount || asp * o.quantity;
                      const feePct = getAdminFeePct(o.marketplaceAdminFee, o.channel);
                      return s + (revenue * (1 - feePct));
                    }, 0);
                    const percentage = stats.netRevenue > 0 ? Math.round((revenueVal / stats.netRevenue) * 100) : 0;
                    
                    return (
                      <div key={ch} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${percentage > 30 ? 'bg-emerald-500' : percentage > 10 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{ch}</span>
                          </div>
                          <span className="text-xs font-black text-slate-900 dark:text-white">{formatIDR(revenueVal)}</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full ${percentage > 30 ? 'bg-emerald-500' : percentage > 10 ? 'bg-blue-500' : 'bg-slate-400'}`}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{count} Transactions</span>
                          <span className="text-[10px] font-black text-slate-600">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top 5 Best-Selling Products (5 Produk Terlaris) */}
              <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <TrendingUp className="w-24 h-24" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-lg sm:text-xl font-black flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      Top 5 Produk Terlaris
                    </h3>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 font-black px-3 py-1 rounded-full">
                      Berdasarkan Qty
                    </span>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    {top5Products.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-500">
                          <Package className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-300">Belum Ada Data Penjualan</p>
                        <p className="text-xs text-slate-500 mt-1">Belum ada transaksi marketplace yang tercatat.</p>
                      </div>
                    ) : (
                      top5Products.map((p, idx) => (
                        <div key={`${p.sku}-${idx}`} className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xs shrink-0">
                              #{idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold truncate max-w-[180px] sm:max-w-xs">{p.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs sm:text-sm font-black text-emerald-400">{p.totalQty} Sold</p>
                            <p className="text-[10px] text-slate-400">{formatIDR(p.totalRevenue)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setShowProductReportModal(true)}
                  className="mt-6 w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-2xl font-black transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  View Full Product Report <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Top 20 Categories (20 Kategori Terlaris berdasarkan SKU) */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-6 h-6 text-emerald-600" />
                    Top 20 Kategori Terlaris (Berdasarkan SKU)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Analisis performa penjualan dikelompokkan berdasarkan kategori SKU produk</p>
                </div>
                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl text-xs font-black border border-emerald-100 dark:border-emerald-800 w-fit">
                  {top20Categories.length} Kategori Aktif Terdeteksi
                </div>
              </div>

              {top20Categories.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Tag className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Kategori Terdeteksi</p>
                  <p className="text-xs text-slate-400 mt-1">Catat transaksi marketplace untuk menampilkan analisis kategori SKU.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {top20Categories.map((cat, idx) => {
                    const maxQty = Math.max(...top20Categories.map(c => c.totalQty), 1);
                    const widthPct = Math.round((cat.totalQty / maxQty) * 100);

                    return (
                      <div key={cat.category} className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md inline-block mb-1">
                              Rank #{idx + 1}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">{cat.category}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-900 dark:text-white">{cat.totalQty} Unit</p>
                            <p className="text-[10px] text-slate-400">{formatIDR(cat.totalRevenue)}</p>
                          </div>
                        </div>

                        <div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (() => {
          const o = selectedOrder;
          const normalPrice = o.unitPrice || 150000;
          const discountRp = o.voucherDiscount || 0;
          const discountPct = normalPrice > 0 ? Math.round((discountRp / normalPrice) * 100) : 0;
          const asp = normalPrice - discountRp;
          const revenue = o.grossAmount || asp * o.quantity;
          
          const adminFeePct = getAdminFeePct(o.marketplaceAdminFee, o.channel);
          const adminFeeRp = revenue * adminFeePct;
          const netRev = revenue * (1 - adminFeePct);
          const cogsUnit = Math.round((o.cogs || 85000) / (o.quantity || 1));
          const cogsTotal = cogsUnit * o.quantity;
          const grossProfitItem = netRev - cogsTotal;
          const marginPct = netRev > 0 ? Math.round(((netRev - cogsTotal) / netRev) * 10000) / 100 : 0;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
              >
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                      <Eye className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">Detail Transaksi</h3>
                      <p className="text-sm text-slate-500 font-medium">{o.orderNumber} • {o.channel}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  {/* Basic Info */}
                  <section className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Produk & SKU</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{o.productName}</p>
                      <p className="text-xs text-emerald-600 font-mono font-bold mt-1">SKU: {o.skuCode} • {o.variant}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Customer</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{o.customerName}</p>
                      <p className="text-xs text-slate-500">{o.customerPhone}</p>
                    </div>
                  </section>

                  {/* Pricing Breakdown */}
                  <section className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Pricing & Discount Breakdown
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Harga Normal per Unit</span>
                        <span className="font-bold">{formatIDR(normalPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Voucher / Diskon Marketplace</span>
                        <span className="font-bold text-rose-500">-{formatIDR(discountRp)} ({discountPct}%)</span>
                      </div>
                      <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                      <div className="flex justify-between items-center text-sm font-black">
                        <span className="text-slate-900 dark:text-white">Gross Revenue ({o.quantity} Qty)</span>
                        <span className="text-blue-600">{formatIDR(revenue)}</span>
                      </div>
                    </div>
                  </section>

                  {/* Channel Fees */}
                  <section className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-amber-600 tracking-widest flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Channel Admin Fees
                    </h4>
                    <div className="bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-800 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-amber-700 dark:text-amber-300">Biaya Admin {o.channel}</span>
                        <span className="font-bold text-rose-600">-{formatIDR(adminFeeRp)} ({adminFeePct * 100}%)</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-black pt-2">
                        <span className="text-slate-900 dark:text-white">Net Revenue (Setelah Admin)</span>
                        <span className="text-emerald-600">{formatIDR(netRev)}</span>
                      </div>
                    </div>
                  </section>

                  {/* Profitability */}
                  <section className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-purple-600 tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Profitability Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Gross Profit</p>
                        <p className={`text-2xl font-black ${grossProfitItem >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatIDR(grossProfitItem)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-2 italic">Setelah COGS {formatIDR(cogsTotal)}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 text-center">Margin Akhir</p>
                        <p className={`text-3xl font-black ${marginPct >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {marginPct}%
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex gap-4">
                  <button 
                    onClick={() => {
                      deleteMarketplaceOrder(o.id);
                      setShowDetailModal(false);
                    }}
                    className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus Transaksi
                  </button>
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black transition-all active:scale-95 shadow-lg cursor-pointer"
                  >
                    Tutup Rincian
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Import Transaksi</h3>
                  <p className="text-sm text-slate-500 font-medium">Sinkronisasi data dari file CSV</p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4" /> Panduan & Format Kolom CSV
                </h4>
                <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-400 font-medium">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</div>
                    Gunakan template CSV standar Hub. Kolom wajib: <b>Month, OrderNumber, Channel, Product, Variant, SKU, Qty, NormalPrice, DiscountPct, AdminFee, COGS, Status</b>.
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</div>
                    Pastikan SKU produk sudah terdaftar di modul Inventory.
                  </li>
                </ul>
                <button
                  onClick={() => {
                    const csvTemplate = 'Month,OrderNumber,Channel,Product,Variant,SKU,Qty,NormalPrice,DiscountPct,AdminFee,COGS,Status\nJuni 2026,ORD-123456,Tokopedia,Jersey Sepeda Gowes,Hitam - M,SKU-JJ-SRM50,1,150000,0,23%,85000,Selesai';
                    const blob = new Blob([csvTemplate], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'template_import_penjualan_marketplace.csv';
                    a.click();
                  }}
                  className="flex items-center gap-2 text-blue-600 font-black text-xs hover:underline mt-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Template CSV (Sesuai Kolom Tabel)
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Pilih File Sumber (.csv)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-slate-300 group-hover:text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Drag & Drop file CSV di sini</p>
                    <p className="text-xs text-slate-400 mt-1">Atau klik untuk menelusuri file</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                  Data yang diimport akan ditambahkan ke database Hub saat ini. Pastikan tidak ada data duplikat pada nomor pesanan.
                </p>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-800/50">
              <button 
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Pilih File & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in zoom-in duration-300 overflow-y-auto">
          <form onSubmit={handleSaveOrder} className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{editingOrder ? 'Update Transaksi' : 'Transaksi Baru'}</h3>
                  <p className="text-sm text-slate-500 font-medium">Input rincian penjualan marketplace</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Channel Penjualan</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => handleChannelChange(e.target.value as ChannelType)}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold cursor-pointer"
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="Tokopedia">Tokopedia</option>
                    <option value="Lazada">Lazada</option>
                    <option value="TikTok Shop">TikTok Shop</option>
                    <option value="Website">Website</option>
                    <option value="POS Retail">POS Retail</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Nomor Pesanan</label>
                  <input
                    type="text"
                    required
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Nama Produk</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama produk lengkap..."
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">SKU Code</label>
                      <input
                        type="text"
                        required
                        placeholder="SKU-XXXX"
                        value={formData.skuCode}
                        onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Variasi</label>
                      <input
                        type="text"
                        required
                        placeholder="Variasi (L, XL, Merah, dll)"
                        value={formData.variant}
                        onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.quantity}
                      onChange={(e) => {
                        const qty = Number(e.target.value);
                        setFormData({ ...formData, quantity: qty, grossAmount: qty * formData.unitPrice });
                      }}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-black text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Harga Jual</label>
                    <input
                      type="number"
                      required
                      value={formData.unitPrice}
                      onChange={(e) => {
                        const price = Number(e.target.value);
                        setFormData({ ...formData, unitPrice: price, grossAmount: price * formData.quantity });
                      }}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-black text-center text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Admin Fee (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={formData.marketplaceAdminFee !== undefined ? formData.marketplaceAdminFee : 23}
                      onChange={(e) => setFormData({ ...formData, marketplaceAdminFee: Number(e.target.value) })}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-black text-center text-amber-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">COGS Total</label>
                    <input
                      type="number"
                      required
                      value={formData.cogs}
                      onChange={(e) => setFormData({ ...formData, cogs: Number(e.target.value) })}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-black text-center text-rose-600"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                   <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-800">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Net Revenue</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">
                            {formatIDR(formData.grossAmount * (1 - ((formData.marketplaceAdminFee !== undefined ? formData.marketplaceAdminFee : 23) / 100)))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Est. Gross Profit</p>
                          <p className="text-2xl font-black text-emerald-600">
                            {formatIDR((formData.grossAmount * (1 - ((formData.marketplaceAdminFee !== undefined ? formData.marketplaceAdminFee : 23) / 100))) - formData.cogs)}
                          </p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-800/50">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" /> {editingOrder ? 'Simpan Perubahan' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product Report Modal */}
      <AnimatePresence>
        {showProductReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-5xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Laporan Kinerja Produk Lengkap</h3>
                    <p className="text-sm text-slate-500 font-medium">Analisis mendalam penjualan, HPP, margin, & profitabilitas seluruh SKU produk</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ExportDropdown
                    onExportCSV={() => {
                      const dataToExport = products.map((p, idx) => {
                        const ordersForP = marketplaceOrders.filter(o => o.skuCode === p.sku);
                        const qty = ordersForP.reduce((acc, o) => acc + o.quantity, 0);
                        const rev = ordersForP.reduce((acc, o) => acc + (o.grossAmount || 0), 0);
                        const cogs = ordersForP.reduce((acc, o) => acc + (o.cogs || 85000), 0);
                        const net = rev * 0.77 - cogs;
                        const margin = rev > 0 ? Math.round((net / (rev * 0.77)) * 10000) / 100 : 0;
                        return {
                          No: idx + 1,
                          SKU: p.sku,
                          'Nama Produk': p.name,
                          Category: p.category,
                          'Terjual (Qty)': qty,
                          'Gross Revenue': rev,
                          'COGS Total': cogs,
                          'Net Profit': net,
                          'Margin (%)': `${margin}%`
                        };
                      });
                      exportToCSV('Laporan_Kinerja_Produk_Jerjhon', dataToExport);
                    }}
                    onExportPDF={() => {
                      const headers = ['SKU', 'Nama Produk', 'Category', 'Qty', 'Revenue', 'Profit', 'Margin'];
                      const rows = products.map(p => {
                        const ordersForP = marketplaceOrders.filter(o => o.skuCode === p.sku);
                        const qty = ordersForP.reduce((acc, o) => acc + o.quantity, 0);
                        const rev = ordersForP.reduce((acc, o) => acc + (o.grossAmount || 0), 0);
                        const cogs = ordersForP.reduce((acc, o) => acc + (o.cogs || 85000), 0);
                        const net = rev * 0.77 - cogs;
                        const margin = rev > 0 ? Math.round((net / (rev * 0.77)) * 100) : 0;
                        return [p.sku, p.name, p.category, String(qty), formatIDR(rev), formatIDR(net), `${margin}%`];
                      });
                      exportToPDF('Laporan Kinerja Produk & Profitabilitas Marketplace', headers, rows);
                    }}
                    label="Export Laporan"
                  />
                  <button
                    onClick={() => setShowProductReportModal(false)}
                    className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors cursor-pointer"
                  >
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari SKU atau nama produk..."
                      value={productReportSearch}
                      onChange={(e) => setProductReportSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="text-xs text-slate-500 font-bold">
                    Total SKU Terdaftar: <span className="text-emerald-600 font-black">{products.length} Produk</span>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-black text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="p-4">Rank & SKU</th>
                        <th className="p-4">Nama Produk</th>
                        <th className="p-4">Kategori SKU</th>
                        <th className="p-4 text-center">Terjual</th>
                        <th className="p-4 text-right">Gross Revenue</th>
                        <th className="p-4 text-right">Est. Laba Bersih</th>
                        <th className="p-4 text-center">Margin</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {(() => {
                        const sourceOrders = filteredOrders.length > 0 ? filteredOrders : marketplaceOrders;
                        const skuMap = new Map<string, { id?: string; sku: string; name: string; category: string }>();
                        products.forEach(p => skuMap.set(p.sku, { id: p.id, sku: p.sku, name: p.name, category: p.category }));
                        sourceOrders.forEach(o => {
                          if (o.skuCode && !skuMap.has(o.skuCode)) {
                            skuMap.set(o.skuCode, { sku: o.skuCode, name: o.productName, category: getCategoryFromSku(o.skuCode) });
                          }
                        });

                        const reportItems = Array.from(skuMap.values()).map((p) => {
                          const ordersForP = sourceOrders.filter(o => o.skuCode === p.sku);
                          const qty = ordersForP.reduce((acc, o) => acc + o.quantity, 0);
                          const rev = ordersForP.reduce((acc, o) => acc + (o.grossAmount || 0), 0);
                          const cogs = ordersForP.reduce((acc, o) => acc + (o.cogs || 85000), 0);
                          const netRev = rev * 0.77;
                          const netProfit = netRev - cogs;
                          const margin = netRev > 0 ? Math.round((netProfit / netRev) * 10000) / 100 : 0;
                          return { p, qty, rev, cogs, netProfit, margin };
                        }).filter(item => item.p.name.toLowerCase().includes(productReportSearch.toLowerCase()) || item.p.sku.toLowerCase().includes(productReportSearch.toLowerCase()))
                        .sort((a, b) => b.qty - a.qty);

                        if (reportItems.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="py-16 text-center text-slate-400">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                                  <Package className="w-7 h-7" />
                                </div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Data Penjualan Produk</p>
                                <p className="text-xs text-slate-400 mt-1">Belum ada transaksi marketplace tercatat untuk produk manapun.</p>
                              </td>
                            </tr>
                          );
                        }

                        return reportItems.map(({ p, qty, rev, netProfit, margin }, idx) => {
                          const statusBadge = qty > 5 ? 'Top Seller' : 'Stabil';
                          const catName = getCategoryFromSku(p.sku);

                          return (
                            <tr key={`${p.id || 'imp'}-${p.sku || ''}-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="p-4 font-mono font-bold text-xs">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 font-black mr-2 text-xs">
                                  #{idx + 1}
                                </span>
                                {p.sku}
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {p.sku}</p>
                              </td>
                              <td className="p-4">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                  {catName}
                                </span>
                              </td>
                              <td className="p-4 text-center font-black text-blue-600">
                                {qty} Unit
                              </td>
                              <td className="p-4 text-right font-black text-slate-900 dark:text-white">
                                {formatIDR(rev)}
                              </td>
                              <td className="p-4 text-right font-black text-emerald-600">
                                {formatIDR(netProfit > 0 ? netProfit : rev * 0.35)}
                              </td>
                              <td className="p-4 text-center font-bold">
                                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl text-xs font-black">
                                  {margin}%
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  qty > 5 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                }`}>
                                  {statusBadge}
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/50">
                <button
                  onClick={() => setShowProductReportModal(false)}
                  className="px-8 py-3.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg cursor-pointer"
                >
                  Tutup Laporan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
