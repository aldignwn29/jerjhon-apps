import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  FileText, 
  CheckCircle2, 
  Settings, 
  Package, 
  FileSpreadsheet, 
  Trash2, 
  X, 
  Download,
  Layers,
  FlaskConical,
  Filter,
  Printer,
  Edit3,
  Check,
  ArrowRightLeft,
  RefreshCw
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { ProductionOrder, SizeBreakdown } from '../../../types';

const ALL_SIZES = [
  { key: 'xs', label: 'XS' },
  { key: 's', label: 'S' },
  { key: 'm', label: 'M' },
  { key: 'l', label: 'L' },
  { key: 'xl', label: 'XL' },
  { key: 'xxl', label: 'XXL' },
  { key: '3xl', label: '3XL' },
  { key: '4xl', label: '4XL' },
  { key: '5xl', label: '5XL' },
  { key: '6xl', label: '6XL' },
  { key: 'allSize', label: 'ALL SIZE' }
] as const;

const DEFAULT_SIZE_BREAKDOWN: SizeBreakdown = {
  xs: 0,
  s: 0,
  m: 0,
  l: 0,
  xl: 0,
  xxl: 0,
  '3xl': 0,
  '4xl': 0,
  '5xl': 0,
  '6xl': 0,
  allSize: 0
};

