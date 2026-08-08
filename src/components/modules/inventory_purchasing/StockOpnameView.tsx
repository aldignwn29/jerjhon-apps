import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  RefreshCw, 
  ArrowRightLeft, 
  FileText, 
  CheckCircle2, 
  Search, 
  Filter, 
  Plus, 
  ChevronDown, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  History, 
  Download, 
  User, 
  Layers, 
  MapPin, 
  Info,
  Sparkles,
  ClipboardList,
  Printer,
  X,
  Edit,
  Trash2
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { StockMovement, ProductItem } from '../../../types';
import { printSuratJalanPDF } from '../../../utils/exportUtils';

export const StockOpnameView: React.FC = () => {
  const { 
    stockMovements, 
    addStockMovement,
    updateStockMovement,
    deleteStockMovement,
    clearAllStockMovements,
    products, 
    updateProduct, 
    addAuditLog, 
    addNotification, 
    currentUser, 
    isStaff,
    formatIDR,
    // Variant config states
    sizeOptions,
    setSizeOptions,
    colorOptions,
    setColorOptions,
    sleeveOptions,
    setSleeveOptions,
    designOptions,
    setDesignOptions,
    variantPrices,
    setVariantPrices,
    variantStocks,
    sizeExtraPrices,
    setSizeExtraPrices,
    colorExtraPrices,
    setColorExtraPrices,
    sleeveExtraPrices,
    setSleeveExtraPrices,
    designExtraPrices,
    setDesignExtraPrices,
    setVariantStocks,
    variantCosts,
    setVariantCosts,
    availableWarehouses,
    stockOpnameHistories,
    addStockOpnameRecord,
    deleteStockOpnameRecord
  } = useERP();

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'audit' | 'opname' | 'history-opname' | 'mutation' | 'mutation-history'>('audit');
  const [opnameHistorySearch, setOpnameHistorySearch] = useState<string>('');
  const [opnameHistoryWarehouseFilter, setOpnameHistoryWarehouseFilter] = useState<string>('all');
  const [showDownloadOpnameModal, setShowDownloadOpnameModal] = useState<boolean>(false);
  const [downloadModalWarehouse, setDownloadModalWarehouse] = useState<string>('');
  const [previewSJModal, setPreviewSJModal] = useState<any>(null);

  // Filter & Search states for Riwayat Mutasi tab
  const [mutationHistoryFilter, setMutationHistoryFilter] = useState<string>('ALL');
  const [mutationHistorySearch, setMutationHistorySearch] = useState<string>('');

  // CRUD Modal State & Handlers for Audit Trail Log and Riwayat Mutasi
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<StockMovement | null>(null);
  const [crudForm, setCrudForm] = useState<{
    referenceNumber: string;
    date: string;
    type: StockMovement['type'];
    productSku: string;
    productName: string;
    quantity: number;
    sourceLocation: string;
    destinationLocation: string;
    operator: string;
  }>({
    referenceNumber: `SM-${Date.now().toString().slice(-5)}`,
    date: new Date().toISOString().substring(0, 10),
    type: 'Inbound Purchase',
    productSku: '',
    productName: '',
    quantity: 1,
    sourceLocation: 'Gudang Pusat (Jakarta)',
    destinationLocation: 'Gudang Cabang (Surabaya)',
    operator: currentUser?.name || 'Admin Gudang'
  });

  const handleOpenNewAuditModal = () => {
    setEditingMovement(null);
    const firstProd = products[0];
    setCrudForm({
      referenceNumber: `LOG-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().substring(0, 10),
      type: 'Inbound Purchase',
      productSku: firstProd?.sku || 'SKU-001',
      productName: firstProd?.name || 'Produk Contoh',
      quantity: 10,
      sourceLocation: 'Supplier / Vendor',
      destinationLocation: 'Gudang Pusat (Jakarta)',
      operator: currentUser?.name || 'Admin Gudang'
    });
    setIsCrudModalOpen(true);
  };

  const handleOpenNewTransferModal = () => {
    setEditingMovement(null);
    const firstProd = products[0];
    setCrudForm({
      referenceNumber: `SJ-TR-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().substring(0, 10),
      type: 'Warehouse Transfer',
      productSku: firstProd?.sku || 'SKU-001',
      productName: firstProd?.name || 'Produk Contoh',
      quantity: 10,
      sourceLocation: 'Gudang Pusat (Jakarta)',
      destinationLocation: 'Gudang Cabang (Surabaya)',
      operator: currentUser?.name || 'Admin Gudang'
    });
    setIsCrudModalOpen(true);
  };

  const handleOpenEditModal = (mov: StockMovement) => {
    setEditingMovement(mov);
    setCrudForm({
      referenceNumber: mov.referenceNumber || '',
      date: mov.date || new Date().toISOString().substring(0, 10),
      type: mov.type || 'Inbound Purchase',
      productSku: mov.productSku || '',
      productName: mov.productName || '',
      quantity: mov.quantity || 0,
      sourceLocation: mov.sourceLocation || '',
      destinationLocation: mov.destinationLocation || '',
      operator: mov.operator || ''
    });
    setIsCrudModalOpen(true);
  };

  const handleDeleteMovement = (mov: StockMovement) => {
    setDeleteConfirmModal(mov);
  };

  const confirmDeleteMovement = () => {
    if (deleteConfirmModal) {
      deleteStockMovement(deleteConfirmModal.id);
      triggerNotification('success', `Log mutasi "${deleteConfirmModal.referenceNumber}" berhasil dihapus!`);
      setDeleteConfirmModal(null);
    }
  };

  const handleProductSelectChange = (sku: string) => {
    const prod = products.find(p => p.sku === sku);
    if (prod) {
      setCrudForm(prev => ({
        ...prev,
        productSku: prod.sku,
        productName: prod.name
      }));
    } else {
      setCrudForm(prev => ({
        ...prev,
        productSku: sku
      }));
    }
  };

  const handleSubmitCrudForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crudForm.productName || crudForm.quantity <= 0) {
      triggerNotification('error', 'Mohon isi nama produk dan jumlah (qty) dengan benar.');
      return;
    }

    if (editingMovement) {
      updateStockMovement(editingMovement.id, {
        referenceNumber: crudForm.referenceNumber,
        date: crudForm.date,
        type: crudForm.type,
        productSku: crudForm.productSku,
        productName: crudForm.productName,
        quantity: Number(crudForm.quantity),
        sourceLocation: crudForm.sourceLocation,
        destinationLocation: crudForm.destinationLocation,
        operator: crudForm.operator
      });
      triggerNotification('success', `Log mutasi "${crudForm.referenceNumber}" berhasil diperbarui!`);
    } else {
      addStockMovement({
        referenceNumber: crudForm.referenceNumber,
        date: crudForm.date,
        type: crudForm.type,
        productSku: crudForm.productSku,
        productName: crudForm.productName,
        quantity: Number(crudForm.quantity),
        sourceLocation: crudForm.sourceLocation,
        destinationLocation: crudForm.destinationLocation,
        operator: crudForm.operator
      });
      triggerNotification('success', `Log mutasi baru "${crudForm.referenceNumber}" berhasil ditambahkan!`);
    }
    setIsCrudModalOpen(false);
  };

  // Custom Local Notification Banner (In-app alternative to browser alerts)
  const [localNotification, setLocalNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const triggerNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setLocalNotification({ type, message });
    // Scroll smoothly to top of the element to make sure the banner is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setLocalNotification(null);
    }, 6000);
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');

  // Form State - Stock Opname
  const [opnameWarehouse, setOpnameWarehouse] = useState<string>('');
  const [opnameProduct, setOpnameProduct] = useState<string>('');
  const [opnameVariant, setOpnameVariant] = useState<string>('');
  const [opnamePhysical, setOpnamePhysical] = useState<number | ''>('');
  const [opnameReason, setOpnameReason] = useState<string>('Selisih Fisik Audit Manual');
  const [opnameNotes, setOpnameNotes] = useState<string>('');
  const [opnamePIC, setOpnamePIC] = useState<string>(currentUser?.name || '');
  const [isSubmittingOpname, setIsSubmittingOpname] = useState(false);

  // Form State - Stock Mutation
  const [mutationSourceWh, setMutationSourceWh] = useState<string>('');
  const [mutationDestWh, setMutationDestWh] = useState<string>('');
  const [mutationProduct, setMutationProduct] = useState<string>('');
  const [mutationVariant, setMutationVariant] = useState<string>('');
  const [mutationQty, setMutationQty] = useState<number | ''>('');
  const [mutationNotes, setMutationNotes] = useState<string>('');
  const [isSubmittingMutation, setIsSubmittingMutation] = useState(false);
  const [mutationSelectedCombos, setMutationSelectedCombos] = useState<Record<string, boolean>>({});
  const [mutationBreakdownQtys, setMutationBreakdownQtys] = useState<Record<string, number | ''>>({});

  const [mutationCart, setMutationCart] = useState<any[]>([]);
  const [printSuratJalan, setPrintSuratJalan] = useState<any | null>(null);


  // Get unique warehouses from global availableWarehouses
  const warehouses = availableWarehouses;

  // Helper to generate combinations of variants (Combos)
  const getProductCombos = (pId: string) => {
    const pSizes = sizeOptions[pId] || ["-"];
    const pColors = colorOptions[pId] ? colorOptions[pId].map(c => typeof c === 'string' ? c : c.name) : ["-"];
    const pSleeves = sleeveOptions[pId] || ["-"];
    const pDesigns = designOptions[pId] || ["-"];

    const combos: { key: string; label: string; price: number; stock: number }[] = [];

    pSizes.forEach(sz => {
      pColors.forEach(col => {
        pSleeves.forEach(sl => {
          pDesigns.forEach(ds => {
            const labelParts: string[] = [];
            if (sz !== "-") labelParts.push(sz);
            if (col !== "-") labelParts.push(col);
            if (sl !== "-") labelParts.push(sl);
            if (ds !== "-") labelParts.push(ds);

            const label = labelParts.length > 0 ? labelParts.join(" - ") : "No Variant";
            const key = `${sz}-${col}-${sl}-${ds}`;
            
            const globalKey = `${pId}-${sz}-${col}-${sl}-${ds}`;
            let price = variantPrices[globalKey];
            if (price === undefined) {
              const base = products.find(p => p.id === pId)?.sellingPrice || 150000;
              const extraSize = sizeExtraPrices[pId]?.[sz] || 0;
              const extraColor = colorExtraPrices[pId]?.[col] || 0;
              const extraSleeve = sleeveExtraPrices[pId]?.[sl] || 0;
              const extraDesign = designExtraPrices[pId]?.[ds] || 0;
              price = base + extraSize + extraColor + extraSleeve + extraDesign;
            }

            let stock = variantStocks[globalKey];
            if (stock === undefined) {
              const baseProd = products.find(p => p.id === pId);
              stock = baseProd ? Math.floor(baseProd.stockQuantity / Math.max(1, pSizes.length * pColors.length)) : 100;
            }

            combos.push({ key, label, price, stock });
          });
        });
      });
    });

    return combos;
  };

  // Selected product options for Opname
  const selectedOpnameProductObj = useMemo(() => {
    return products.find(p => p.id === opnameProduct);
  }, [products, opnameProduct]);

  const opnameCombos = useMemo(() => {
    if (!opnameProduct) return [];
    return getProductCombos(opnameProduct);
  }, [opnameProduct, sizeOptions, colorOptions, sleeveOptions, designOptions]);

  // Selected variant obj for Opname
  const selectedOpnameComboObj = useMemo(() => {
    if (!opnameVariant || opnameCombos.length === 0) return null;
    return opnameCombos.find(c => c.key === opnameVariant) || null;
  }, [opnameVariant, opnameCombos]);

  // Calculated System Stock for Opname
  const systemStockVal = useMemo(() => {
    if (!selectedOpnameProductObj) return 0;
    if (opnameCombos.length > 0 && selectedOpnameComboObj) {
      const globalKey = `${opnameProduct}-${selectedOpnameComboObj.key}`;
      return variantStocks[globalKey] !== undefined ? variantStocks[globalKey] : selectedOpnameComboObj.stock;
    }
    return selectedOpnameProductObj.stockQuantity;
  }, [selectedOpnameProductObj, selectedOpnameComboObj, opnameProduct, variantStocks]);

  // Discrepancy for Opname
  const discrepancyVal = useMemo(() => {
    if (opnamePhysical === '') return 0;
    return opnamePhysical - systemStockVal;
  }, [opnamePhysical, systemStockVal]);

  // Selected product options for Mutation
  const selectedMutationProductObj = useMemo(() => {
    return products.find(p => p.id === mutationProduct);
  }, [products, mutationProduct]);

  const mutationCombos = useMemo(() => {
    if (!mutationProduct) return [];
    return getProductCombos(mutationProduct);
  }, [mutationProduct, sizeOptions, colorOptions, sleeveOptions, designOptions]);

  // Selected variant obj for Mutation
  const selectedMutationComboObj = useMemo(() => {
    if (!mutationVariant || mutationCombos.length === 0) return null;
    return mutationCombos.find(c => c.key === mutationVariant) || null;
  }, [mutationVariant, mutationCombos]);

  // Source stock for mutation
  const sourceStockVal = useMemo(() => {
    if (!selectedMutationProductObj) return 0;
    if (mutationCombos.length > 0 && selectedMutationComboObj) {
      const globalKey = `${mutationProduct}-${selectedMutationComboObj.key}`;
      return variantStocks[globalKey] !== undefined ? variantStocks[globalKey] : selectedMutationComboObj.stock;
    }
    return selectedMutationProductObj.stockQuantity;
  }, [selectedMutationProductObj, selectedMutationComboObj, mutationProduct, variantStocks]);

  // Download Form Stock Opname Excel Handler
  const handleDownloadOpnameForm = (selectedWh?: string) => {
    const whToUse = selectedWh !== undefined ? selectedWh : downloadModalWarehouse;
    const targetWh = whToUse || 'Semua_Gudang';
    const whProducts = whToUse && whToUse !== 'all' && whToUse !== ''
      ? products.filter(p => p.warehouse === whToUse)
      : products;

    if (whProducts.length === 0) {
      alert(`Tidak ada produk yang terdaftar${whToUse ? ` di gudang "${whToUse}"` : ''}.`);
      return;
    }

    const headers = [
      'No',
      'SKU Produk',
      'Nama Produk',
      'Kategori',
      'Gudang',
      'Varian',
      'Stok Sistem',
      'Stok Fisik (Diisi Petugas)',
      'Selisih',
      'Keterangan / Catatan'
    ];

    const rows: (string | number)[][] = [];
    let index = 1;

    whProducts.forEach(p => {
      const combos = getProductCombos(p.id);
      if (combos.length > 0) {
        combos.forEach(c => {
          const globalKey = `${p.id}-${c.key}`;
          const stock = variantStocks[globalKey] !== undefined ? variantStocks[globalKey] : c.stock;
          rows.push([
            index++,
            `${p.sku}-${c.key}`,
            p.name || '',
            p.category || '',
            p.warehouse || '',
            c.label,
            stock,
            '',
            '',
            ''
          ]);
        });
      } else {
        rows.push([
          index++,
          p.sku,
          p.name || '',
          p.category || '',
          p.warehouse || '',
          '- (Tanpa Varian)',
          p.stockQuantity,
          '',
          '',
          ''
        ]);
      }
    });

    const aoa = [
      [`FORM STOCK OPNAME GUDANG: ${targetWh}`],
      [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
      [`Petugas / Auditor: ${opnamePIC || currentUser?.name || 'Staff Gudang'}`],
      [],
      headers,
      ...rows
    ];

    try {
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Opname');
      XLSX.writeFile(workbook, `Form_Stock_Opname_${targetWh.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);

      addNotification('Download Berhasil', `Form Stock Opname Gudang "${targetWh}" berhasil diunduh dalam format Excel (.xlsx).`, 'success', 'StockOpnameView');
    } catch (err) {
      console.error('Download error:', err);
      alert('Gagal mengunduh file Excel (.xlsx). Silakan coba lagi.');
    }
  };

  // Submit Handler for Stock Opname
  const handleSubmitOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opnameProduct || opnamePhysical === '' || isSubmittingOpname) return;

    setIsSubmittingOpname(true);
    try {
      const product = selectedOpnameProductObj!;
      const combo = selectedOpnameComboObj;
      const physicalVal = Number(opnamePhysical);
      const disc = physicalVal - systemStockVal;

      const movementId = `MOV-OPN-${Date.now().toString().slice(-6)}`;
      const refNo = `OPN-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Prepare movement object
      const newMovement: StockMovement = {
        id: movementId,
        productSku: product.sku + (combo ? `-${combo.key}` : ''),
        productName: product.name + (combo ? ` (${combo.label})` : ''),
        type: 'Stock Opname Adjustment',
        quantity: Math.abs(disc),
        sourceLocation: disc < 0 ? product.warehouse : 'Adjustment Source (Auditor)',
        destinationLocation: disc < 0 ? 'Adjustment Loss (Audit)' : product.warehouse,
        date: new Date().toISOString().substring(0, 10),
        operator: opnamePIC || currentUser?.name || 'System Auditor',
        referenceNumber: `${refNo} (${opnameReason}: ${opnameNotes})`
      };

      // 2. Save movement directly to state
      addStockMovement(newMovement);

      // 3. Record Stock Opname History
      addStockOpnameRecord({
        referenceNumber: refNo,
        date: new Date().toISOString().substring(0, 10),
        warehouse: opnameWarehouse || product.warehouse || 'Gudang Pusat',
        productSku: product.sku + (combo ? `-${combo.key}` : ''),
        productName: product.name,
        variantLabel: combo ? combo.label : undefined,
        systemStock: systemStockVal,
        physicalStock: physicalVal,
        difference: disc,
        reason: opnameReason,
        notes: opnameNotes,
        operator: opnamePIC || currentUser?.name || 'System Auditor'
      });

      // 3. Update variant stock or product stock
      if (combo) {
        const globalKey = `${opnameProduct}-${combo.key}`;
        const updatedVariantStocks = { ...variantStocks, [globalKey]: physicalVal };
        setVariantStocks(updatedVariantStocks);

        // Save total stock for product
        const combosForThis = getProductCombos(opnameProduct);
        const newTotalStock = combosForThis.reduce((acc, c) => {
          if (c.key === combo.key) return acc + physicalVal;
          const gK = `${opnameProduct}-${c.key}`;
          return acc + (variantStocks[gK] !== undefined ? variantStocks[gK] : c.stock);
        }, 0);

        let status: ProductItem['status'] = 'Ready';
        if (newTotalStock === 0) status = 'Out of Stock';
        else if (newTotalStock < product.safetyStock) status = 'Low Stock';

        updateProduct(opnameProduct, { 
          stockQuantity: newTotalStock, 
          status,
          lastUpdated: new Date().toISOString().substring(0, 10)
        });
      } else {
        let status: ProductItem['status'] = 'Ready';
        if (physicalVal === 0) status = 'Out of Stock';
        else if (physicalVal < product.safetyStock) status = 'Low Stock';

        updateProduct(opnameProduct, { 
          stockQuantity: physicalVal, 
          status,
          lastUpdated: new Date().toISOString().substring(0, 10)
        });
      }

      // Audit Log & Notification
      addAuditLog(
        'STOCK_OPNAME_ADJUSTMENT', 
        'Inventory', 
        `Adjusted stock for ${product.name} from ${systemStockVal} to ${physicalVal} Pcs. Reason: ${opnameReason}`
      );

      addNotification(
        'Stock Opname Berhasil',
        `Stok ${product.name} telah disesuaikan menjadi ${physicalVal} Pcs oleh ${opnamePIC}.`,
        'success',
        'StockOpnameView'
      );

      // Reset form
      setOpnameWarehouse('');
      setOpnameProduct('');
      setOpnameVariant('');
      setOpnamePhysical('');
      setOpnameNotes('');
      triggerNotification('success', 'Stock Opname berhasil disimpan dan mutasi telah dicatat!');
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Gagal melakukan penyesuaian stok.');
    } finally {
      setIsSubmittingOpname(false);
    }
  };

  // Submit Handler for Stock Mutation (Warehouse Transfer)
  

  const handlePrintSJ = (mov: any) => {
    // Group all movements with the same reference number and source/destination
    const relatedMovements = stockMovements.filter(m => 
      m.referenceNumber === mov.referenceNumber && 
      m.type === mov.type &&
      m.sourceLocation === mov.sourceLocation &&
      m.destinationLocation === mov.destinationLocation
    );

    let itemsList: any[] = [];
    if (mov.items && Array.isArray(mov.items) && mov.items.length > 0) {
      itemsList = mov.items;
    } else if (relatedMovements.length > 0) {
      itemsList = relatedMovements.map(m => ({
        productSku: m.productSku,
        productName: m.productName,
        quantity: m.quantity
      }));
    } else {
      itemsList = [{
        productSku: mov.productSku,
        productName: mov.productName,
        quantity: mov.quantity
      }];
    }

    const consolidatedSJ = {
      ...mov,
      items: itemsList
    };

    setPreviewSJModal(consolidatedSJ);
    printSuratJalanPDF(consolidatedSJ);
  };

  const handleAddToCart = () => {
    if (!mutationProduct || !mutationSourceWh || mutationQty === '') return;
    const qtyVal = Number(mutationQty);
    const sourceProd = selectedMutationProductObj!;
    
    if (mutationVariant === 'ALL_VARIANTS') {
      const newItems: any[] = [];
      let errors = 0;
      
      mutationCombos.forEach(combo => {
        if (qtyVal > combo.stock) {
           errors++;
           return;
        }
        const exists = mutationCart.find(c => c.globalKey === `${sourceProd.id}-${combo.key}`);
        if (!exists) {
          newItems.push({
             id: sourceProd.id,
             sku: sourceProd.sku,
             name: sourceProd.name,
             variantKey: combo.key,
             variantLabel: combo.label,
             qty: qtyVal,
             sourceStock: combo.stock,
             globalKey: `${sourceProd.id}-${combo.key}`,
             unitCost: sourceProd.unitCostPrice,
             sellingPrice: sourceProd.sellingPrice,
             minimumStock: sourceProd.minimumStock,
             safetyStock: sourceProd.safetyStock,
             category: sourceProd.category,
             unit: sourceProd.unit
          });
        }
      });
      
      if (newItems.length > 0) {
         setMutationCart([...mutationCart, ...newItems]);
         triggerNotification('success', `Berhasil menambahkan ${newItems.length} varian ke daftar mutasi.`);
         setMutationVariant('');
         setMutationQty('');
      } else if (errors > 0) {
         triggerNotification('error', `Gagal: Stok tidak mencukupi untuk bbrp varian, atau semua varian sdh ada di daftar.`);
      } else {
         triggerNotification('info', `Semua varian sudah ada di daftar mutasi.`);
      }
      return;
    }

    if (qtyVal > sourceStockVal) {
      triggerNotification('error', 'Stok di Gudang Asal tidak mencukupi!');
      return;
    }
    const combo = selectedMutationComboObj;
    
    // Check if already in cart
    const exists = mutationCart.find(c => c.globalKey === (combo?.key ? `${sourceProd.id}-${combo.key}` : sourceProd.id));
    if (exists) {
      triggerNotification('error', 'Produk ini sudah ada di daftar mutasi!');
      return;
    }

    setMutationCart([...mutationCart, {
      id: sourceProd.id,
      sku: sourceProd.sku,
      name: sourceProd.name,
      variantKey: combo?.key || '',
      variantLabel: combo?.label || 'Default Varian',
      qty: qtyVal,
      sourceStock: sourceStockVal,
      globalKey: combo?.key ? `${sourceProd.id}-${combo.key}` : sourceProd.id,
      unitCost: sourceProd.unitCostPrice,
      sellingPrice: sourceProd.sellingPrice,
      minimumStock: sourceProd.minimumStock,
      safetyStock: sourceProd.safetyStock,
      category: sourceProd.category,
      unit: sourceProd.unit
    }]);
    
    setMutationVariant('');
    setMutationQty('');
  };

  const handleAddBreakdownToCart = () => {
    if (!mutationProduct || !mutationSourceWh) return;
    const sourceProd = selectedMutationProductObj;
    if (!sourceProd) return;

    const newItems: any[] = [];
    let errors = 0;
    let addedCount = 0;
    let updatedCount = 0;

    mutationCombos.forEach(combo => {
      const isSelected = !!mutationSelectedCombos[combo.key];
      const rawQty = mutationBreakdownQtys[combo.key];
      const qtyVal = Number(rawQty) || 0;

      if (isSelected && qtyVal > 0) {
        const globalKey = `${mutationProduct}-${combo.key}`;
        const availStock = variantStocks[globalKey] !== undefined ? variantStocks[globalKey] : combo.stock;

        if (qtyVal > availStock) {
          errors++;
          return;
        }

        const existingIndex = mutationCart.findIndex(c => c.globalKey === globalKey);
        if (existingIndex >= 0) {
          mutationCart[existingIndex].qty = qtyVal;
          updatedCount++;
        } else {
          newItems.push({
             id: sourceProd.id,
             sku: sourceProd.sku,
             name: sourceProd.name,
             variantKey: combo.key,
             variantLabel: combo.label,
             qty: qtyVal,
             sourceStock: availStock,
             globalKey: globalKey,
             unitCost: sourceProd.unitCostPrice,
             sellingPrice: sourceProd.sellingPrice,
             minimumStock: sourceProd.minimumStock,
             safetyStock: sourceProd.safetyStock,
             category: sourceProd.category,
             unit: sourceProd.unit
          });
          addedCount++;
        }
      }
    });

    if (newItems.length > 0 || updatedCount > 0) {
      const updatedCart = [...mutationCart];
      newItems.forEach(item => updatedCart.push(item));
      setMutationCart(updatedCart);
      triggerNotification('success', `Berhasil memproses mutasi (${addedCount} baru ditambahkan, ${updatedCount} diperbarui) dari breakdown QTY.`);
      setMutationSelectedCombos({});
      setMutationBreakdownQtys({});
    } else if (errors > 0) {
      triggerNotification('error', 'Gagal: Jumlah mutasi melebihi stok yang tersedia di gudang asal.');
    } else {
      triggerNotification('error', 'Pilih minimal satu varian checkbox dan isi Jumlah Mutasi (QTY) > 0.');
    }
  };

  const handleRemoveFromCart = (globalKey: string) => {
    setMutationCart(mutationCart.filter(c => c.globalKey !== globalKey));
  };

  const handleSubmitMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mutationCart.length === 0 || !mutationSourceWh || !mutationDestWh || isSubmittingMutation) return;
    
    if (mutationSourceWh === mutationDestWh) {
      triggerNotification('error', 'Gudang Asal dan Tujuan harus berbeda!');
      return;
    }

    setIsSubmittingMutation(true);

    try {
      let updatedVariantStocks = { ...variantStocks };
      const productStockUpdates: Record<string, number> = {};

      const sharedRefNumber = mutationNotes || `TRF-${Date.now()}`;
      const allMutationItems = mutationCart.map(i => ({
        productSku: i.variantKey ? `${i.sku}-${i.variantKey}` : i.sku,
        productName: `${i.name} ${i.variantLabel !== 'Default Varian' ? `(${i.variantLabel})` : ''}`,
        quantity: i.qty
      }));

      for (const item of mutationCart) {
        // Find if destination product exists
        let destProd = products.find(p => p.sku === item.sku && p.warehouse === mutationDestWh);
        const sourceProdId = item.id;
        
        if (!destProd) {
          // Self-heal: Create a new product item in the destination warehouse
          const newDestId = `PROD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
          destProd = {
            id: newDestId,
            sku: item.sku,
            name: item.name,
            category: item.category,
            warehouse: mutationDestWh,
            stockQuantity: 0,
            minimumStock: item.minimumStock,
            safetyStock: item.safetyStock,
            unitCostPrice: item.unitCost,
            sellingPrice: item.sellingPrice,
            unit: item.unit,
            status: 'Out of Stock',
            lastUpdated: new Date().toISOString().substring(0, 10)
          };
          
          await updateProduct(newDestId, destProd);

          // Copy variant configurations to the new product ID so they render correctly in the destination warehouse
          if (sizeOptions[sourceProdId]) {
            setSizeOptions(prev => ({ ...prev, [newDestId]: sizeOptions[sourceProdId] }));
          }
          if (colorOptions[sourceProdId]) {
            setColorOptions(prev => ({ ...prev, [newDestId]: colorOptions[sourceProdId] }));
          }
          if (sleeveOptions[sourceProdId]) {
            setSleeveOptions(prev => ({ ...prev, [newDestId]: sleeveOptions[sourceProdId] }));
          }
          if (designOptions[sourceProdId]) {
            setDesignOptions(prev => ({ ...prev, [newDestId]: designOptions[sourceProdId] }));
          }
          if (sizeExtraPrices[sourceProdId]) {
            setSizeExtraPrices(prev => ({ ...prev, [newDestId]: sizeExtraPrices[sourceProdId] }));
          }
          if (colorExtraPrices[sourceProdId]) {
            setColorExtraPrices(prev => ({ ...prev, [newDestId]: colorExtraPrices[sourceProdId] }));
          }
          if (sleeveExtraPrices[sourceProdId]) {
            setSleeveExtraPrices(prev => ({ ...prev, [newDestId]: sleeveExtraPrices[sourceProdId] }));
          }
          if (designExtraPrices[sourceProdId]) {
            setDesignExtraPrices(prev => ({ ...prev, [newDestId]: designExtraPrices[sourceProdId] }));
          }
        }

        const destProdId = destProd.id;
        const qtyVal = item.qty;

        if (item.variantKey) {
          // Handle variant stocks
          const sourceGlobalKey = item.globalKey;
          const destGlobalKey = `${destProdId}-${item.variantKey}`;
          
          const currentSourceVarStock = updatedVariantStocks[sourceGlobalKey] !== undefined ? updatedVariantStocks[sourceGlobalKey] : (variantStocks[sourceGlobalKey] || 0);
          const currentDestVarStock = updatedVariantStocks[destGlobalKey] !== undefined ? updatedVariantStocks[destGlobalKey] : (variantStocks[destGlobalKey] || 0);
          
          updatedVariantStocks[sourceGlobalKey] = Math.max(0, currentSourceVarStock - qtyVal);
          updatedVariantStocks[destGlobalKey] = currentDestVarStock + qtyVal;

          // Copy price and cost for the variant key to destination if they exist
          const srcGlobalKey = `${sourceProdId}-${item.variantKey}`;
          const dstGlobalKey = `${destProdId}-${item.variantKey}`;
          if (variantPrices[srcGlobalKey] !== undefined) {
            setVariantPrices(prev => ({ ...prev, [dstGlobalKey]: variantPrices[srcGlobalKey] }));
          }
          if (variantCosts[srcGlobalKey] !== undefined) {
            setVariantCosts(prev => ({ ...prev, [dstGlobalKey]: variantCosts[srcGlobalKey] }));
          }

          // Accumulate updated product total stocks
          const sourceCombos = getProductCombos(sourceProdId);
          const nextSourceTotalStock = sourceCombos.reduce((acc, c) => {
            const gK = `${sourceProdId}-${c.key}`;
            const stock = updatedVariantStocks[gK] !== undefined ? updatedVariantStocks[gK] : c.stock;
            return acc + stock;
          }, 0);
          productStockUpdates[sourceProdId] = nextSourceTotalStock;

          const nextDestTotalStock = sourceCombos.reduce((acc, c) => {
            const gK = `${destProdId}-${c.key}`;
            const stock = updatedVariantStocks[gK] !== undefined ? updatedVariantStocks[gK] : 0;
            return acc + stock;
          }, 0);
          productStockUpdates[destProdId] = nextDestTotalStock;
        } else {
          // Handle default product stocks (no variants)
          const currentSourceStock = productStockUpdates[sourceProdId] !== undefined ? productStockUpdates[sourceProdId] : (products.find(p => p.id === sourceProdId)?.stockQuantity || 0);
          const currentDestStock = productStockUpdates[destProdId] !== undefined ? productStockUpdates[destProdId] : destProd.stockQuantity;
          
          productStockUpdates[sourceProdId] = Math.max(0, currentSourceStock - qtyVal);
          productStockUpdates[destProdId] = currentDestStock + qtyVal;
        }
        
        // Add to Stock Movements so it shows in the Riwayat Mutasi table and can print Surat Jalan!
        addStockMovement({
          productSku: item.variantKey ? `${item.sku}-${item.variantKey}` : item.sku,
          productName: `${item.name} ${item.variantLabel !== 'Default Varian' ? `(${item.variantLabel})` : ''}`,
          type: 'Warehouse Transfer',
          quantity: qtyVal,
          sourceLocation: mutationSourceWh,
          destinationLocation: mutationDestWh,
          date: new Date().toISOString().substring(0, 10),
          operator: currentUser?.name || 'Unknown User',
          referenceNumber: sharedRefNumber,
          items: allMutationItems
        });
      }

      // 2. Commit variant stocks state
      setVariantStocks(updatedVariantStocks);

      // 3. Commit product stock quantities to the database
      for (const [pId, nextStock] of Object.entries(productStockUpdates)) {
        const prod = products.find(p => p.id === pId);
        let safetyStock = prod?.safetyStock || 0;
        let status: ProductItem['status'] = 'Ready';
        if (nextStock === 0) status = 'Out of Stock';
        else if (nextStock < safetyStock) status = 'Low Stock';

        await updateProduct(pId, {
          stockQuantity: nextStock,
          status,
          lastUpdated: new Date().toISOString().substring(0, 10)
        });
      }

      triggerNotification('success', `Berhasil memindahkan ${mutationCart.length} jenis item dari ${mutationSourceWh} ke ${mutationDestWh}`);
      
      // Reset
      setMutationCart([]);
      setMutationNotes('');
      setMutationProduct('');
      setMutationVariant('');
      setMutationQty('');
    } catch (err) {
      console.error("Error during mutation:", err);
      triggerNotification('error', 'Terjadi kesalahan sistem saat mutasi stok!');
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  // Filter and Search log
  const filteredMovements = useMemo(() => {
    return (stockMovements || []).filter(mov => {
      const matchSearch = 
        (mov.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.productSku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.operator || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'all' || mov.type === typeFilter;
      const matchWh = warehouseFilter === 'all' || 
        mov.sourceLocation === warehouseFilter || 
        mov.destinationLocation === warehouseFilter;

      return matchSearch && matchType && matchWh;
    });
  }, [stockMovements, searchTerm, typeFilter, warehouseFilter]);

  // Analytics helper from filtered movements
  const statsSummary = useMemo(() => {
    const totalMovs = filteredMovements.length;
    const opnameAdjustments = filteredMovements.filter(m => m.type === 'Stock Opname Adjustment');
    const transfers = filteredMovements.filter(m => m.type === 'Warehouse Transfer');
    const totalQtyAdjusted = opnameAdjustments.reduce((acc, m) => acc + m.quantity, 0);
    const totalQtyTransferred = transfers.reduce((acc, m) => acc + m.quantity, 0);

    return {
      totalMovs,
      totalQtyAdjusted,
      totalQtyTransferred,
      opnameCount: opnameAdjustments.length,
      transferCount: transfers.length
    };
  }, [filteredMovements]);

  // Export logs to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Reference', 'Tanggal', 'Tipe', 'Produk/SKU', 'Qty', 'Asal', 'Tujuan', 'Operator'];
    const rows = filteredMovements.map(m => [
      m.id,
      m.referenceNumber,
      m.date,
      m.type,
      m.productName,
      m.quantity,
      m.sourceLocation,
      m.destinationLocation,
      m.operator
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Mutasi_Stok_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <RoleAccessBanner moduleName="Stock Opname & Mutasi Stok" />

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
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
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
                Inventory Control
              </span>
              <span className="bg-emerald-500/25 text-emerald-200 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Real-time Sync
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Stock Opname & Mutasi Gudang</h2>
            <p className="text-slate-200 text-xs max-w-xl">
              Lakukan pencatatan penyesuaian fisik vs sistem, pergerakan stock opname, & mutasi stock transfer antar-gudang (inter-warehouse) secara instan.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              Audit Trail Log
            </button>
            <button 
              onClick={() => setActiveTab('opname')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'opname' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              Stock Opname (Fisik)
            </button>
            <button 
              onClick={() => setActiveTab('mutation')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'mutation' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              Mutasi Gudang
            </button>
            <button 
              onClick={() => setActiveTab('mutation-history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'mutation-history' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              Riwayat Mutasi
            </button>
            <button 
              onClick={() => setActiveTab('history-opname')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'history-opname' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              Riwayat Opname
            </button>
          </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Total Pergerakan Stok</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-950 dark:text-white">{statsSummary.totalMovs}</span>
            <span className="text-xs text-slate-500">Record</span>
          </div>
          <p className="text-[10px] text-slate-400">Total mutasi, transfer & opname yang disaring</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-amber-500 font-bold block">Total Opname Fisik</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{statsSummary.opnameCount}</span>
            <span className="text-xs text-slate-500">Pencocokan</span>
          </div>
          <p className="text-[10px] text-slate-400">Total penyesuaian fisik vs sistem</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-blue-500 font-bold block">Mutasi Antar-Gudang</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{statsSummary.transferCount}</span>
            <span className="text-xs text-slate-500">Mutasi</span>
          </div>
          <p className="text-[10px] text-slate-400">Perpindahan stok inter-warehouse</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold block">Volumetrik Mutasi</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {statsSummary.totalQtyAdjusted + statsSummary.totalQtyTransferred}
            </span>
            <span className="text-xs text-slate-500">Pcs</span>
          </div>
          <p className="text-[10px] text-slate-400">Volume barang bergerak yang tercatat</p>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-red-600" />
                Audit Trail Log Mutasi & Pergerakan Stok
              </h3>
              <p className="text-[11px] text-slate-500">Lacak setiap keluar masuk barang, penyesuaian opname, dan pengiriman supplier.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenNewAuditModal}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Catat Log Mutasi
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-750">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU, Nama Produk, PIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="all">Semua Tipe Pergerakan</option>
                <option value="Inbound Purchase">Inbound Purchase (Masuk)</option>
                <option value="Outbound Sales">Outbound Sales (Keluar)</option>
                <option value="Warehouse Transfer">Warehouse Transfer (Mutasi)</option>
                <option value="Stock Opname Adjustment">Stock Opname Adjustment (Koreksi)</option>
                <option value="Production Consumption">Production Consumption (Produksi)</option>
              </select>
            </div>

            <div>
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="all">Semua Lokasi Gudang</option>
                {warehouses.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-100 dark:border-slate-750 rounded-xl">
            <table className="whitespace-nowrap min-w-full w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-750 text-slate-500 font-bold">
                  <th className="p-3 uppercase text-[10px]">Referensi & Tanggal</th>
                  <th className="p-3 uppercase text-[10px]">Tipe Mutasi</th>
                  <th className="p-3 uppercase text-[10px]">Produk & SKU</th>
                  <th className="p-3 uppercase text-[10px] text-right">Jumlah (Qty)</th>
                  <th className="p-3 uppercase text-[10px]">Pergerakan Lokasi</th>
                  <th className="p-3 uppercase text-[10px]">Operator PIC</th>
                  <th className="p-3 uppercase text-[10px] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Tidak ada pergerakan stok yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                      <td className="p-3 space-y-1">
                        <span className="font-mono font-extrabold text-slate-950 dark:text-slate-100 block">{mov.referenceNumber}</span>
                        <span className="font-mono text-[10px] text-slate-400 block">{mov.date}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                          mov.type === 'Inbound Purchase' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' :
                          mov.type === 'Outbound Sales' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' :
                          mov.type === 'Warehouse Transfer' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300' :
                          mov.type === 'Stock Opname Adjustment' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' :
                          'bg-slate-50 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300'
                        }`}>
                          {mov.type}
                        </span>
                      </td>
                      <td className="p-3 space-y-0.5">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">{mov.productName}</span>
                        <span className="font-mono text-[10px] text-slate-400 block">{mov.productSku}</span>
                      </td>
                      <td className="p-3 font-black text-right text-slate-900 dark:text-white pr-6">
                        {mov.type === 'Stock Opname Adjustment' ? (
                          <span className={mov.referenceNumber.includes('Reason') && !mov.sourceLocation.includes('Auditor') ? 'text-red-500' : 'text-slate-900 dark:text-white'}>
                            {mov.quantity} Pcs
                          </span>
                        ) : (
                          <span>{mov.quantity} Pcs</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                            {mov.sourceLocation}
                          </span>
                          <span className="text-slate-400 font-bold">→</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100 bg-red-50 dark:bg-red-950/20 text-[#b90f0f] px-1.5 py-0.5 rounded border border-red-100/50 dark:border-red-900/30">
                            {mov.destinationLocation}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {mov.operator.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{mov.operator}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(mov)}
                            title="Edit log mutasi"
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMovement(mov)}
                            title="Hapus log mutasi"
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'opname' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-750">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-red-600" />
                  Form Pencatatan Stock Opname Fisik
                </h3>
                <p className="text-[11px] text-slate-500">Isi formulir ini saat melakukan stock opname fisik gudang untuk memperbarui sistem secara presisi.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDownloadOpnameModal(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold shadow-sm transition-all text-xs shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Form Opname
              </button>
            </div>

            <form onSubmit={handleSubmitOpname} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Gudang</label>
                  <select
                    value={opnameWarehouse}
                    onChange={(e) => {
                      setOpnameWarehouse(e.target.value);
                      setOpnameProduct('');
                      setOpnameVariant('');
                      setOpnamePhysical('');
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl"
                  >
                    <option value="">-- Semua Gudang --</option>
                    {warehouses.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Produk</label>
                  <select
                    value={opnameProduct}
                    onChange={(e) => {
                      setOpnameProduct(e.target.value);
                      setOpnameVariant('');
                      setOpnamePhysical('');
                      if (!opnameWarehouse) {
                        const prod = products.find(p => p.id === e.target.value);
                        if (prod && prod.warehouse) {
                          setOpnameWarehouse(prod.warehouse);
                        }
                      }
                    }}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl"
                  >
                    <option value="">-- Pilih Produk Master --</option>
                    {products
                      .filter(p => !opnameWarehouse || p.warehouse === opnameWarehouse)
                      .map((p, idx) => (
                        <option key={`${p.id}-${p.sku || ''}-${idx}`} value={p.id}>
                          [{p.sku}] {p.name} {!opnameWarehouse ? `(${p.warehouse})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Varian (Kombinasi)</label>
                  <select
                    value={opnameVariant}
                    onChange={(e) => {
                      setOpnameVariant(e.target.value);
                      setOpnamePhysical('');
                    }}
                    disabled={!opnameProduct || opnameCombos.length === 0}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl disabled:opacity-50"
                  >
                    <option value="">-- Tanpa Varian / Default --</option>
                    {opnameCombos.map(c => (
                      <option key={c.key} value={c.key}>
                        {c.label} (Stok Sistem: {c.stock} Pcs)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {opnameProduct && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-750 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">SKU Terpilih</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedOpnameProductObj?.sku}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Gudang Penyimpanan</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#b90f0f]" />
                      {selectedOpnameProductObj?.warehouse}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Stok Sistem</span>
                    <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">
                      {systemStockVal} Pcs
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Kategori</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedOpnameProductObj?.category}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Jumlah Stok Fisik Aktual</label>
                  <input
                    type="number"
                    min={0}
                    value={opnamePhysical}
                    onChange={(e) => setOpnamePhysical(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    disabled={!opnameProduct}
                    placeholder="Masukkan hasil hitung fisik"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl font-mono text-base font-bold disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Alasan Penyesuaian</label>
                  <select
                    value={opnameReason}
                    onChange={(e) => setOpnameReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl"
                  >
                    <option value="Selisih Fisik Audit Manual">Selisih Fisik Audit Manual</option>
                    <option value="Barang Rusak / Defect">Barang Rusak / Defect</option>
                    <option value="Barang Hilang / Shrinkage">Barang Hilang / Shrinkage</option>
                    <option value="Koreksi Input Sistem">Koreksi Input Sistem</option>
                    <option value="Retur Pelanggan (Rusak)">Retur Pelanggan (Rusak)</option>
                    <option value="Hadiah / Sampling">Hadiah / Sampling</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">PIC Operator Auditor</label>
                  <input
                    type="text"
                    value={opnamePIC}
                    onChange={(e) => setOpnamePIC(e.target.value)}
                    required
                    placeholder="Nama PIC Auditor"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Catatan Penyesuaian / Temuan Lapangan</label>
                <textarea
                  value={opnameNotes}
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  placeholder="Contoh: Ditemukan 2 box jersey sobek di tumpukan baris belakang..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl"
                />
              </div>

              {opnameProduct && opnamePhysical !== '' && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                  discrepancyVal === 0 
                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200' 
                    : discrepancyVal < 0 
                      ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-150 text-rose-800 dark:text-rose-300' 
                      : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150 text-emerald-800 dark:text-emerald-300'
                }`}>
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-extrabold block">Hasil Analisa Selisih Stok</span>
                    <p className="font-medium mt-0.5">
                      {discrepancyVal === 0 ? (
                        <span>Stok fisik cocok dengan sistem (0 Selisih).</span>
                      ) : discrepancyVal < 0 ? (
                        <span>Terjadi **Minus {Math.abs(discrepancyVal)} Pcs** (Barang Hilang/Rusak). HPP produk akan dicatat sebagai kerugian penyusutan.</span>
                      ) : (
                        <span>Terjadi **Surplus +{discrepancyVal} Pcs** (Kelebihan Fisik). Stok sistem akan bertambah.</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-slate-750">
                <button
                  type="button"
                  onClick={() => {
                    setOpnameProduct('');
                    setOpnameVariant('');
                    setOpnamePhysical('');
                    setOpnameNotes('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!opnameProduct || opnamePhysical === '' || isSubmittingOpname || isStaff}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingOpname ? 'Menyimpan...' : 'Eksekusi & Update Stok'}
                </button>
              </div>
            </form>
          </div>

          {/* Guidelines */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
              SOP & Pedoman Audit Stok
            </h4>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="bg-red-50 text-red-600 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Hitung Fisik Double-Count</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Selalu lakukan perhitungan fisik oleh minimal dua staff auditor berbeda untuk mencegah bias.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-red-50 text-red-600 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Isolasi Barang Rusak</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Barang yang rusak secara fisik jangan digabung dalam hitungan Ready. Catat di kolom alasan khusus.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-red-50 text-red-600 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Otorisasi Supervisor</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Penyesuaian stok bernilai di atas Rp 5.000.000 wajib divalidasi oleh Kepala Gudang atau SPV.</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-red-50/50 dark:bg-red-950/15 rounded-xl border border-red-100 dark:border-red-900/30 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-[#b90f0f] shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                Sistem mendeteksi jika data di-update, log audit akan dicatat otomatis secara permanen untuk kepatuhan ISO 9001.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mutation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-red-600" />
                Mutasi Stok Inter-Warehouse (Transfer Gudang)
              </h3>
              <p className="text-[11px] text-slate-500">Gunakan fitur ini untuk memindahkan stok fisik barang dari satu gudang ke gudang cabang lainnya secara legal.</p>
            </div>
            
            <form onSubmit={handleSubmitMutation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Gudang Asal (Source)</label>
                  <select
                    value={mutationSourceWh}
                    onChange={(e) => {
                      setMutationSourceWh(e.target.value);
                      setMutationProduct('');
                      setMutationVariant('');
                      setMutationQty('');
                      setMutationCart([]); // Reset cart when changing source
                    }}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl"
                  >
                    <option value="">-- Pilih Gudang Asal --</option>
                    {warehouses.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Gudang Tujuan (Destination)</label>
                  <select
                    value={mutationDestWh}
                    onChange={(e) => setMutationDestWh(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl"
                  >
                    <option value="">-- Pilih Gudang Tujuan --</option>
                    {warehouses.filter(w => w !== mutationSourceWh).map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add to Cart Form */}
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Tambah Item ke Daftar Mutasi</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Produk</label>
                    <select
                      value={mutationProduct}
                      onChange={(e) => {
                        setMutationProduct(e.target.value);
                        setMutationVariant('');
                        setMutationQty('');
                        setMutationSelectedCombos({});
                        setMutationBreakdownQtys({});
                      }}
                      disabled={!mutationSourceWh}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl disabled:opacity-50"
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.filter(p => p.warehouse === mutationSourceWh).map((p, idx) => (
                        <option key={`${p.id}-${p.sku || ''}-${idx}`} value={p.id}>
                          [{p.sku}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Varian (Kombinasi)</label>
                    {mutationCombos.length > 0 ? (
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-2">
                        <span>✨ Tersedia {mutationCombos.length} varian — Silakan centang & isi QTY breakdown di bawah.</span>
                      </div>
                    ) : (
                      <select
                        value={mutationVariant}
                        onChange={(e) => {
                          setMutationVariant(e.target.value);
                          setMutationQty('');
                        }}
                        disabled={!mutationProduct}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl disabled:opacity-50"
                      >
                        <option value="">-- Tanpa Varian / Default --</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Checkbox Breakdown Size Table when Product has variants */}
                {mutationProduct && mutationCombos.length > 0 ? (
                  <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="select-all-mutation-variants"
                          checked={mutationCombos.length > 0 && mutationCombos.every(c => mutationSelectedCombos[c.key])}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const nextSel: Record<string, boolean> = {};
                            const nextQtys: Record<string, number | ''> = { ...mutationBreakdownQtys };
                            mutationCombos.forEach(c => {
                              nextSel[c.key] = checked;
                              if (checked && !nextQtys[c.key]) {
                                nextQtys[c.key] = 1;
                              }
                            });
                            setMutationSelectedCombos(nextSel);
                            setMutationBreakdownQtys(nextQtys);
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="select-all-mutation-variants" className="font-extrabold text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                          Pilih Semua Varian ({mutationCombos.length} Varian)
                        </label>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Centang varian & tentukan QTY mutasi per size
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                      {mutationCombos.map(combo => {
                        const globalKey = `${mutationProduct}-${combo.key}`;
                        const availStock = variantStocks[globalKey] !== undefined ? variantStocks[globalKey] : combo.stock;
                        const isChecked = !!mutationSelectedCombos[combo.key];
                        const qtyVal = mutationBreakdownQtys[combo.key] ?? '';

                        return (
                          <div
                            key={combo.key}
                            className={`p-3 flex items-center justify-between gap-3 transition-colors ${isChecked ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                id={`mutation-variant-${combo.key}`}
                                checked={isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setMutationSelectedCombos(prev => ({ ...prev, [combo.key]: checked }));
                                  if (checked && !mutationBreakdownQtys[combo.key]) {
                                    setMutationBreakdownQtys(prev => ({ ...prev, [combo.key]: 1 }));
                                  }
                                }}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`mutation-variant-${combo.key}`}
                                className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer truncate"
                              >
                                {combo.label}
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  Stok: {availStock} Pcs
                                </span>
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-medium">QTY:</span>
                              <input
                                type="number"
                                min={1}
                                max={availStock}
                                value={qtyVal}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Number(e.target.value);
                                  setMutationBreakdownQtys(prev => ({ ...prev, [combo.key]: val }));
                                  if (val !== '' && Number(val) > 0) {
                                    setMutationSelectedCombos(prev => ({ ...prev, [combo.key]: true }));
                                  }
                                }}
                                placeholder="0"
                                className="w-24 p-1.5 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Total Varian Terpilih: {Object.values(mutationSelectedCombos).filter(Boolean).length} Varian
                      </div>
                      <button
                        type="button"
                        onClick={handleAddBreakdownToCart}
                        disabled={Object.values(mutationSelectedCombos).filter(Boolean).length === 0}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 text-xs"
                      >
                        <Plus className="w-4 h-4" /> Tambah Varian Terpilih ke Daftar
                      </button>
                    </div>
                  </div>
                ) : mutationProduct ? (
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Jumlah Mutasi (Qty)</label>
                      <div className="flex items-center gap-3">
                         <input
                           type="number"
                           min={1}
                           max={sourceStockVal}
                           value={mutationQty}
                           onChange={(e) => setMutationQty(e.target.value === '' ? '' : Number(e.target.value))}
                           disabled={!mutationProduct}
                           placeholder="Jml"
                           className="w-32 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl font-mono text-base font-bold disabled:opacity-50"
                         />
                         <span className="text-slate-500 text-[10px]">Tersedia: <strong>{`${sourceStockVal} Pcs`}</strong></span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!mutationProduct || mutationQty === '' || Number(mutationQty) > sourceStockVal || Number(mutationQty) <= 0}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Tambah Varian
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Cart Table */}
              {mutationCart.length > 0 && (
                <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500">
                      <tr>
                        <th className="p-2 font-bold">Produk & Varian</th>
                        <th className="p-2 font-bold text-right">Qty Mutasi</th>
                        <th className="p-2 font-bold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {mutationCart.map((item, idx) => (
                        <tr key={idx} className="bg-white dark:bg-slate-800">
                          <td className="p-2 font-medium text-slate-800 dark:text-slate-200">
                            {item.name} <br/>
                            <span className="text-slate-500 font-normal">{item.variantLabel}</span>
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-red-600 dark:text-red-400">
                            {item.qty} Pcs
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.globalKey)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {mutationCart.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">No. Referensi Surat Jalan / Dokumen Mutasi</label>
                  <input
                    type="text"
                    value={mutationNotes}
                    onChange={(e) => setMutationNotes(e.target.value)}
                    required
                    placeholder="Contoh: SJ-JJ-2026-102 (Mutasi Toko Cabang)"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-slate-750">
                <button
                  type="submit"
                  disabled={mutationCart.length === 0 || !mutationDestWh || !mutationNotes || isSubmittingMutation || isStaff}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingMutation ? 'Memproses...' : 'Kirim & Mutasikan Stok'}
                </button>
              </div>
            </form>
          </div>

          {/* Mutation Info */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
              Tentang Mutasi Inter-Warehouse
            </h4>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Mutasi inter-warehouse adalah prosedur pemindahan stok antar lokasi penyimpanan legal yang terdaftar di sistem. Anda dapat memilih beberapa varian produk sekaligus.
            </p>
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/15 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <span className="font-bold block text-blue-800 dark:text-blue-400">Alur Sistem Otomatis:</span>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Mendepresiasi kuantitas di gudang asal.</li>
                <li>Mengecek keberadaan SKU di gudang tujuan (melakukan duplikasi otomatis jika belum ada).</li>
                <li>Menambahkan kuantitas di gudang tujuan.</li>
                <li>Mencatat surat jalan / reference log secara legal di Audit Trail.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mutation-history' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-red-600" />
                Riwayat Mutasi & Surat Jalan
              </h3>
              <p className="text-[11px] text-slate-500">Lihat semua riwayat transfer antar gudang dan cetak surat jalannya.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.confirm('Apakah Anda yakin ingin menghapus SEMUA riwayat mutasi? Tindakan ini tidak dapat dikembalikan.')) {
                    clearAllStockMovements();
                  }
                }}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Semua Mutasi
              </button>
              <button
                onClick={handleOpenNewTransferModal}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Buat Transfer Mutasi Baru
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Tipe:</span>
              {(['ALL', 'Warehouse Transfer', 'Inbound Purchase', 'Outbound Sales', 'Stock Opname Adjustment'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMutationHistoryFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mutationHistoryFilter === t
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {t === 'ALL' ? 'Semua Mutasi' : t === 'Warehouse Transfer' ? 'Transfer Gudang' : t === 'Inbound Purchase' ? 'Masuk Supplier' : t === 'Outbound Sales' ? 'Keluar Sales' : 'Koreksi Opname'}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={mutationHistorySearch}
                onChange={(e) => setMutationHistorySearch(e.target.value)}
                placeholder="Cari referensi, SKU, produk, atau gudang..."
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-750 rounded-xl">
            <table className="whitespace-nowrap min-w-full w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-750 text-slate-500 font-bold">
                  <th className="p-3 uppercase text-[10px]">Surat Jalan / Referensi</th>
                  <th className="p-3 uppercase text-[10px]">Tanggal</th>
                  <th className="p-3 uppercase text-[10px]">Produk & Varian</th>
                  <th className="p-3 uppercase text-[10px]">Gudang Asal & Tujuan</th>
                  <th className="p-3 uppercase text-[10px] text-right">Jumlah (Qty)</th>
                  <th className="p-3 uppercase text-[10px] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {stockMovements
                  .filter(m => mutationHistoryFilter === 'ALL' ? true : m.type === mutationHistoryFilter)
                  .filter(m => {
                    if (!mutationHistorySearch.trim()) return true;
                    const q = mutationHistorySearch.toLowerCase();
                    return (
                      m.referenceNumber.toLowerCase().includes(q) ||
                      m.productName.toLowerCase().includes(q) ||
                      m.productSku.toLowerCase().includes(q) ||
                      m.sourceLocation.toLowerCase().includes(q) ||
                      m.destinationLocation.toLowerCase().includes(q) ||
                      (m.operator && m.operator.toLowerCase().includes(q))
                    );
                  })
                  .length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada riwayat mutasi yang cocok dengan filter atau pencarian.
                    </td>
                  </tr>
                ) : (
                  stockMovements
                    .filter(m => mutationHistoryFilter === 'ALL' ? true : m.type === mutationHistoryFilter)
                    .filter(m => {
                      if (!mutationHistorySearch.trim()) return true;
                      const q = mutationHistorySearch.toLowerCase();
                      return (
                        m.referenceNumber.toLowerCase().includes(q) ||
                        m.productName.toLowerCase().includes(q) ||
                        m.productSku.toLowerCase().includes(q) ||
                        m.sourceLocation.toLowerCase().includes(q) ||
                        m.destinationLocation.toLowerCase().includes(q) ||
                        (m.operator && m.operator.toLowerCase().includes(q))
                      );
                    })
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                      <td className="p-3">
                        <span className="font-mono font-extrabold text-slate-950 dark:text-slate-100 block">{mov.referenceNumber}</span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {mov.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{mov.date}</td>
                      <td className="p-3 space-y-0.5">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">{mov.productName}</span>
                        <span className="font-mono text-[10px] text-slate-400 block">{mov.productSku}</span>
                      </td>
                      <td className="p-3 text-[11px]">
                        <span className="text-slate-400 block">Dari: <strong className="text-slate-800 dark:text-slate-200">{mov.sourceLocation}</strong></span>
                        <span className="text-slate-400 block">Ke: <strong className="text-slate-800 dark:text-slate-200">{mov.destinationLocation}</strong></span>
                      </td>
                      <td className="p-3 font-black text-right text-slate-900 dark:text-white">
                        {mov.quantity} Pcs
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handlePrintSJ(mov)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-[11px]"
                            title="Cetak Surat Jalan"
                          >
                            <FileText className="w-3.5 h-3.5" /> Cetak SJ
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(mov)}
                            title="Edit data transfer mutasi"
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMovement(mov)}
                            title="Hapus riwayat mutasi"
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal CRUD Tambah / Edit Log Mutasi */}
      {isCrudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-base">
                  {editingMovement ? 'Edit Log Mutasi & Stok' : 'Catat Log Mutasi Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCrudModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCrudForm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Referensi / Surat Jalan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={crudForm.referenceNumber}
                    onChange={(e) => setCrudForm({ ...crudForm, referenceNumber: e.target.value })}
                    placeholder="Contoh: SJ-001 / INV-2026 / TR-01"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={crudForm.date}
                    onChange={(e) => setCrudForm({ ...crudForm, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Pergerakan <span className="text-red-500">*</span>
                </label>
                <select
                  value={crudForm.type}
                  onChange={(e) => setCrudForm({ ...crudForm, type: e.target.value as StockMovement['type'] })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="Inbound Purchase">Inbound Purchase (Masuk dari Supplier)</option>
                  <option value="Outbound Sales">Outbound Sales (Keluar untuk Penjualan)</option>
                  <option value="Warehouse Transfer">Warehouse Transfer (Transfer Antar Gudang)</option>
                  <option value="Stock Opname Adjustment">Stock Opname Adjustment (Koreksi Fisik)</option>
                  <option value="Production Consumption">Production Consumption (Produksi)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Produk <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={crudForm.productSku}
                    onChange={(e) => handleProductSelectChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="" disabled>-- Pilih Produk --</option>
                    {products.map((p, idx) => (
                      <option key={`${p.id || p.sku}-${idx}`} value={p.sku}>
                        [{p.sku}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah (Qty - Pcs) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={crudForm.quantity}
                    onChange={(e) => setCrudForm({ ...crudForm, quantity: Math.max(1, Number(e.target.value)) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lokasi Asal (Source) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={crudForm.sourceLocation}
                    onChange={(e) => setCrudForm({ ...crudForm, sourceLocation: e.target.value })}
                    placeholder="Contoh: Supplier / Gudang Pusat"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lokasi Tujuan (Destination) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={crudForm.destinationLocation}
                    onChange={(e) => setCrudForm({ ...crudForm, destinationLocation: e.target.value })}
                    placeholder="Contoh: Gudang Cabang / Customer"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Operator / PIC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={crudForm.operator}
                  onChange={(e) => setCrudForm({ ...crudForm, operator: e.target.value })}
                  placeholder="Nama PIC atau Admin"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCrudModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingMovement ? 'Simpan Perubahan' : 'Catat Log Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Modal Konfirmasi Hapus Mutasi (agar aktif di iframe preview tanpa blokir window.confirm) */}
      {activeTab === 'history-opname' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                Riwayat History Stock Opname
              </h3>
              <p className="text-xs text-slate-500">Daftar seluruh hasil audit dan penyesuaian stock opname fisik yang pernah dilakukan.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Cari SKU / Nama Produk..."
                value={opnameHistorySearch}
                onChange={(e) => setOpnameHistorySearch(e.target.value)}
                className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-xs w-64"
              />
              <select
                value={opnameHistoryWarehouseFilter}
                onChange={(e) => setOpnameHistoryWarehouseFilter(e.target.value)}
                className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-xs"
              >
                <option value="all">Semua Gudang</option>
                {warehouses.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">No. Ref / Tanggal</th>
                  <th className="p-3">Gudang</th>
                  <th className="p-3">Produk & Varian</th>
                  <th className="p-3 text-center">Stok Sistem</th>
                  <th className="p-3 text-center">Stok Fisik</th>
                  <th className="p-3 text-center">Selisih</th>
                  <th className="p-3">Alasan / Catatan</th>
                  <th className="p-3">Petugas (PIC)</th>
                  <th className="p-3 rounded-r-xl text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {stockOpnameHistories
                  .filter(h => {
                    if (opnameHistoryWarehouseFilter !== 'all' && h.warehouse !== opnameHistoryWarehouseFilter) return false;
                    if (opnameHistorySearch) {
                      const q = opnameHistorySearch.toLowerCase();
                      return (h.productName || '').toLowerCase().includes(q) || (h.productSku || '').toLowerCase().includes(q) || (h.referenceNumber || '').toLowerCase().includes(q);
                    }
                    return true;
                  })
                  .map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{rec.referenceNumber}</div>
                        <div className="text-[10px] text-slate-400">{rec.date}</div>
                      </td>
                      <td className="p-3 font-semibold">{rec.warehouse}</td>
                      <td className="p-3">
                        <div className="font-bold">{rec.productName}</div>
                        <div className="text-[10px] text-slate-500">SKU: {rec.productSku} {rec.variantLabel ? `(${rec.variantLabel})` : ''}</div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-400">{rec.systemStock}</td>
                      <td className="p-3 text-center font-bold text-blue-600">{rec.physicalStock}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.difference > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          rec.difference < 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {rec.difference > 0 ? `+${rec.difference}` : rec.difference}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold">{rec.reason}</div>
                        {rec.notes && <div className="text-[10px] text-slate-400">{rec.notes}</div>}
                      </td>
                      <td className="p-3 font-medium">{rec.operator}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus riwayat opname ${rec.referenceNumber}?`)) {
                              deleteStockOpnameRecord(rec.id);
                              addNotification('Berhasil', 'Riwayat opname berhasil dihapus.', 'success', 'StockOpnameView');
                            }
                          }}
                          className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                          title="Hapus Riwayat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                {stockOpnameHistories.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Belum ada riwayat stock opname yang tercatat. Silakan lakukan stock opname pada tab "Stock Opname (Fisik)".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Modal Konfirmasi Hapus Mutasi (agar aktif di iframe preview tanpa blokir window.confirm) */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Konfirmasi Hapus Log Mutasi
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus log mutasi <span className="font-mono font-bold text-slate-900 dark:text-white">[{deleteConfirmModal.referenceNumber}]</span> (<span className="font-semibold">{deleteConfirmModal.productName}</span>)? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteMovement}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Surat Jalan Modal Preview & Printable View */}
      {previewSJModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Pratinjau Surat Jalan Mutasi Stok</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printSuratJalanPDF(previewSJModal)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak / Print Dokumen
                </button>
                <button
                  onClick={() => setPreviewSJModal(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Preview Document Body */}
            <div className="p-8 overflow-y-auto bg-white text-slate-900 font-mono text-sm space-y-6">
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-xl font-black uppercase tracking-wider">Surat Jalan Mutasi Stok</h2>
                <p className="text-xs text-slate-600 font-sans mt-1">PT JERJHON ENTERPRISE - LOGISTICS DIVISION</p>
                <p className="text-[10px] text-slate-500 font-sans">Jl. Boulevard Raya Barat No. 88, Jakarta Selatan • Telp: (021) 555-8899</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p><strong>No. Referensi:</strong> {previewSJModal.referenceNumber || '-'}</p>
                  <p><strong>Tanggal Mutasi:</strong> {previewSJModal.date || '-'}</p>
                  <p><strong>PIC / Operator:</strong> {previewSJModal.operator || 'Admin Gudang'}</p>
                </div>
                <div className="text-right">
                  <p><strong>Gudang Asal (Source):</strong> {previewSJModal.sourceLocation || '-'}</p>
                  <p><strong>Gudang Tujuan (Dest):</strong> {previewSJModal.destinationLocation || '-'}</p>
                  <p><strong>Tipe Dokumen:</strong> Transfer Internal</p>
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-900 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-900 p-2 text-center w-12">NO</th>
                    <th className="border border-slate-900 p-2 text-left w-1/4">SKU</th>
                    <th className="border border-slate-900 p-2 text-left">Produk & Varian</th>
                    <th className="border border-slate-900 p-2 text-right w-1/4">Jumlah (Qty)</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewSJModal.items && previewSJModal.items.length > 0 ? previewSJModal.items : [{ productSku: previewSJModal.productSku, productName: previewSJModal.productName, quantity: previewSJModal.quantity }]).map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-slate-900 p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-900 p-2 font-mono font-bold">{item.productSku || '-'}</td>
                      <td className="border border-slate-900 p-2 font-bold">{item.productName || '-'}</td>
                      <td className="border border-slate-900 p-2 text-right font-black">{item.quantity || 0} Pcs</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                    <td colSpan={3} className="border border-slate-900 p-2 text-right">TOTAL ITEM & KUANTITAS:</td>
                    <td className="border border-slate-900 p-2 text-right font-black">
                      {(previewSJModal.items && previewSJModal.items.length > 0 ? previewSJModal.items : [{ quantity: previewSJModal.quantity }]).reduce((acc: number, it: any) => acc + (Number(it.quantity) || 0), 0)} Pcs
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div className="space-y-16">
                  <p className="font-semibold">Pihak Pengirim (Gudang Asal)</p>
                  <div className="border-t border-slate-900 pt-1 font-bold">(_______________________)</div>
                </div>
                <div className="space-y-16">
                  <p className="font-semibold">Pihak Penerima (Gudang Tujuan)</p>
                  <div className="border-t border-slate-900 pt-1 font-bold">(_______________________)</div>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-4 text-center text-[10px] text-slate-500 font-sans">
                Dokumen ini dicetak secara otomatis melalui sistem ERP Jerjhon pada {new Date().toLocaleString('id-ID')}.<br/>
                Harap diperiksa fisik barang saat penerimaan di Gudang Tujuan.
              </div>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setPreviewSJModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => printSuratJalanPDF(previewSJModal)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak / Print Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilihan Gudang untuk Download Form Opname */}
      {showDownloadOpnameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                Pilih Gudang untuk Form Stock Opname
              </h3>
              <button
                onClick={() => setShowDownloadOpnameModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Pilih Gudang:</label>
                <select
                  value={downloadModalWarehouse}
                  onChange={(e) => setDownloadModalWarehouse(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value="">-- Semua Gudang (Keseluruhan) --</option>
                  {warehouses.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Formulir stock opname akan memuat daftar produk dan stok sistem spesifik untuk gudang yang dipilih.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDownloadOpnameModal(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDownloadOpnameModal(false);
                    handleDownloadOpnameForm(downloadModalWarehouse);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download CSV Opname
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