export const BOMProductionView: React.FC = () => {
  const { 
    productionOrders, 
    addProductionOrder, 
    updateProductionOrder,
    deleteProductionOrder, 
    products, 
    rawMaterialGroups,
    formatIDR,
    bomList,
    isStaff,
    addProduct,
    updateProduct,
    sizeOptions,
    setSizeOptions,
    colorOptions,
    setColorOptions,
    sleeveOptions,
    setSleeveOptions,
    designOptions,
    setDesignOptions,
    variantStocks,
    setVariantStocks,
    variantPrices,
    setVariantPrices,
    variantCosts,
    setVariantCosts,
    variantSKUs,
    setVariantSKUs
  } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<'data_produksi' | 'resep_bom'>('data_produksi');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printPoOrder, setPrintPoOrder] = useState<ProductionOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [reportType, setReportType] = useState('Harian');
  const [reportDate, setReportDate] = useState(new Date().toISOString().substring(0, 10));

  // Custom confirmation and notification state
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [showClearAllConfirmation, setShowClearAllConfirmation] = useState<boolean>(false);
  const [customToast, setCustomToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setCustomToast({ message, type });
    setTimeout(() => {
      setCustomToast(null);
    }, 4500);
  }, []);

  // Form State for "Tambah / Edit Produksi"
  const generateCode = () => {
    const today = new Date().toISOString().substring(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PROD-${today}${rand}`;
  };

  const [formData, setFormData] = useState({
    code: generateCode(),
    productName: '',
    bahanBaku: '',
    startDate: new Date().toISOString().substring(0, 10),
    dueDate: new Date().toISOString().substring(0, 10),
    sizeBreakdown: { ...DEFAULT_SIZE_BREAKDOWN },
    status: 'Planning',
    unitCost: 25000,
    totalCost: 0
  });

  const calculateTotalQty = (sizes?: SizeBreakdown) => {
    if (!sizes) return 0;
    return ALL_SIZES.reduce((acc, sz) => acc + Number(sizes[sz.key] || 0), 0);
  };

  const handleSizeChange = (key: string, val: number) => {
    const updatedSizes = { ...formData.sizeBreakdown, [key]: val };
    const totalQty = calculateTotalQty(updatedSizes);
    const calculatedTotalCost = totalQty * (formData.unitCost || 0);

    setFormData({
      ...formData,
      sizeBreakdown: updatedSizes,
      totalCost: calculatedTotalCost
    });
  };

  const handleUnitCostChange = (cost: number) => {
    const totalQty = calculateTotalQty(formData.sizeBreakdown);
    setFormData({
      ...formData,
      unitCost: cost,
      totalCost: totalQty * cost
    });
  };

  const calculateMaterialCost = (m: { penggunaan: number; biayaSatuan: number; satuan: string }) => {
    const unitLower = (m.satuan || '').toLowerCase().trim();
    const isNoMultiply = ['kilogram', 'kg', 'meter', 'liter', 'litter', 'yard', 'roll', 'set', 'gram', 'pcs'].includes(unitLower);
    return isNoMultiply ? (m.biayaSatuan || 0) : ((m.penggunaan || 0) * (m.biayaSatuan || 0));
  };

  const handleProductSelect = (selectedName: string) => {
    const matchedGroup = (rawMaterialGroups || []).find(
      g => g.productName.toLowerCase() === selectedName.toLowerCase()
    );
    const matchedProduct = (products || []).find(
      p => p.name.toLowerCase() === selectedName.toLowerCase()
    );

    let calculatedUnitCost = 25000;
    let materialSummary = '';

    if (matchedGroup && matchedGroup.materials.length > 0) {
      calculatedUnitCost = matchedGroup.materials.reduce((acc, m) => acc + calculateMaterialCost(m), 0);
      materialSummary = `${matchedGroup.materials.length} jenis bahan: ` + matchedGroup.materials.map(m => m.name).join(', ');
    } else if (matchedProduct) {
      calculatedUnitCost = matchedProduct.unitCostPrice || 25000;
      materialSummary = `Bahan Baku: ${matchedProduct.category} (${matchedProduct.sku})`;
    } else if (selectedName) {
      materialSummary = `Bahan Utama ${selectedName}`;
    }

    const totalQty = calculateTotalQty(formData.sizeBreakdown);
    const finalUnitCost = Math.round(calculatedUnitCost);

    setFormData({
      ...formData,
      productName: selectedName,
      bahanBaku: materialSummary,
      unitCost: finalUnitCost,
      totalCost: totalQty * finalUnitCost
    });
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      code: generateCode(),
      productName: '',
      bahanBaku: '',
      startDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date().toISOString().substring(0, 10),
      sizeBreakdown: { ...DEFAULT_SIZE_BREAKDOWN },
      status: 'Planning',
      unitCost: 25000,
      totalCost: 0
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (order: ProductionOrder) => {
    setEditingId(order.id);
    setFormData({
      code: order.code || generateCode(),
      productName: order.productName || '',
      bahanBaku: order.bahanBaku || '',
      startDate: order.startDate || new Date().toISOString().substring(0, 10),
      dueDate: order.dueDate || new Date().toISOString().substring(0, 10),
      sizeBreakdown: order.sizeBreakdown ? { ...DEFAULT_SIZE_BREAKDOWN, ...order.sizeBreakdown } : { ...DEFAULT_SIZE_BREAKDOWN },
      status: order.status || 'Planning',
      unitCost: order.unitCost || order.bomCostPerUnit || 25000,
      totalCost: order.totalCost || 0
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName) {
      triggerToast('Silakan pilih atau isi nama produk!', 'error');
      return;
    }

    const totalQty = calculateTotalQty(formData.sizeBreakdown);

    if (editingId) {
      updateProductionOrder(editingId, {
        code: formData.code,
        productName: formData.productName,
        bahanBaku: formData.bahanBaku || 'Bahan Baku Standard',
        sizeBreakdown: formData.sizeBreakdown,
        totalQty: totalQty || 1,
        quantityTarget: totalQty || 1,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        status: formData.status,
        unitCost: formData.unitCost,
        totalCost: formData.totalCost || (totalQty * formData.unitCost)
      });
    } else {
      addProductionOrder({
        code: formData.code,
        batchNo: `BATCH-${Date.now().toString().slice(-6)}`,
        productName: formData.productName,
        bahanBaku: formData.bahanBaku || 'Bahan Baku Standard',
        sizeBreakdown: formData.sizeBreakdown,
        totalQty: totalQty || 1,
        quantityTarget: totalQty || 1,
        quantityCompleted: formData.status === 'Selesai' ? (totalQty || 1) : 0,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        status: formData.status,
        unitCost: formData.unitCost,
        totalCost: formData.totalCost || (totalQty * formData.unitCost)
      });
    }

    setShowAddModal(false);
  };

  // Safe data array
  const safeOrders = productionOrders || [];
  const filteredOrders = statusFilter === 'Semua Status'
    ? safeOrders
    : safeOrders.filter(o => o.status === statusFilter);

  // Aggregates for Top Cards
  const totalProduksiCount = safeOrders.length;
  const selesaiCount = safeOrders.filter(o => o.status === 'Selesai' || o.status === 'Completed').length;
  const dalamProsesCount = safeOrders.filter(o => o.status === 'Dalam Proses' || o.status === 'In Production' || o.status === 'Planning').length;
  const totalQtySum = safeOrders.reduce((acc, curr) => acc + (curr.totalQty || curr.quantityTarget || 0), 0);

  const handleGeneratePDF = () => {
    triggerToast(`Laporan Produksi (${reportType}) Tanggal: ${reportDate}, Status: ${statusFilter} telah di-generate! PDF siap diunduh.`, 'success');
  };

  const handlePrintDocument = () => {
    if (!printPoOrder) return;
    const printContent = document.getElementById('printable-report');
    if (!printContent) return;

    // Create an offscreen iframe
    let printFrame = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'print-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      printFrame.onload = () => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      };
      frameDoc.open();
      frameDoc.write(`
        <html>
          <head>
            <title>Surat Perintah Kerja Produksi (PO) - ${printPoOrder.batchNo || printPoOrder.id}</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
            <style>
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: white !important;
                color: #0f172a !important;
                padding: 20px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .bg-\\[\\#f0f7ff\\] { background-color: #f0f7ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .bg-slate-100 { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .border-blue-200 { border-color: #bfdbfe !important; }
              .border-slate-200 { border-color: #e2e8f0 !important; }
              .text-\\[\\#1e40af\\] { color: #1e40af !important; }
              .text-blue-700 { color: #1d4ed8 !important; }
              .text-emerald-700 { color: #047857 !important; }
              .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important; }
            </style>
          </head>
          <body>
            <div class="max-w-4xl mx-auto bg-white p-4">
              ${printContent.innerHTML}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();
    }
  };
  
  const handleSendToBUDP = useCallback((order: ProductionOrder) => {
    const cleanOrderName = order.productName.toLowerCase().trim();
    const jadexProds = (products || []).filter(p => p.warehouse !== 'Gudang BUDP');
    
    // 1. Logika Pendekatan (Proximity & Substring Match)
    // 1a. First, search for exact match (ignoring case)
    let matchedJadexProd = jadexProds.find(p => p.name.toLowerCase().trim() === cleanOrderName);
    
    // 1b. Substring match (e.g., "Baselayer" matches "Jerjhon Manset Baselayer Thumbhole Longsleeve Unisex")
    if (!matchedJadexProd) {
      matchedJadexProd = jadexProds.find(p => {
        const cleanPName = p.name.toLowerCase().trim();
        return cleanPName.includes(cleanOrderName) || cleanOrderName.includes(cleanPName);
      });
    }

    // 1c. Word overlap proximity match if no substring match found
    if (!matchedJadexProd) {
      const orderWords = cleanOrderName.split(/\s+/).filter(w => w.length > 2);
      if (orderWords.length > 0) {
        let maxOverlap = 0;
        let bestProd: typeof products[0] | null = null;
        for (const p of jadexProds) {
          const pWords = p.name.toLowerCase().trim().split(/\s+/);
          let overlap = 0;
          for (const ow of orderWords) {
            if (pWords.some(pw => pw.includes(ow) || ow.includes(pw))) {
              overlap++;
            }
          }
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            bestProd = p;
          }
        }
        if (maxOverlap > 0 && bestProd) {
          matchedJadexProd = bestProd;
        }
      }
    }

    const sizes = order.sizeBreakdown ? { ...DEFAULT_SIZE_BREAKDOWN, ...order.sizeBreakdown } : DEFAULT_SIZE_BREAKDOWN;
    const targetSku = matchedJadexProd ? matchedJadexProd.sku : (order.code || `SKU-BUDP-${order.id}`);
    const targetName = matchedJadexProd ? matchedJadexProd.name : order.productName;

    // Check if the product already exists in Gudang BUDP
    const existingBUDPProd = (products || []).find(
      p => p.warehouse === 'Gudang BUDP' && (p.sku === targetSku || p.name === targetName)
    );

    let budpProdId = '';

    if (existingBUDPProd) {
      budpProdId = existingBUDPProd.id;
      const newStock = existingBUDPProd.stockQuantity + order.totalQty;
      updateProduct(existingBUDPProd.id, {
        stockQuantity: newStock,
        status: newStock > 0 ? 'Ready' : 'Out of Stock',
        lastUpdated: new Date().toISOString().substring(0, 10)
      });
    } else {
      budpProdId = matchedJadexProd ? `${matchedJadexProd.id}-BUDP` : `PROD-BUDP-${order.id}`;
      addProduct({
        id: budpProdId,
        sku: targetSku,
        parentSku: matchedJadexProd ? matchedJadexProd.parentSku : 'Custom-BUDP',
        name: targetName,
        category: matchedJadexProd ? matchedJadexProd.category : 'Production R&D',
        warehouse: 'Gudang BUDP',
        stockQuantity: order.totalQty,
        minimumStock: matchedJadexProd ? matchedJadexProd.minimumStock : 10,
        safetyStock: matchedJadexProd ? matchedJadexProd.safetyStock : 20,
        unitCostPrice: matchedJadexProd ? matchedJadexProd.unitCostPrice : (order.unitCost || 0),
        sellingPrice: matchedJadexProd ? matchedJadexProd.sellingPrice : (order.unitCost || 0) * 1.5,
        unit: matchedJadexProd ? matchedJadexProd.unit : 'Pcs',
        status: order.totalQty > 0 ? 'Ready' : 'Out of Stock',
        lastUpdated: new Date().toISOString().substring(0, 10)
      });
    }

    // Copy variation configuration options
    const targetSizes = matchedJadexProd ? (sizeOptions[matchedJadexProd.id] || ["S", "M", "L", "XL", "2XL"]) : ["S", "M", "L", "XL", "2XL"];
    const targetColors = matchedJadexProd ? (colorOptions[matchedJadexProd.id] || [{ name: "-", hex: "-" }]) : [{ name: "-", hex: "-" }];
    const targetSleeves = matchedJadexProd ? (sleeveOptions[matchedJadexProd.id] || ["-"]) : ["-"];
    const targetDesigns = matchedJadexProd ? (designOptions[matchedJadexProd.id] || ["-"]) : ["-"];

    setSizeOptions(prev => ({ ...prev, [budpProdId]: targetSizes }));
    setColorOptions(prev => ({ ...prev, [budpProdId]: targetColors }));
    setSleeveOptions(prev => ({ ...prev, [budpProdId]: targetSleeves }));
    setDesignOptions(prev => ({ ...prev, [budpProdId]: targetDesigns }));

    // Duplicate and update variant stocks, prices, costs & SKUs for BUDP
    const getProductionQtyForSize = (sz: string) => {
      const szUpper = sz.toUpperCase().trim();
      if (szUpper === 'S' || szUpper === 'UKURAN S') return Number(sizes.s) || 0;
      if (szUpper === 'M' || szUpper === 'UKURAN M') return Number(sizes.m) || 0;
      if (szUpper === 'L' || szUpper === 'UKURAN L') return Number(sizes.l) || 0;
      if (szUpper === 'XL' || szUpper === 'UKURAN XL') return Number(sizes.xl) || 0;
      if (szUpper === 'XXL' || szUpper === '2XL' || szUpper === 'UKURAN XXL' || szUpper === 'UKURAN 2XL') return Number(sizes.xxl) || 0;
      if (szUpper === 'ALL SIZE' || szUpper === 'ALLSIZE' || szUpper === 'UKURAN ALL SIZE' || szUpper === '-') return Number(sizes.allSize) || 0;
      return 0;
    };

    setVariantStocks(prev => {
      const next = { ...prev };
      targetSizes.forEach(sz => {
        const sizeQty = getProductionQtyForSize(sz);
        if (sizeQty <= 0) return;

        const combosOfThisSize: any[] = [];
        targetColors.forEach(colObj => {
          const col = typeof colObj === 'string' ? colObj : colObj.name;
          targetSleeves.forEach(sl => {
            targetDesigns.forEach(ds => {
              combosOfThisSize.push({ sz, col, sl, ds });
            });
          });
        });

        let colorFilterMatches = combosOfThisSize.filter(c => {
          if (c.col === '-') return true;
          return order.productName.toLowerCase().includes(c.col.toLowerCase());
        });

        if (colorFilterMatches.length === 0) colorFilterMatches = combosOfThisSize;

        const qtyPerCombo = Math.floor(sizeQty / colorFilterMatches.length);
        const remainder = sizeQty % colorFilterMatches.length;

        colorFilterMatches.forEach((c, index) => {
          const { sz, col, sl, ds } = c;
          const budpGlobalKey = `${budpProdId}-${sz}-${col}-${sl}-${ds}`;
          const addedQty = qtyPerCombo + (index < remainder ? 1 : 0);
          next[budpGlobalKey] = (next[budpGlobalKey] || 0) + addedQty;
        });
      });
      return next;
    });

    setVariantPrices(prev => {
      const next = { ...prev };
      targetSizes.forEach(sz => {
        targetColors.forEach(colObj => {
          const col = typeof colObj === 'string' ? colObj : colObj.name;
          targetSleeves.forEach(sl => {
            targetDesigns.forEach(ds => {
              const jadexId = matchedJadexProd ? matchedJadexProd.id : 'FALLBACK';
              const jadexGlobalKey = `${jadexId}-${sz}-${col}-${sl}-${ds}`;
              const budpGlobalKey = `${budpProdId}-${sz}-${col}-${sl}-${ds}`;
              next[budpGlobalKey] = next[jadexGlobalKey] ?? (matchedJadexProd ? matchedJadexProd.sellingPrice : (order.unitCost || 0) * 1.5);
            });
          });
        });
      });
      return next;
    });

    setVariantCosts(prev => {
      const next = { ...prev };
      targetSizes.forEach(sz => {
        targetColors.forEach(colObj => {
          const col = typeof colObj === 'string' ? colObj : colObj.name;
          targetSleeves.forEach(sl => {
            targetDesigns.forEach(ds => {
              const jadexId = matchedJadexProd ? matchedJadexProd.id : 'FALLBACK';
              const jadexGlobalKey = `${jadexId}-${sz}-${col}-${sl}-${ds}`;
              const budpGlobalKey = `${budpProdId}-${sz}-${col}-${sl}-${ds}`;
              next[budpGlobalKey] = next[jadexGlobalKey] ?? (matchedJadexProd ? matchedJadexProd.unitCostPrice : (order.unitCost || 0));
            });
          });
        });
      });
      return next;
    });

    setVariantSKUs(prev => {
      const next = { ...prev };
      targetSizes.forEach(sz => {
        targetColors.forEach(colObj => {
          const col = typeof colObj === 'string' ? colObj : colObj.name;
          targetSleeves.forEach(sl => {
            targetDesigns.forEach(ds => {
              const jadexId = matchedJadexProd ? matchedJadexProd.id : 'FALLBACK';
              const jadexGlobalKey = `${jadexId}-${sz}-${col}-${sl}-${ds}`;
              const budpGlobalKey = `${budpProdId}-${sz}-${col}-${sl}-${ds}`;
              if (matchedJadexProd) {
                next[budpGlobalKey] = next[jadexGlobalKey] || (col !== '-' ? `${matchedJadexProd.sku}-${col}-${sz}` : matchedJadexProd.sku);
              } else {
                next[budpGlobalKey] = col !== '-' ? `${targetSku}-${col}-${sz}` : targetSku;
              }
            });
          });
        });
      });
      return next;
    });

    updateProductionOrder(order.id, { sentToBUDP: true });
    
    if (matchedJadexProd) {
      triggerToast(`Sukses mencocokkan hasil produksi ke "${matchedJadexProd.name}" dan mengirim ${order.totalQty} Pcs ke Gudang BUDP (beserta seluruh konfigurasi variasi, SKU, Harga Jual, HPP/COGS)!`, 'success');
    } else {
      triggerToast(`Sukses mengirim hasil produksi ${order.productName} (${order.totalQty} Pcs) ke Gudang BUDP!`, 'success');
    }
  }, [
    products, 
    sizeOptions, 
    colorOptions, 
    sleeveOptions, 
    designOptions, 
    variantStocks, 
    variantPrices, 
    variantCosts, 
    variantSKUs, 
    updateProduct, 
    addProduct, 
    setSizeOptions, 
    setColorOptions, 
    setSleeveOptions, 
    setDesignOptions, 
    setVariantStocks, 
    setVariantPrices, 
    setVariantCosts, 
    setVariantSKUs, 
    updateProductionOrder, 
    triggerToast
  ]);

  // Auto-sync finished production to BUDP warehouse (one by one to avoid race conditions)
  useEffect(() => {
    const unsyncedFinished = (productionOrders || []).find(
      o => (o.status === 'Selesai' || o.status === 'Completed') && !o.sentToBUDP
    );
    
    if (unsyncedFinished) {
      handleSendToBUDP(unsyncedFinished);
    }
  }, [productionOrders, handleSendToBUDP]);

  const handleClearAllOrders = () => {
    safeOrders.forEach(order => {
      deleteProductionOrder(order.id);
    });
    setShowClearAllConfirmation(false);
    triggerToast('Sukses mengosongkan seluruh data produksi!', 'success');
  };

  const safeProducts = products || [];
  const safeRawMaterialGroups = rawMaterialGroups || [];

  const rawMaterialProductNames = safeRawMaterialGroups.map(g => g.productName);

  const allProductNames = Array.from(new Set(rawMaterialProductNames)).filter(Boolean);

  const selectedGroupDetails = safeRawMaterialGroups.find(
    g => g.productName.toLowerCase() === formData.productName.toLowerCase()
  );

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00a96e]" />
            Perencanaan Produksi & Bill of Materials (BOM)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manajemen batch produksi, alokasi ukuran, dan resep formulasi bahan baku
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('data_produksi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'data_produksi'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Data Produksi
            </button>
            <button
              onClick={() => setActiveSubTab('resep_bom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'resep_bom'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Resep & BOM
            </button>
          </div>

          {activeSubTab === 'data_produksi' && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-[#00a96e] hover:bg-[#00925f] active:bg-[#007a4f] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Tambah Produksi
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'data_produksi' ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-blue-500 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{totalProduksiCount}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total Batch Produksi</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-amber-500 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{dalamProsesCount}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Dalam Proses / Planning</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Settings className="w-5 h-5 animate-spin-slow" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-emerald-500 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{selesaiCount}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Batch Selesai</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs border-t-4 border-t-purple-500 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{totalQtySum.toLocaleString()} Pcs</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total Target Kuantitas</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Laporan Produksi Generator Section */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📊</span> Laporan Produksi
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Download laporan dalam format PDF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Tipe Laporan
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Harian">Harian</option>
                  <option value="Mingguan">Mingguan</option>
                  <option value="Bulanan">Bulanan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Semua Status">Semua Status</option>
                  <option value="Planning">Planning</option>
                  <option value="Dalam Proses">Dalam Proses</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div>
                <button
                  onClick={handleGeneratePDF}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>📄</span> Generate PDF
                </button>
              </div>
            </div>
          </div>

          {/* Data Produksi Table Section */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Data Produksi
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Total: <strong className="text-slate-900 dark:text-white">{filteredOrders.length}</strong> Data
                </span>
                {safeOrders.length > 0 && (
                  <button
                    onClick={() => setShowClearAllConfirmation(true)}
                    className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-all border border-rose-200/60 dark:border-rose-900/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Kosongkan Semua Data
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="whitespace-nowrap w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3 text-center w-12">NO</th>
                    <th className="p-3">PRODUK</th>
                    <th className="p-3">BAHAN BAKU</th>
                    <th className="p-3">SIZE BREAKDOWN</th>
                    <th className="p-3 text-center">TOTAL QTY</th>
                    <th className="p-3">MULAI</th>
                    <th className="p-3">BERES</th>
                    <th className="p-3 text-center">STATUS</th>
                    <th className="p-3 text-center">SYNC STATUS (BUDP)</th>
                    <th className="p-3 text-right">TOTAL BIAYA</th>
                    <th className="p-3 text-center w-32">AKSI & PO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-12 text-center text-slate-500 dark:text-slate-400">
                        <p className="text-sm font-semibold mb-3">Belum ada data</p>
                        <button
                          onClick={handleOpenAddModal}
                          className="inline-flex items-center gap-1.5 bg-[#00a96e] hover:bg-[#00925f] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs"
                        >
                          <Plus className="w-4 h-4" /> Tambah
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order, idx) => {
                      const sizes = order.sizeBreakdown ? { ...DEFAULT_SIZE_BREAKDOWN, ...order.sizeBreakdown } : DEFAULT_SIZE_BREAKDOWN;
                      const totalQty = order.totalQty || order.quantityTarget || calculateTotalQty(sizes);
                      const totalCost = order.totalCost || (totalQty * (order.unitCost || order.bomCostPerUnit || 0));

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 text-center font-mono font-medium text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            <div>{order.productName}</div>
                            {order.code && (
                              <span className="text-[10px] text-slate-400 font-mono">{order.code}</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {order.bahanBaku || '-'}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {ALL_SIZES.some(sz => (sizes[sz.key] || 0) > 0) ? (
                              <div className="flex flex-wrap gap-1">
                                {ALL_SIZES.map(sz => {
                                  const qty = sizes[sz.key] || 0;
                                  if (!qty) return null;
                                  return (
                                    <span key={sz.key} className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                      {sz.label}:{qty}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono">
                            {totalQty.toLocaleString()} Pcs
                          </td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                            {order.startDate || '-'}
                          </td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                            {order.dueDate || '-'}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                              order.status === 'Selesai' || order.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : order.status === 'Dalam Proses' || order.status === 'In Production'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : order.status === 'Dibatalkan'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {(() => {
                              const isFinished = order.status === 'Selesai' || order.status === 'Completed';
                              if (!isFinished) {
                                return <span className="text-slate-400 dark:text-slate-500 font-medium text-xs">Menunggu Selesai</span>;
                              }

                              // 1. Verifikasi Rekonsiliasi & Auto-Transfer ke BUDP
                              const cleanOrderName = order.productName.toLowerCase().trim();
                              const jadexProds = (products || []).filter(p => p.warehouse !== 'Gudang BUDP');
                              
                              let matchedJadexProd = jadexProds.find(p => p.name.toLowerCase().trim() === cleanOrderName);
                              if (!matchedJadexProd) {
                                matchedJadexProd = jadexProds.find(p => {
                                  const cleanPName = p.name.toLowerCase().trim();
                                  return cleanPName.includes(cleanOrderName) || cleanOrderName.includes(cleanPName);
                                });
                              }

                              const targetSku = matchedJadexProd ? matchedJadexProd.sku : (order.code || `SKU-BUDP-${order.id}`);
                              const targetName = matchedJadexProd ? matchedJadexProd.name : order.productName;

                              // Cek apakah ada di Gudang BUDP dengan mapping SKU/Nama tersebut
                              const existingBUDPProd = (products || []).find(
                                p => p.warehouse === 'Gudang BUDP' && (p.sku === targetSku || p.name === targetName)
                              );

                              // Pastikan konfigurasi variasi juga tersinkron dengan benar
                              const hasConfig = existingBUDPProd && sizeOptions[existingBUDPProd.id] && sizeOptions[existingBUDPProd.id].length > 0;

                              const isSynced = order.sentToBUDP && existingBUDPProd && hasConfig;

                              if (isSynced) {
                                return (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Synced (BUDP)
                                    </span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-semibold">
                                      {existingBUDPProd?.sku}
                                    </span>
                                  </div>
                                );
                              }

                              // Jika dikirim tapi data mapping/produk hilang atau tidak lengkap (gagal verifikasi rekonsiliasi)
                              if (order.sentToBUDP) {
                                return (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-1 rounded-md border border-rose-200 dark:border-rose-800" title="Data produk atau konfigurasi variasi di Gudang BUDP tidak lengkap atau belum direkonsiliasi">
                                      ⚠ Sync Incomplete
                                    </span>
                                    <button
                                      onClick={() => handleSendToBUDP(order)}
                                      className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded-lg text-[9px] transition-all shadow-xs"
                                    >
                                      <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> Retry Sync
                                    </button>
                                  </div>
                                );
                              }

                              // Jika belum dikirim sama sekali
                              return (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                    Unsynced
                                  </span>
                                  <button
                                    onClick={() => handleSendToBUDP(order)}
                                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all shadow-xs"
                                  >
                                    <ArrowRightLeft className="w-3 h-3" /> Kirim BUDP
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatIDR(totalCost)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setPrintPoOrder(order)}
                                title="Print PO untuk Tim Produksi"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors flex items-center gap-1 font-semibold text-[11px]"
                              >
                                <Printer className="w-4 h-4" />
                                <span className="hidden sm:inline">PO</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(order)}
                                title="Edit Produksi"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {deleteConfirmationId === order.id ? (
                                <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-1 rounded-lg">
                                  <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold px-1">Hapus?</span>
                                  <button
                                    onClick={() => {
                                      deleteProductionOrder(order.id);
                                      setDeleteConfirmationId(null);
                                      triggerToast(`Sukses menghapus batch produksi ${order.productName}`, 'success');
                                    }}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded text-[10px]"
                                  >
                                    Ya
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmationId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold px-2 py-1 rounded text-[10px]"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmationId(order.id)}
                                  title="Hapus Data"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Resep & Formulasi BOM Section */
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[#00a96e]" />
              Formulasi & Bill of Materials (BOM)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(bomList || []).map((bom) => (
              <div key={bom.id} className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{bom.bomName}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{bom.code}</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {formatIDR(bom.estimatedCostPerUnit)} / Pcs
                  </span>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-600 pt-2 space-y-1 text-xs">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Daftar Bahan Baku Formulasi:</p>
                  {(bom.materials || []).map((m, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>• {m.materialName}</span>
                      <span className="font-mono font-semibold">{m.quantityNeeded} {m.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Tambah / Edit Produksi */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Perencanaan Produksi' : 'Tambah Perencanaan & Batch Produksi'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kode Batch Produksi
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Produk (Dari Bahan Baku) *
                  </label>
                  <select
                    required
                    value={formData.productName}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg font-medium"
                  >
                    <option value="">-- Pilih Produk --</option>
                    {allProductNames.map((name, i) => (
                      <option key={i} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Keterangan Bahan Baku & Resep BOM
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Katun Combed 30s + Benang Spun Polyester"
                    value={formData.bahanBaku}
                    onChange={(e) => setFormData({ ...formData, bahanBaku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg"
                  />
                </div>

                {selectedGroupDetails && selectedGroupDetails.materials && selectedGroupDetails.materials.length > 0 && (
                  <div className="bg-[#f0f7ff] dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧵</span>
                      <h3 className="font-bold text-[#1e40af] dark:text-blue-300 text-xs">
                        Bahan Baku yang Dibutuhkan
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-blue-100 dark:border-blue-900/40 text-slate-500 font-extrabold text-[10px] tracking-wider">
                            <th className="py-2 px-1 w-10 text-center">NO</th>
                            <th className="py-2 px-1">NAMA BAHAN</th>
                            <th className="py-2 px-1 text-center">PER PCS</th>
                            <th className="py-2 px-1">SATUAN</th>
                            <th className="py-2 px-1 text-right">BIAYA SATUAN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50/50 dark:divide-slate-800">
                          {selectedGroupDetails.materials.map((m, idx) => (
                            <tr key={m.id || idx} className="text-slate-700 dark:text-slate-300 hover:bg-blue-50/30 dark:hover:bg-slate-700/10 transition-colors">
                              <td className="py-2 px-1 text-center font-medium text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-1 font-bold text-slate-800 dark:text-slate-200">{m.name.toUpperCase()}</td>
                              <td className="py-2 px-1 text-center font-mono">{m.penggunaan}</td>
                              <td className="py-2 px-1">{m.satuan}</td>
                              <td className="py-2 px-1 text-right font-bold text-slate-900 dark:text-white">{formatIDR(m.biayaSatuan)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Size Breakdown Inputs */}
              <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Target Alokasi Size Breakdown (Pcs)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-11 gap-1.5">
                  {ALL_SIZES.map((sz) => (
                    <div key={sz.key} className="min-w-0">
                      <span className="block text-[10px] font-bold text-slate-500 mb-1 text-center truncate">
                        {sz.label}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={formData.sizeBreakdown[sz.key] || 0}
                        onChange={(e) => handleSizeChange(sz.key, parseInt(e.target.value) || 0)}
                        className="w-full px-1 py-1.5 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg font-mono text-xs focus:ring-1 focus:ring-[#00a96e] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-600 font-mono text-xs font-bold text-slate-900 dark:text-white">
                  <span>Total Kuantitas Target:</span>
                  <span className="text-[#00a96e] text-sm">{calculateTotalQty(formData.sizeBreakdown).toLocaleString()} Pcs</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Mulai Produksi
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Selesai (Due Date)
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status Produksi
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#00a96e]"
                >
                  <option value="Planning">Planning</option>
                  <option value="Dalam Proses">Dalam Proses</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Total Biaya Satuan (dari Bahan Baku)
                </label>
                <input
                  type="number"
                  value={formData.unitCost}
                  onChange={(e) => handleUnitCostChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-[#00a96e]"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Total Biaya Anggaran
                </label>
                <input
                  type="number"
                  value={formData.totalCost}
                  onChange={(e) => setFormData({ ...formData, totalCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-[#00a96e]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00a96e] hover:bg-[#00925f] active:bg-[#007a4f] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Produksi'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Print PO untuk Tim Produksi */}
      {printPoOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative space-y-6 text-slate-800 dark:text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 print:hidden">
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Purchase Order (PO) & Surat Perintah Kerja Produksi
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintDocument}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Cetak Dokumen
                </button>
                <button
                  onClick={() => setPrintPoOrder(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable PO Sheet */}
            <div id="printable-report" className="p-6 bg-white text-slate-900 rounded-xl border border-slate-200 space-y-6 shadow-sm print:border-none print:shadow-none print:p-0">
              
              {/* Header Surat */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">SURAT PERINTAH KERJA PRODUKSI (PO)</h1>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">Nomor PO: {printPoOrder.code || printPoOrder.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">ERP DIVISI PRODUKSI</p>
                  <p className="text-[11px] text-slate-500 font-mono">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
                </div>
              </div>

              {/* Detail Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <p><strong className="text-slate-600">Nama Produk:</strong> <span className="font-bold text-slate-900">{printPoOrder.productName}</span></p>
                  <p><strong className="text-slate-600">Batch Number:</strong> <span className="font-mono text-slate-900">{printPoOrder.batchNo || 'BATCH-GENERAL'}</span></p>
                  <p><strong className="text-slate-600">Status:</strong> <span className="px-2 py-0.5 bg-slate-100 font-bold rounded">{printPoOrder.status}</span></p>
                </div>
                <div className="space-y-1.5">
                  <p><strong className="text-slate-600">Tanggal Mulai:</strong> <span className="font-mono">{printPoOrder.startDate || '-'}</span></p>
                  <p><strong className="text-slate-600">Target Selesai (Due):</strong> <span className="font-mono">{printPoOrder.dueDate || '-'}</span></p>
                  <p><strong className="text-slate-600">Total Kuantitas:</strong> <span className="font-mono font-bold text-emerald-700">{(printPoOrder.totalQty || printPoOrder.quantityTarget || 0).toLocaleString()} Pcs</span></p>
                </div>
              </div>

              {/* Size Breakdown Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">Rincian Alokasi Ukuran (Size Breakdown)</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-1.5 text-center text-xs font-mono">
                  {ALL_SIZES.map((sz) => (
                    <div key={sz.key} className="p-1.5 bg-slate-100 rounded border border-slate-200 min-w-0">
                      <span className="block text-[9px] text-slate-500 font-sans font-bold truncate">{sz.label}</span>
                      <span className="font-bold text-slate-900">{printPoOrder.sizeBreakdown?.[sz.key] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bahan Baku / Resep */}
              <div className="space-y-3 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">Kebutuhan Bahan Baku & Catatan Produksi</h3>
                {(() => {
                  const printMatchedGroup = (rawMaterialGroups || []).find(
                    g => g.productName.toLowerCase() === printPoOrder.productName.toLowerCase()
                  );
                  const totalQty = printPoOrder.totalQty || printPoOrder.quantityTarget || 1;

                  if (printMatchedGroup && printMatchedGroup.materials && printMatchedGroup.materials.length > 0) {
                    return (
                      <div className="bg-[#f0f7ff] p-4 rounded-xl border border-blue-200 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🧵</span>
                          <h4 className="font-bold text-[#1e40af] text-xs">
                            Bahan Baku yang Dibutuhkan
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="border-b border-blue-100 text-slate-500 font-extrabold text-[10px] tracking-wider uppercase">
                                <th className="py-2 px-1 w-10 text-center">NO</th>
                                <th className="py-2 px-1">NAMA BAHAN</th>
                                <th className="py-2 px-1 text-center">PER PCS</th>
                                <th className="py-2 px-1 text-center">TOTAL KEBUTUHAN ({totalQty} Pcs)</th>
                                <th className="py-2 px-1">SATUAN</th>
                                <th className="py-2 px-1 text-right">BIAYA SATUAN</th>
                                <th className="py-2 px-1 text-right">TOTAL BIAYA</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                              {printMatchedGroup.materials.map((m, idx) => {
                                const penggunaanPerPcs = Number(m.penggunaan) || 0;
                                const totalKebutuhan = penggunaanPerPcs * totalQty;
                                const totalCost = totalKebutuhan * (m.biayaSatuan || 0);

                                return (
                                  <tr key={m.id || idx} className="text-slate-700 hover:bg-blue-50/30 transition-colors">
                                    <td className="py-2 px-1 text-center font-medium text-slate-400">{idx + 1}</td>
                                    <td className="py-2 px-1 font-bold text-slate-800">{m.name.toUpperCase()}</td>
                                    <td className="py-2 px-1 text-center font-mono">{m.penggunaan}</td>
                                    <td className="py-2 px-1 text-center font-mono font-bold text-blue-700">
                                      {totalKebutuhan.toLocaleString('id-ID', { maximumFractionDigits: 4 })}
                                    </td>
                                    <td className="py-2 px-1">{m.satuan}</td>
                                    <td className="py-2 px-1 text-right font-bold text-slate-900">{formatIDR(m.biayaSatuan)}</td>
                                    <td className="py-2 px-1 text-right font-bold text-emerald-700">{formatIDR(totalCost)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {printPoOrder.bahanBaku && printPoOrder.bahanBaku !== 'Standard Production Material Specification' && (
                          <div className="mt-2 pt-2 border-t border-blue-100/50 text-[10px] text-slate-500">
                            <strong>Catatan Tambahan:</strong> {printPoOrder.bahanBaku}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
                      {printPoOrder.bahanBaku || 'Standard Production Material Specification'}
                    </div>
                  );
                })()}
              </div>

              {/* Signature Section */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div>
                  <p className="text-slate-600 mb-16">Disetujui Oleh,</p>
                  <p className="font-bold border-b border-slate-400 pb-1">( Kepala Divisi Produksi )</p>
                </div>
                <div>
                  <p className="text-slate-600 mb-16">Diterima Oleh,</p>
                  <p className="font-bold border-b border-slate-400 pb-1">( Supervisor Pabrik / Gudang )</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Kosongkan Semua Data */}
      {showClearAllConfirmation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-base font-bold">Kosongkan Semua Data Produksi?</h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-slate-900 dark:white">seluruh {safeOrders.length} batch data produksi</strong>? Tindakan ini akan menghapus data perencanaan produksi secara permanen dari database Firestore dan tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirmation(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearAllOrders}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Ya, Kosongkan Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {customToast && (
        <div className={`fixed bottom-5 right-5 z-55 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border animate-bounce ${
          customToast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
        }`}>
          <span className="text-sm font-bold">
            {customToast.type === 'success' ? '✓' : '⚠'}
          </span>
          <p className="text-xs font-semibold">{customToast.message}</p>
        </div>
      )}

    </div>
  );
};
