import React, { useState, useMemo, useCallback } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  RefreshCw,
  RefreshCcw,
  Layers,
  Upload,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  Edit3,
  CheckCircle2,
  Trash2,
  Eye,
  FileText,
  Barcode,
  QrCode,
  Filter,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  SlidersHorizontal,
  Printer,
  X,
  Copy,
  Check,
  TrendingUp,
  ShoppingBag,
  Boxes,
  ShieldAlert,
  ArrowUpDown,
  Tag,
  Settings2,
  Settings,
  Save,
  Zap,
  DollarSign
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { StatCard } from '../../common/StatCard';
import { ProductItem } from '../../../types';
import * as XLSX from 'xlsx';
import { exportToCSV, exportToPDF } from '../../../utils/exportUtils';
import { JERJHON_CSV_DATA } from '../../../data/csvSeedData';
import { SeedCSVModal } from './products/SeedCSVModal';
import { CategoryWarehouseManagerModal } from './products/CategoryWarehouseManagerModal';
import { ProductDetailModal } from './products/ProductDetailModal';
import { AdjustStockModal } from './products/AdjustStockModal';
import { StockMovementsTable } from './products/StockMovementsTable';
import { LowStockAlertView } from './products/LowStockAlertView';
import { InventoryToast, ToastMessage } from './products/InventoryToast';

export const InventoryProductsView: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    clearProducts,
    stockMovements,
    deleteStockMovement,
    clearAllStockMovements,
    formatIDR,
    isStaff,
    currentUser,
    sizeOptions,
    colorOptions,
    sleeveOptions,
    designOptions,
    sizeExtraPrices,
    colorExtraPrices,
    sleeveExtraPrices,
    designExtraPrices,
    variantPrices,
    variantStocks,
    setVariantStocks,
    setVariantPrices,
    variantCosts,
    setVariantCosts,
    variantSKUs,
    setVariantSKUs,
    syncInventoryToPOS,
    variantKeycells,
    setVariantKeycells,
    setSizeOptions,
    setColorOptions,
    setSleeveOptions,
    setDesignOptions,
    setActiveTab: setGlobalActiveTab,
    availableCategories,
    availableWarehouses,
    addCustomCategory,
    deleteCategory,
    addCustomWarehouse,
    deleteWarehouse
  } = useERP();

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'catalog' | 'low_stock' | 'movements'>('catalog');

  // Toast notification state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [parentSkuFilter, setParentSkuFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Ready' | 'Low Stock' | 'Out of Stock'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'stock_high' | 'stock_low' | 'price_high' | 'price_low'>('name_asc');

  // Stock Movement Filters
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');
  const [movementOperatorFilter, setMovementOperatorFilter] = useState<string>('all');
  const [movementDateFilter, setMovementDateFilter] = useState<string>('all');

  // Multi-select state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Expanded variant rows
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSeedCSVModal, setShowSeedCSVModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteMovementConfirmModal, setDeleteMovementConfirmModal] = useState<any | null>(null);
  const [deleteAllMovementsConfirmModal, setDeleteAllMovementsConfirmModal] = useState(false);

  // Selected item for action
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Form States
  const [formData, setFormData] = useState<Omit<ProductItem, 'id'>>({
    sku: `SKU-JJ-${Math.floor(100 + Math.random() * 900)}`,
    parentSku: '',
    name: '',
    category: 'Cycling Pro Series',
    warehouse: 'Gudang Utama Cikarang',
    stockQuantity: 100,
    minimumStock: 20,
    safetyStock: 50,
    unitCostPrice: 100000,
    sellingPrice: 175000,
    unit: 'Pcs',
    status: 'Ready',
    lastUpdated: new Date().toISOString().substring(0, 10)
  });

  // Stock Adjustment Form State
  const [stockAdjustment, setStockAdjustment] = useState({
    type: 'Inbound' as 'Inbound' | 'Outbound' | 'Set',
    quantity: 10,
    notes: 'Koreksi Stok Fisik / Opname',
    movementType: 'Stock Opname Adjustment' as any
  });

  // Import feedback
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);

  // Edit Product Modal Enhanced Variant State
  const [editModalTab, setEditModalTab] = useState<'basic' | 'attributes' | 'variants'>('basic');
  const [editSizes, setEditSizes] = useState<string[]>([]);
  const [editColors, setEditColors] = useState<string[]>([]);
  const [editSleeves, setEditSleeves] = useState<string[]>([]);
  const [editDesigns, setEditDesigns] = useState<string[]>([]);

  // Dynamic Variant Dimension Groups (POS Kasir / Shopee style)
  interface VariantDimensionGroup {
    id: string;
    name: string;
    options: string[];
    newOptionInput?: string;
  }
  const [editDimensionGroups, setEditDimensionGroups] = useState<VariantDimensionGroup[]>([]);

  // Chip input fields
  const [newSizeInput, setNewSizeInput] = useState('');
  const [newColorInput, setNewColorInput] = useState('');
  const [newSleeveInput, setNewSleeveInput] = useState('');
  const [newDesignInput, setNewDesignInput] = useState('');

  // Bulk Apply Input states & selection
  const [bulkStockVal, setBulkStockVal] = useState<number | ''>('');
  const [bulkCostVal, setBulkCostVal] = useState<number | ''>('');
  const [bulkPriceVal, setBulkPriceVal] = useState<number | ''>('');
  const [variantSearchQuery, setVariantSearchQuery] = useState('');
  const [selectedVariantKeys, setSelectedVariantKeys] = useState<string[]>([]);

  // Local draft variant items interface & state
  interface LocalEditVariant {
    key: string;
    globalKey: string;
    size: string;
    color: string;
    sleeve: string;
    design: string;
    label: string;
    sku: string;
    cost: number;
    price: number;
    stock: number;
  }
  const [editVariants, setEditVariants] = useState<LocalEditVariant[]>([]);

  // Expand / Collapse Variant Rows
  const toggleExpand = (productId: string) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Confirm delete / manager modal states
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);
  const [confirmDeleteWh, setConfirmDeleteWh] = useState<string | null>(null);
  const [showCategoryWarehouseManager, setShowCategoryWarehouseManager] = useState<boolean>(false);
  const [managerTab, setManagerTab] = useState<'category' | 'warehouse'>('category');
  const [newManagerCatInput, setNewManagerCatInput] = useState<string>('');
  const [newManagerWhInput, setNewManagerWhInput] = useState<string>('');

  const [isCustomCategoryInput, setIsCustomCategoryInput] = useState<boolean>(false);
  const [isCustomWarehouseInput, setIsCustomWarehouseInput] = useState<boolean>(false);
  const [newCategoryInputValue, setNewCategoryInputValue] = useState<string>('');
  const [newWarehouseInputValue, setNewWarehouseInputValue] = useState<string>('');
  const [addTempId, setAddTempId] = useState<string>('');

  const availableParentSkus = useMemo(() => {
    const skus = new Set<string>();
    products.forEach(p => { if (p.parentSku) skus.add(p.parentSku); });
    return Array.from(skus).filter(Boolean);
  }, [products]);

  // Handler to Delete Category
  const handleDeleteCategory = (catName: string) => {
    const affectedCount = products.filter(p => p.category === catName).length;
    deleteCategory(catName);
    setConfirmDeleteCat(null);
    setToast({
      type: 'warning',
      title: 'Kategori Dihapus',
      message: `Kategori "${catName}" telah dihapus. ${affectedCount} produk dialihkan ke opsi kategori tersisa.`
    });
  };

  // Handler to Delete Warehouse
  const handleDeleteWarehouse = (whName: string) => {
    const affectedCount = products.filter(p => p.warehouse === whName).length;
    deleteWarehouse(whName);
    if (warehouseFilter === whName) {
      setWarehouseFilter('all');
    }
    setConfirmDeleteWh(null);
    setToast({
      type: 'warning',
      title: 'Gudang Dihapus',
      message: `Gudang "${whName}" telah dihapus. ${affectedCount} produk dialihkan ke gudang utama.`
    });
  };

  // Helper calculation for variant costs
  const getVariantCost = useCallback((p: ProductItem, globalKey: string, color: string, size?: string): number => {
    if (variantCosts[globalKey] !== undefined && variantCosts[globalKey] > 0) {
      return variantCosts[globalKey];
    }

    const colorNorm = (color || '').toLowerCase().replace(/\s+/g, ' ').trim();

    // Fuzzy lookup in variantCosts for same product ID & matching variation name
    for (const [k, cVal] of Object.entries(variantCosts)) {
      const numVal = Number(cVal);
      if (k.startsWith(p.id) && numVal > 0) {
        const kNorm = k.toLowerCase().replace(/\s+/g, ' ');
        if (colorNorm !== '-' && kNorm.includes(colorNorm)) {
          return numVal;
        }
      }
    }

    // Model-specific Jerjhon fallback rules for Rok Flexa / Rok Velora / Rok Legging:
    if (colorNorm.includes('2in1 rok pendek')) return 62364;
    if (colorNorm.includes('2in1 rok panjang')) return 80409;
    if (colorNorm.includes('3in1 legging pendek') || colorNorm.includes('3in1legging pendek')) return 84864;
    if (colorNorm.includes('3in1 legging panjang') || colorNorm.includes('3in1legging panjang') || colorNorm.includes('3in1 rok legging panjang')) return 107364;

    return p.unitCostPrice || 50000;
  }, [variantCosts]);

  // Helper calculation for variant prices
  const getVariantPrice = useCallback((p: ProductItem, globalKey: string, color: string, size?: string): number => {
    if (variantPrices[globalKey] !== undefined && variantPrices[globalKey] > 0) {
      return variantPrices[globalKey];
    }

    const colorNorm = (color || '').toLowerCase().replace(/\s+/g, ' ').trim();

    // Fuzzy lookup in variantPrices
    for (const [k, pVal] of Object.entries(variantPrices)) {
      const numVal = Number(pVal);
      if (k.startsWith(p.id) && numVal > 0) {
        const kNorm = k.toLowerCase().replace(/\s+/g, ' ');
        if (colorNorm !== '-' && kNorm.includes(colorNorm)) {
          return numVal;
        }
      }
    }

    // Model-specific Jerjhon fallback rules for Rok Flexa / Rok Velora:
    if (colorNorm.includes('2in1 rok pendek')) return 205000;
    if (colorNorm.includes('3in1 legging pendek') || colorNorm.includes('3in1legging pendek')) return 299000;
    if (colorNorm.includes('2in1 rok panjang')) return 329000;
    if (colorNorm.includes('3in1 legging panjang') || colorNorm.includes('3in1legging panjang') || colorNorm.includes('3in1 rok legging panjang')) return 329000;

    return p.sellingPrice || 175000;
  }, [variantPrices]);

  // Variant helper calculation
  const getProductCombos = useCallback((pId: string) => {
    const product = products.find(p => p.id === pId);
    const pSku = product?.sku || '';
    const pName = (product?.name || '').toLowerCase();

    // Determine size options: check by ID, by SKU, or smart fallback
    let pSizes = sizeOptions[pId] || (pSku ? sizeOptions[pSku] : undefined);
    if (!pSizes || pSizes.length === 0) {
      if (pName.includes('flex') || pName.includes('active') || pName.includes('jersey') || pSku.includes('BUDP-')) {
        pSizes = ["S", "M", "L", "XL", "2XL"];
      } else {
        pSizes = ["-"];
      }
    }

    const rawColors = colorOptions[pId] || (pSku ? colorOptions[pSku] : undefined);
    const pColors = rawColors ? rawColors.map(c => typeof c === 'string' ? c : c.name) : ["-"];
    const pSleeves = sleeveOptions[pId] || (pSku ? sleeveOptions[pSku] : undefined) || ["-"];
    const pDesigns = designOptions[pId] || (pSku ? designOptions[pSku] : undefined) || ["-"];

    const combos: { key: string; label: string; price: number; cost: number; stock: number; color: string; size: string; vSku: string }[] = [];

    pSizes.forEach(sz => {
      pColors.forEach(col => {
        pSleeves.forEach(sl => {
          pDesigns.forEach(ds => {
            const labelParts: string[] = [];
            if (sz !== "-") labelParts.push(sz.startsWith('Ukuran ') ? sz : `Ukuran ${sz}`);
            if (col !== "-") labelParts.push(col);
            if (sl !== "-") labelParts.push(sl);
            if (ds !== "-") labelParts.push(ds);

            const label = labelParts.length > 0 ? labelParts.join(" - ") : "Default Varian";
            const key = `${sz}-${col}-${sl}-${ds}`;
            
            const globalKey = `${pId}-${sz}-${col}-${sl}-${ds}`;
            let price = variantPrices[globalKey];
            if (price === undefined) {
              price = getVariantPrice(product || { id: pId, sellingPrice: 175000 } as ProductItem, globalKey, col, sz);
            }

            let cost = variantCosts[globalKey];
            if (cost === undefined) {
              cost = getVariantCost(product || { id: pId, unitCostPrice: 50000 } as ProductItem, globalKey, col, sz);
            }

            let stock = variantStocks[globalKey];
            if (stock === undefined) {
              stock = Math.floor((product?.stockQuantity || 250) / Math.max(1, pSizes.length * pColors.length));
            }

            const vSku = variantSKUs[globalKey] || (col !== '-' && col !== 'Default' ? `${pSku || pId}-${col}-${sz}` : (pSku || pId));

            combos.push({ key, label, price, cost, stock, color: col, size: sz, vSku });
          });
        });
      });
    });

    return combos;
  }, [products, sizeOptions, colorOptions, sleeveOptions, designOptions, variantPrices, variantCosts, variantStocks, variantSKUs, getVariantPrice, getVariantCost]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let baseProducts = products;
    if (warehouseFilter === 'Gudang BUDP') {
      const budpProducts = products.filter(p => p.warehouse === 'Gudang BUDP');
      const jadexProducts = products.filter(p => p.warehouse === 'Jadex');
      
      baseProducts = jadexProducts.map(jp => {
        const match = budpProducts.find(bp => bp.sku === jp.sku && bp.name === jp.name);
        if (match) {
          return match;
        } else {
          return {
            ...jp,
            id: `${jp.id}-BUDP`,
            warehouse: 'Gudang BUDP',
            stockQuantity: 0,
            status: 'Out of Stock' as const,
          };
        }
      });
    }

    return baseProducts.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) ||
                            p.sku.toLowerCase().includes(q) ||
                            (p.parentSku && p.parentSku.toLowerCase().includes(q)) ||
                            p.warehouse.toLowerCase().includes(q);

      const matchesParentSku = parentSkuFilter === 'all' || p.parentSku === parentSkuFilter;
      const matchesWarehouse = warehouseFilter === 'Gudang BUDP' || warehouseFilter === 'all' || p.warehouse === warehouseFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

      return matchesSearch && matchesParentSku && matchesWarehouse && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'stock_high') return b.stockQuantity - a.stockQuantity;
      if (sortBy === 'stock_low') return a.stockQuantity - b.stockQuantity;
      if (sortBy === 'price_high') return b.sellingPrice - a.sellingPrice;
      if (sortBy === 'price_low') return a.sellingPrice - b.sellingPrice;
      return 0;
    });
  }, [products, searchQuery, parentSkuFilter, warehouseFilter, statusFilter, sortBy]);

  // Stats Calculations based on Filtered Products
  const stats = useMemo(() => {
    const totalSku = filteredProducts.length;
    const totalStock = filteredProducts.reduce((acc, p) => acc + p.stockQuantity, 0);
    const totalValuationCost = filteredProducts.reduce((acc, p) => acc + (p.stockQuantity * (p.unitCostPrice || 0)), 0);
    const totalValuationSelling = filteredProducts.reduce((acc, p) => acc + (p.stockQuantity * (p.sellingPrice || 0)), 0);
    const lowStockCount = filteredProducts.filter(p => p.stockQuantity <= p.safetyStock && p.stockQuantity > 0).length;
    const outOfStockCount = filteredProducts.filter(p => p.stockQuantity <= 0).length;
    const readyCount = filteredProducts.filter(p => p.stockQuantity > p.safetyStock).length;

    return {
      totalSku,
      totalStock,
      totalValuationCost,
      totalValuationSelling,
      lowStockCount,
      outOfStockCount,
      readyCount
    };
  }, [filteredProducts]);

  // Grouped product list by Product Code (p.sku) for dropdown expandability
  const groupedProductList = useMemo(() => {
    const map = new Map<string, ProductItem[]>();
    filteredProducts.forEach(p => {
      const key = p.sku || 'NO-SKU';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(p);
    });

    return Array.from(map.entries()).map(([sku, prods]) => {
      const allItems: {
        product: ProductItem;
        combo: { key: string; label: string; price: number; stock: number };
        globalKey: string;
        vSku: string;
        vCost: number;
        vStock: number;
        vPrice: number;
      }[] = [];

      prods.forEach(p => {
        const combos = getProductCombos(p.id);
        combos.forEach(combo => {
          const globalKey = `${p.id}-${combo.key}`;
          const vSku = combo.label === "Default Varian" ? p.sku : (variantSKUs[globalKey] || `${p.sku}-${combo.key}`);
          const vCost = combo.cost !== undefined ? combo.cost : getVariantCost(p, globalKey, combo.color || combo.label, combo.size);
          const vStock = variantStocks[globalKey] !== undefined ? variantStocks[globalKey] : combo.stock;
          const vPrice = combo.price;

          allItems.push({
            product: p,
            combo,
            globalKey,
            vSku,
            vCost,
            vStock,
            vPrice,
          });
        });
      });

      const primaryProduct = prods[0];
      const totalStock = allItems.reduce((acc, item) => acc + item.vStock, 0);
      const minPrice = allItems.length > 0 ? Math.min(...allItems.map(i => i.vPrice)) : primaryProduct.sellingPrice;
      const maxPrice = allItems.length > 0 ? Math.max(...allItems.map(i => i.vPrice)) : primaryProduct.sellingPrice;
      const avgCost = allItems.length > 0 ? Math.round(allItems.reduce((acc, i) => acc + i.vCost, 0) / allItems.length) : primaryProduct.unitCostPrice;

      return {
        sku,
        products: prods,
        primaryProduct,
        allItems,
        totalStock,
        minPrice,
        maxPrice,
        avgCost
      };
    });
  }, [
    filteredProducts,
    products,
    sizeOptions,
    colorOptions,
    sleeveOptions,
    designOptions,
    variantPrices,
    sizeExtraPrices,
    colorExtraPrices,
    sleeveExtraPrices,
    designExtraPrices,
    variantStocks,
    variantCosts,
    variantSKUs
  ]);

  // Low stock products for Tab 2
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stockQuantity <= p.safetyStock);
  }, [products]);

  // Filtered Stock Movements for Tab 3
  const filteredStockMovements = useMemo(() => {
    return stockMovements.filter(m => {
      // 1. Search Query (SKU or Product Name or Reference Number)
      const matchesSearch = 
        m.productName.toLowerCase().includes(movementSearch.toLowerCase()) ||
        m.productSku.toLowerCase().includes(movementSearch.toLowerCase()) ||
        (m.referenceNumber && m.referenceNumber.toLowerCase().includes(movementSearch.toLowerCase()));
      
      // 2. Type Filter
      const matchesType = movementTypeFilter === 'all' || m.type === movementTypeFilter;
      
      // 3. Operator Filter
      const matchesOperator = movementOperatorFilter === 'all' || m.operator === movementOperatorFilter;
      
      // 4. Date Filter
      let matchesDate = true;
      if (movementDateFilter !== 'all') {
        const todayStr = new Date().toISOString().substring(0, 10);
        if (movementDateFilter === 'today') {
          matchesDate = m.date === todayStr;
        } else if (movementDateFilter === 'this_week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const oneWeekAgoStr = oneWeekAgo.toISOString().substring(0, 10);
          matchesDate = m.date >= oneWeekAgoStr && m.date <= todayStr;
        } else if (movementDateFilter === 'this_month') {
          const firstDayOfMonth = new Date();
          firstDayOfMonth.setDate(1);
          const firstDayOfMonthStr = firstDayOfMonth.toISOString().substring(0, 10);
          matchesDate = m.date >= firstDayOfMonthStr && m.date <= todayStr;
        }
      }
      
      return matchesSearch && matchesType && matchesOperator && matchesDate;
    });
  }, [stockMovements, movementSearch, movementTypeFilter, movementOperatorFilter, movementDateFilter]);

  // Unique Operators list
  const uniqueOperators = useMemo(() => {
    const ops = new Set<string>();
    stockMovements.forEach(m => {
      if (m.operator) ops.add(m.operator);
    });
    return Array.from(ops);
  }, [stockMovements]);

  // Unique Movement Types list
  const uniqueMovementTypes = useMemo(() => {
    const types = new Set<string>();
    stockMovements.forEach(m => {
      if (m.type) types.add(m.type);
    });
    return Array.from(types);
  }, [stockMovements]);

  // Movements statistics
  const movementStats = useMemo(() => {
    let inboundQty = 0;
    let outboundQty = 0;
    let inboundCount = 0;
    let outboundCount = 0;
    
    filteredStockMovements.forEach(m => {
      const isInbound = m.type.includes('Inbound') || m.type.includes('Purchase') || m.type.includes('Transfer');
      if (isInbound) {
        inboundQty += m.quantity;
        inboundCount++;
      } else {
        outboundQty += m.quantity;
        outboundCount++;
      }
    });
    
    return {
      inboundQty,
      outboundQty,
      inboundCount,
      outboundCount,
      totalCount: filteredStockMovements.length
    };
  }, [filteredStockMovements]);

  // Checkbox Select Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Reset Add Form
  const handleOpenAddModal = () => {
    const newTempId = `PROD-${Date.now()}`;
    setAddTempId(newTempId);
    setSelectedProduct(null);
    setEditModalTab('basic');

    const defaultCategory = availableCategories[0] || 'Cycling Pro Series';
    const defaultWarehouse = availableWarehouses[0] || 'Gudang Utama Cikarang';
    const defaultSku = `SKU-JJ-${Math.floor(100 + Math.random() * 900)}`;

    const defaultFormData = {
      sku: defaultSku,
      name: '',
      category: defaultCategory,
      warehouse: defaultWarehouse,
      stockQuantity: 100,
      minimumStock: 20,
      safetyStock: 50,
      unitCostPrice: 100000,
      sellingPrice: 175000,
      unit: 'Pcs' as const,
      status: 'Ready' as const,
      lastUpdated: new Date().toISOString().substring(0, 10)
    };

    setFormData(defaultFormData);
    setBulkStockVal('');
    setBulkPriceVal('');
    setVariantSearchQuery('');
    setIsCustomCategoryInput(false);
    setIsCustomWarehouseInput(false);
    setNewCategoryInputValue('');
    setNewWarehouseInputValue('');

    const initialGroups: VariantDimensionGroup[] = [
      { id: 'dim-sz-' + Date.now(), name: 'Ukuran', options: ['S', 'M', 'L', 'XL'], newOptionInput: '' },
      { id: 'dim-col-' + Date.now(), name: 'Warna', options: ['Hitam', 'Merah', 'Navy'], newOptionInput: '' }
    ];
    setEditDimensionGroups(initialGroups);
    generateLocalVariantsFromGroups(newTempId, defaultSku, 175000, 100, initialGroups);

    setShowAddModal(true);
  };

  // Submit Add Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formData.name.trim();
    const cleanSku = formData.sku.trim();

    if (!cleanName || !cleanSku) {
      setToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Mohon isi Nama Produk dan Kode SKU secara rinci.'
      });
      return;
    }

    // SKU Duplication Check (Case-insensitive)
    const isDuplicateSku = products.some(p => p.sku.trim().toLowerCase() === cleanSku.toLowerCase());
    if (isDuplicateSku) {
      setToast({
        type: 'error',
        title: 'Gagal Simpan - SKU Duplikat',
        message: `Kode SKU "${cleanSku}" sudah terdaftar pada produk lain. Gunakan SKU unik.`
      });
      return;
    }

    // Bounds & Numeric Checks
    if (formData.unitCostPrice < 0 || formData.sellingPrice < 0) {
      setToast({
        type: 'error',
        title: 'Nilai Harga Tidak Valid',
        message: 'Harga HPP Modal dan Harga Jual tidak boleh bernilai negatif.'
      });
      return;
    }

    if (formData.stockQuantity < 0 || formData.safetyStock < 0) {
      setToast({
        type: 'error',
        title: 'Kuantitas Stok Tidak Valid',
        message: 'Kuantitas stok dan batas Safety Stock tidak boleh bernilai negatif.'
      });
      return;
    }

    const finalId = addTempId || `PROD-${Date.now()}`;

    // Save Variant Stocks & Prices
    const newStocks: Record<string, number> = {};
    const newPrices: Record<string, number> = {};

    editVariants.forEach(v => {
      newStocks[v.globalKey] = Math.max(0, Number(v.stock) || 0);
      newPrices[v.globalKey] = Math.max(0, Number(v.price) || formData.sellingPrice);
    });

    setVariantStocks(prev => ({ ...prev, ...newStocks }));
    setVariantPrices(prev => ({ ...prev, ...newPrices }));

    if (setSizeOptions) setSizeOptions(prev => ({ ...prev, [finalId]: editSizes }));
    if (setColorOptions) setColorOptions(prev => ({ ...prev, [finalId]: editColors.map(c => ({ name: c, hex: '#333333' })) }));
    if (setSleeveOptions) setSleeveOptions(prev => ({ ...prev, [finalId]: editSleeves }));
    if (setDesignOptions) setDesignOptions(prev => ({ ...prev, [finalId]: editDesigns }));

    const calculatedTotalStock = editVariants.length > 0
      ? editVariants.reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0)
      : Math.max(0, formData.stockQuantity);

    const calculatedStatus: ProductItem['status'] =
      calculatedTotalStock <= 0
        ? 'Out of Stock'
        : calculatedTotalStock <= formData.safetyStock
        ? 'Low Stock'
        : 'Ready';

    if (formData.category) {
      addCustomCategory(formData.category);
    }
    if (formData.warehouse) {
      addCustomWarehouse(formData.warehouse);
    }

    addProduct({
      ...formData,
      name: cleanName,
      sku: cleanSku,
      id: finalId,
      stockQuantity: calculatedTotalStock,
      status: calculatedStatus,
      lastUpdated: new Date().toISOString().substring(0, 10)
    });

    setShowAddModal(false);

    // Warning notice if Selling price < Cost
    if (formData.sellingPrice < formData.unitCostPrice) {
      setToast({
        type: 'warning',
        title: 'Produk Tersimpan dengan Catatan',
        message: `Produk "${cleanName}" disimpan, namun Harga Jual (${formatIDR(formData.sellingPrice)}) lebih kecil dari HPP Modal (${formatIDR(formData.unitCostPrice)}).`
      });
    } else {
      setToast({
        type: 'success',
        title: 'Produk Berhasil Ditambahkan',
        message: `Produk "${cleanName}" (SKU: ${cleanSku}) telah tersimpan ke master katalog.`
      });
    }
  };

  // Generate Local Variant combinations from Dynamic Groups (POS Kasir / Shopee style)
  const generateLocalVariantsFromGroups = (
    pId: string,
    pSku: string,
    basePrice: number,
    totalStockQty: number,
    groups: VariantDimensionGroup[],
    existingDrafts: LocalEditVariant[] = []
  ) => {
    const activeGroups = groups.filter(g => g.options.length > 0);

    // Sync legacy states for context
    const szGroup = groups.find(g => /ukuran|size/i.test(g.name));
    const colGroup = groups.find(g => /warna|color/i.test(g.name));
    const slGroup = groups.find(g => /lengan|sleeve/i.test(g.name));
    const dsGroup = groups.find(g => /desain|design|model/i.test(g.name));

    const currentSizes = szGroup && szGroup.options.length > 0 ? szGroup.options : ['-'];
    const currentColors = colGroup && colGroup.options.length > 0 ? colGroup.options : ['-'];
    const currentSleeves = slGroup && slGroup.options.length > 0 ? slGroup.options : ['-'];
    const currentDesigns = dsGroup && dsGroup.options.length > 0 ? dsGroup.options : ['-'];

    setEditSizes(currentSizes);
    setEditColors(currentColors);
    setEditSleeves(currentSleeves);
    setEditDesigns(currentDesigns);

    const draftMap = new Map<string, LocalEditVariant>();
    existingDrafts.forEach(d => draftMap.set(d.key, d));

    if (activeGroups.length === 0) {
      setEditVariants([]);
      return;
    }

    let combinations: { name: string; val: string }[][] = [[]];

    for (const group of activeGroups) {
      const nextCombos: { name: string; val: string }[][] = [];
      for (const combo of combinations) {
        for (const opt of group.options) {
          nextCombos.push([...combo, { name: group.name, val: opt }]);
        }
      }
      combinations = nextCombos;
    }

    const totalCombos = combinations.length;
    const defaultProportionalStock = Math.max(0, Math.floor(totalStockQty / Math.max(1, totalCombos)));

    const newVariants: LocalEditVariant[] = [];

    combinations.forEach(combo => {
      const szObj = combo.find(c => /ukuran|size/i.test(c.name));
      const colObj = combo.find(c => /warna|color/i.test(c.name));
      const slObj = combo.find(c => /lengan|sleeve/i.test(c.name));
      const dsObj = combo.find(c => /desain|design|model/i.test(c.name));

      const sz = szObj ? szObj.val : '-';
      const col = colObj ? colObj.val : '-';
      const sl = slObj ? slObj.val : '-';
      const ds = dsObj ? dsObj.val : '-';

      const key = combo.map(c => `${c.name}:${c.val}`).join('|');
      const globalKey = `${pId}-${sz}-${col}-${sl}-${ds}`;

      const labelParts = combo.map(c => `${c.name}: ${c.val}`);
      const label = labelParts.join(' | ');

      const skuSuffixParts = combo.map(c => c.val.slice(0, 3).toUpperCase());
      const sku = `${pSku}-${skuSuffixParts.join('-')}`;

      if (draftMap.has(key)) {
        const existing = draftMap.get(key)!;
        newVariants.push({
          ...existing,
          cost: existing.cost ?? formData.unitCostPrice
        });
      } else {
        let price = variantPrices[globalKey];
        if (price === undefined) {
          const extraSize = sizeExtraPrices[pId]?.[sz] || 0;
          const extraColor = colorExtraPrices[pId]?.[col] || 0;
          const extraSleeve = sleeveExtraPrices[pId]?.[sl] || 0;
          const extraDesign = designExtraPrices[pId]?.[ds] || 0;
          price = basePrice + extraSize + extraColor + extraSleeve + extraDesign;
        }

        let stock = variantStocks[globalKey];
        if (stock === undefined) {
          stock = defaultProportionalStock;
        }

        newVariants.push({
          key,
          globalKey,
          size: sz,
          color: col,
          sleeve: sl,
          design: ds,
          label,
          sku,
          cost: formData.unitCostPrice || 100000,
          price: Number(price) || basePrice,
          stock: Number(stock) || 0
        });
      }
    });

    setEditVariants(newVariants);
  };

  // Dynamic Group Manipulation Handlers
  const handleAddDimensionGroup = () => {
    const currentProdId = selectedProduct ? selectedProduct.id : (addTempId || 'PROD-NEW-1');
    const newGroup: VariantDimensionGroup = {
      id: 'dim-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: `Variasi ${editDimensionGroups.length + 1}`,
      options: [],
      newOptionInput: ''
    };
    const nextGroups = [...editDimensionGroups, newGroup];
    setEditDimensionGroups(nextGroups);
    generateLocalVariantsFromGroups(currentProdId, formData.sku, formData.sellingPrice, formData.stockQuantity, nextGroups, editVariants);
  };

  const handleRemoveDimensionGroup = (groupId: string) => {
    const currentProdId = selectedProduct ? selectedProduct.id : (addTempId || 'PROD-NEW-1');
    const nextGroups = editDimensionGroups.filter(g => g.id !== groupId);
    setEditDimensionGroups(nextGroups);
    generateLocalVariantsFromGroups(currentProdId, formData.sku, formData.sellingPrice, formData.stockQuantity, nextGroups, editVariants);
  };

  const handleUpdateDimensionName = (groupId: string, name: string) => {
    const currentProdId = selectedProduct ? selectedProduct.id : (addTempId || 'PROD-NEW-1');
    const nextGroups = editDimensionGroups.map(g => g.id === groupId ? { ...g, name } : g);
    setEditDimensionGroups(nextGroups);
    generateLocalVariantsFromGroups(currentProdId, formData.sku, formData.sellingPrice, formData.stockQuantity, nextGroups, editVariants);
  };

  const handleAddOptionToGroup = (groupId: string, optionVal?: string) => {
    const currentProdId = selectedProduct ? selectedProduct.id : (addTempId || 'PROD-NEW-1');
    const group = editDimensionGroups.find(g => g.id === groupId);
    if (!group) return;

    const valToAdd = (optionVal !== undefined ? optionVal : group.newOptionInput || '').trim();
    if (!valToAdd) return;

    if (group.options.includes(valToAdd)) {
      setEditDimensionGroups(prev => prev.map(g => g.id === groupId ? { ...g, newOptionInput: '' } : g));
      return;
    }

    const nextGroups = editDimensionGroups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: [...g.options, valToAdd],
          newOptionInput: ''
        };
      }
      return g;
    });

    setEditDimensionGroups(nextGroups);
    generateLocalVariantsFromGroups(currentProdId, formData.sku, formData.sellingPrice, formData.stockQuantity, nextGroups, editVariants);
  };

  const handleRemoveOptionFromGroup = (groupId: string, optionVal: string) => {
    const currentProdId = selectedProduct ? selectedProduct.id : (addTempId || 'PROD-NEW-1');
    const nextGroups = editDimensionGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, options: g.options.filter(o => o !== optionVal) };
      }
      return g;
    });
    setEditDimensionGroups(nextGroups);
    generateLocalVariantsFromGroups(currentProdId, formData.sku, formData.sellingPrice, formData.stockQuantity, nextGroups, editVariants);
  };

  const handleApplyPresetTemplate = (templateType: 'clothing' | 'shoes' | 'electronics' | 'clear') => {
    const currentProdId = selectedProduct ? selectedProduct.id : (addTempId || 'PROD-NEW-1');
    let nextGroups: VariantDimensionGroup[] = [];

    if (templateType === 'clothing') {
      nextGroups = [
        { id: 'dim-col-' + Date.now(), name: 'Model / Warna', options: ['Hitam', 'Putih', 'Navy', 'Merah'], newOptionInput: '' },
        { id: 'dim-sz-' + Date.now(), name: 'Size / Ukuran', options: ['S', 'M', 'L', 'XL', '2XL'], newOptionInput: '' }
      ];
    } else if (templateType === 'shoes') {
      nextGroups = [
        { id: 'dim-col-' + Date.now(), name: 'Model / Warna', options: ['Hitam', 'Putih', 'Cokelat'], newOptionInput: '' },
        { id: 'dim-sz-' + Date.now(), name: 'Size / Ukuran', options: ['38', '39', '40', '41', '42', '43', '44'], newOptionInput: '' }
      ];
    } else if (templateType === 'electronics') {
      nextGroups = [
        { id: 'dim-col-' + Date.now(), name: 'Model / Warna', options: ['Space Gray', 'Silver', 'Gold'], newOptionInput: '' },
        { id: 'dim-cap-' + Date.now(), name: 'Kapasitas', options: ['128GB', '256GB', '512GB'], newOptionInput: '' }
      ];
    } else if (templateType === 'clear') {
      nextGroups = [];
    }

    setEditDimensionGroups(nextGroups);
    generateLocalVariantsFromGroups(currentProdId, formData.sku, formData.sellingPrice, formData.stockQuantity, nextGroups, editVariants);
  };

  // Selection helpers for variants table
  const filteredEditVariants = editVariants.filter(v =>
    !variantSearchQuery ||
    v.label.toLowerCase().includes(variantSearchQuery.toLowerCase()) ||
    v.sku.toLowerCase().includes(variantSearchQuery.toLowerCase())
  );

  const isAllVariantsSelected = filteredEditVariants.length > 0 &&
    filteredEditVariants.every(v => selectedVariantKeys.includes(v.key));

  const toggleSelectAllVariants = () => {
    if (isAllVariantsSelected) {
      const visibleKeys = new Set(filteredEditVariants.map(v => v.key));
      setSelectedVariantKeys(prev => prev.filter(k => !visibleKeys.has(k)));
    } else {
      const visibleKeys = filteredEditVariants.map(v => v.key);
      setSelectedVariantKeys(prev => Array.from(new Set([...prev, ...visibleKeys])));
    }
  };

  const toggleSelectVariant = (key: string) => {
    setSelectedVariantKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Bulk Apply Handlers
  const handleBulkApplyStock = () => {
    if (bulkStockVal === '' || isNaN(Number(bulkStockVal))) return;
    const targetStock = Math.max(0, Number(bulkStockVal));
    const targetKeys = selectedVariantKeys.length > 0 ? new Set(selectedVariantKeys) : null;
    setEditVariants(prev => prev.map(v => {
      if (targetKeys) {
        return targetKeys.has(v.key) ? { ...v, stock: targetStock } : v;
      }
      const isMatched = !variantSearchQuery || 
        v.label.toLowerCase().includes(variantSearchQuery.toLowerCase()) || 
        v.sku.toLowerCase().includes(variantSearchQuery.toLowerCase());
      return isMatched ? { ...v, stock: targetStock } : v;
    }));
  };

  const handleBulkApplyCost = () => {
    if (bulkCostVal === '' || isNaN(Number(bulkCostVal))) return;
    const targetCost = Math.max(0, Number(bulkCostVal));
    const targetKeys = selectedVariantKeys.length > 0 ? new Set(selectedVariantKeys) : null;
    setEditVariants(prev => prev.map(v => {
      if (targetKeys) {
        return targetKeys.has(v.key) ? { ...v, cost: targetCost } : v;
      }
      const isMatched = !variantSearchQuery || 
        v.label.toLowerCase().includes(variantSearchQuery.toLowerCase()) || 
        v.sku.toLowerCase().includes(variantSearchQuery.toLowerCase());
      return isMatched ? { ...v, cost: targetCost } : v;
    }));
  };

  const handleBulkApplyPrice = () => {
    if (bulkPriceVal === '' || isNaN(Number(bulkPriceVal))) return;
    const targetPrice = Math.max(0, Number(bulkPriceVal));
    const targetKeys = selectedVariantKeys.length > 0 ? new Set(selectedVariantKeys) : null;
    setEditVariants(prev => prev.map(v => {
      if (targetKeys) {
        return targetKeys.has(v.key) ? { ...v, price: targetPrice } : v;
      }
      const isMatched = !variantSearchQuery || 
        v.label.toLowerCase().includes(variantSearchQuery.toLowerCase()) || 
        v.sku.toLowerCase().includes(variantSearchQuery.toLowerCase());
      return isMatched ? { ...v, price: targetPrice } : v;
    }));
  };

  const handleBulkApplyAllDirect = () => {
    const hasCost = bulkCostVal !== '' && !isNaN(Number(bulkCostVal));
    const hasPrice = bulkPriceVal !== '' && !isNaN(Number(bulkPriceVal));
    const hasStock = bulkStockVal !== '' && !isNaN(Number(bulkStockVal));

    if (!hasCost && !hasPrice && !hasStock) return;

    const targetCost = Math.max(0, Number(bulkCostVal));
    const targetPrice = Math.max(0, Number(bulkPriceVal));
    const targetStock = Math.max(0, Number(bulkStockVal));
    const targetKeys = selectedVariantKeys.length > 0 ? new Set(selectedVariantKeys) : null;

    setEditVariants(prev => prev.map(v => {
      const isTargeted = targetKeys 
        ? targetKeys.has(v.key)
        : (!variantSearchQuery || 
           v.label.toLowerCase().includes(variantSearchQuery.toLowerCase()) || 
           v.sku.toLowerCase().includes(variantSearchQuery.toLowerCase()));

      if (!isTargeted) return v;

      return {
        ...v,
        ...(hasCost ? { cost: targetCost } : {}),
        ...(hasPrice ? { price: targetPrice } : {}),
        ...(hasStock ? { stock: targetStock } : {})
      };
    }));
  };

  const handleBulkAdjustStockDelta = (delta: number) => {
    const targetKeys = selectedVariantKeys.length > 0 ? new Set(selectedVariantKeys) : null;
    setEditVariants(prev => prev.map(v => {
      if (targetKeys) {
        return targetKeys.has(v.key) ? { ...v, stock: Math.max(0, v.stock + delta) } : v;
      }
      const isMatched = !variantSearchQuery || 
        v.label.toLowerCase().includes(variantSearchQuery.toLowerCase()) || 
        v.sku.toLowerCase().includes(variantSearchQuery.toLowerCase());
      return isMatched ? { ...v, stock: Math.max(0, v.stock + delta) } : v;
    }));
  };

  // Update Individual Row in Edit Modal
  const handleUpdateEditVariantRow = (index: number, field: 'stock' | 'price' | 'cost' | 'sku', value: any) => {
    setEditVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Open Edit Product
  const handleOpenEditModal = (p: ProductItem) => {
    setSelectedProduct(p);
    setEditModalTab('basic');
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      warehouse: p.warehouse,
      stockQuantity: p.stockQuantity,
      minimumStock: p.minimumStock,
      safetyStock: p.safetyStock,
      unitCostPrice: p.unitCostPrice,
      sellingPrice: p.sellingPrice,
      unit: p.unit,
      status: p.status,
      lastUpdated: p.lastUpdated
    });

    const existingSizes = sizeOptions[p.id] || ['S', 'M', 'L', 'XL'];
    setEditSizes(existingSizes);

    const rawColors = colorOptions[p.id];
    const existingColors = rawColors
      ? rawColors.map(c => typeof c === 'string' ? c : c.name)
      : ['Hitam', 'Merah', 'Navy'];
    setEditColors(existingColors);

    const existingSleeves = sleeveOptions[p.id] || ['-'];
    setEditSleeves(existingSleeves);

    const existingDesigns = designOptions[p.id] || ['-'];
    setEditDesigns(existingDesigns);

    setBulkStockVal('');
    setBulkPriceVal('');
    setVariantSearchQuery('');
    setIsCustomCategoryInput(false);
    setIsCustomWarehouseInput(false);
    setNewCategoryInputValue('');
    setNewWarehouseInputValue('');

    // Initialize Dynamic Dimension Groups
    const initialGroups: VariantDimensionGroup[] = [];
    if (existingSizes && existingSizes.length > 0 && existingSizes.some(s => s !== '-')) {
      initialGroups.push({ id: 'dim-sz-' + Date.now(), name: 'Ukuran', options: existingSizes, newOptionInput: '' });
    }
    if (existingColors && existingColors.length > 0 && existingColors.some(c => c !== '-')) {
      initialGroups.push({ id: 'dim-col-' + Date.now(), name: 'Warna', options: existingColors, newOptionInput: '' });
    }
    if (existingSleeves && existingSleeves.length > 0 && existingSleeves.some(s => s !== '-' && s !== 'Pendek' ? true : existingSleeves.length > 1)) {
      initialGroups.push({ id: 'dim-sl-' + Date.now(), name: 'Panjang Lengan', options: existingSleeves, newOptionInput: '' });
    }
    if (existingDesigns && existingDesigns.length > 0 && existingDesigns.some(d => d !== '-' && d !== 'Standard' ? true : existingDesigns.length > 1)) {
      initialGroups.push({ id: 'dim-ds-' + Date.now(), name: 'Desain / Model', options: existingDesigns, newOptionInput: '' });
    }

    if (initialGroups.length === 0) {
      initialGroups.push(
        { id: 'dim-1-' + Date.now(), name: 'Ukuran', options: ['S', 'M', 'L', 'XL'], newOptionInput: '' },
        { id: 'dim-2-' + Date.now(), name: 'Warna', options: ['Hitam', 'Merah', 'Navy'], newOptionInput: '' }
      );
    }

    setEditDimensionGroups(initialGroups);
    generateLocalVariantsFromGroups(p.id, p.sku, p.sellingPrice, p.stockQuantity, initialGroups);

    setShowEditModal(true);
  };

  // Submit Update Product
  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const cleanName = formData.name.trim();
    const cleanSku = formData.sku.trim();

    if (!cleanName || !cleanSku) {
      setToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Mohon isi Nama Produk dan Kode SKU secara rinci.'
      });
      return;
    }

    // SKU Duplication Check against other products
    const isDuplicateSku = products.some(
      p => p.id !== selectedProduct.id && p.sku.trim().toLowerCase() === cleanSku.toLowerCase()
    );
    if (isDuplicateSku) {
      setToast({
        type: 'error',
        title: 'Gagal Perbarui - SKU Duplikat',
        message: `Kode SKU "${cleanSku}" sudah digunakan oleh produk lain dalam katalog.`
      });
      return;
    }

    // Bounds & Numeric Checks
    if (formData.unitCostPrice < 0 || formData.sellingPrice < 0) {
      setToast({
        type: 'error',
        title: 'Nilai Harga Tidak Valid',
        message: 'Harga HPP Modal dan Harga Jual tidak boleh bernilai negatif.'
      });
      return;
    }

    if (formData.stockQuantity < 0 || formData.safetyStock < 0) {
      setToast({
        type: 'error',
        title: 'Kuantitas Stok Tidak Valid',
        message: 'Kuantitas stok dan batas Safety Stock tidak boleh bernilai negatif.'
      });
      return;
    }

    // Save Variant Stocks & Prices
    const newStocks: Record<string, number> = {};
    const newPrices: Record<string, number> = {};

    editVariants.forEach(v => {
      newStocks[v.globalKey] = Math.max(0, Number(v.stock) || 0);
      newPrices[v.globalKey] = Math.max(0, Number(v.price) || formData.sellingPrice);
    });

    setVariantStocks(prev => ({ ...prev, ...newStocks }));
    setVariantPrices(prev => ({ ...prev, ...newPrices }));

    if (setSizeOptions) setSizeOptions(prev => ({ ...prev, [selectedProduct.id]: editSizes }));
    if (setColorOptions) setColorOptions(prev => ({ ...prev, [selectedProduct.id]: editColors.map(c => ({ name: c, hex: '#333333' })) }));
    if (setSleeveOptions) setSleeveOptions(prev => ({ ...prev, [selectedProduct.id]: editSleeves }));
    if (setDesignOptions) setDesignOptions(prev => ({ ...prev, [selectedProduct.id]: editDesigns }));

    const calculatedTotalStock = editVariants.length > 0
      ? editVariants.reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0)
      : Math.max(0, formData.stockQuantity);

    const calculatedStatus: ProductItem['status'] =
      calculatedTotalStock <= 0
        ? 'Out of Stock'
        : calculatedTotalStock <= formData.safetyStock
        ? 'Low Stock'
        : 'Ready';

    updateProduct(selectedProduct.id, {
      ...formData,
      name: cleanName,
      sku: cleanSku,
      stockQuantity: calculatedTotalStock,
      status: calculatedStatus,
      lastUpdated: new Date().toISOString().substring(0, 10)
    });

    setShowEditModal(false);
    setSelectedProduct(null);

    setToast({
      type: 'success',
      title: 'Perubahan Tersimpan',
      message: `Informasi produk "${cleanName}" (SKU: ${cleanSku}) berhasil diperbarui.`
    });
  };

  // Open Adjust Stock Modal
  const handleOpenAdjustStockModal = useCallback((p: ProductItem) => {
    setSelectedProduct(p);
    setStockAdjustment({
      type: 'Inbound',
      quantity: 20,
      notes: 'Restok Opname Gudang',
      movementType: 'Inbound Purchase'
    });
    setShowAdjustStockModal(true);
  }, []);

  // Process Stock Adjustment
  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qtyVal = Number(stockAdjustment.quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setToast({
        type: 'error',
        title: 'Kuantitas Tidak Valid',
        message: 'Masukkan kuantitas perubahan stok yang lebih besar dari 0.'
      });
      return;
    }

    let delta = qtyVal;
    if (stockAdjustment.type === 'Outbound') {
      if (qtyVal > selectedProduct.stockQuantity) {
        setToast({
          type: 'error',
          title: 'Stok Tidak Mencukupi',
          message: `Sisa stok saat ini (${selectedProduct.stockQuantity} Pcs) tidak mencukupi untuk pengurangan ${qtyVal} Pcs.`
        });
        return;
      }
      delta = -qtyVal;
    } else if (stockAdjustment.type === 'Set') {
      delta = qtyVal - selectedProduct.stockQuantity;
    }

    const noteText = stockAdjustment.notes?.trim() || 'Koreksi Stok Manual';

    updateProductStock(
      selectedProduct.id,
      delta,
      noteText
    );

    setShowAdjustStockModal(false);
    
    setToast({
      type: 'success',
      title: 'Koreksi Stok Berhasil',
      message: `Stok produk "${selectedProduct.name}" diperbarui (${delta >= 0 ? '+' : ''}${delta} Pcs).`
    });

    setSelectedProduct(null);
  };

  // Open Product Detail Modal
  const handleOpenDetailModal = useCallback((p: ProductItem) => {
    setSelectedProduct(p);
    setShowDetailModal(true);
  }, []);

  // Open Delete Confirmation
  const handleOpenDeleteConfirmModal = useCallback((p: ProductItem) => {
    setSelectedProduct(p);
    setShowDeleteConfirmModal(true);
  }, []);

  // Delete Individual Product with Cascade Cleanup
  const handleConfirmDeleteSingle = () => {
    if (!selectedProduct) return;
    const prodId = selectedProduct.id;
    const prodName = selectedProduct.name;
    const prodSku = selectedProduct.sku;

    deleteProduct(prodId);

    // Cascade Cleanup of option states
    if (setSizeOptions) {
      setSizeOptions(prev => {
        const next = { ...prev };
        delete next[prodId];
        return next;
      });
    }
    if (setColorOptions) {
      setColorOptions(prev => {
        const next = { ...prev };
        delete next[prodId];
        return next;
      });
    }
    if (setSleeveOptions) {
      setSleeveOptions(prev => {
        const next = { ...prev };
        delete next[prodId];
        return next;
      });
    }
    if (setDesignOptions) {
      setDesignOptions(prev => {
        const next = { ...prev };
        delete next[prodId];
        return next;
      });
    }

    setShowDeleteConfirmModal(false);
    setSelectedProduct(null);

    setToast({
      type: 'info',
      title: 'Produk Dihapus',
      message: `Produk "${prodName}" (${prodSku}) beserta catatannya telah dihapus dari katalog.`
    });
  };

  // Helper to parse variation specifications e.g. "Hitam,S", "CADENCE,ALL SIZE", "XL"
  const parseVariationSpec = (rawSpec: string) => {
    const spec = (rawSpec || '').trim();
    if (!spec || spec === 'Default' || spec === '-') {
      return { size: 'Default', color: '-' };
    }

    const parts = spec.split(',').map(s => s.trim());
    const sizeRegex = /^(s|m|l|xl|xxl|2xl|3xl|4xl|5xl|xs|xs - s|m - l|xl - xxl|all size|standard|[0-9]+(ml|g|kg|cm|mm)?)$/i;

    let color = '-';
    let size = '-';

    if (parts.length >= 2) {
      const p0 = parts[0];
      const p1 = parts[1];

      if (sizeRegex.test(p1)) {
        color = p0;
        size = p1;
      } else if (sizeRegex.test(p0)) {
        size = p0;
        color = p1;
      } else {
        color = p0;
        size = p1;
      }
    } else {
      if (sizeRegex.test(parts[0])) {
        size = parts[0];
        color = '-';
      } else {
        color = parts[0];
        size = '-';
      }
    }

    if (color && color !== '-') {
      if (/^3in1legging/i.test(color)) {
        color = color.replace(/^3in1legging/i, '3in1 Legging');
      } else if (/^2in1rok/i.test(color)) {
        color = color.replace(/^2in1rok/i, '2in1 Rok');
      }
    }

    return { color, size };
  };

  // Download Sample Template (Excel & CSV)
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const templateRows = [
      {
        'Kode Produk': 'JRJN-JGR2in1',
        'Nama Produk': 'Jerjhon Celana Panjang Olahraga Jogger 2in1 - Motion Flex',
        'Kode Variasi': '410607748321',
        'SKU Variasi': 'Hitam,S',
        'SKU Induk': 'Jogger Pants',
        'Harga': 'Rp329.000',
        'Stok': 0,
        'HPP': 'Rp98.478',
        'Gudang': 'Jadex'
      },
      {
        'Kode Produk': 'JRJN-JGR2in1',
        'Nama Produk': 'Jerjhon Celana Panjang Olahraga Jogger 2in1 - Motion Flex',
        'Kode Variasi': '410607748322',
        'SKU Variasi': 'Hitam,M',
        'SKU Induk': 'Jogger Pants',
        'Harga': 'Rp329.000',
        'Stok': 2,
        'HPP': 'Rp98.478',
        'Gudang': 'Jadex'
      },
      {
        'Kode Produk': 'JRJN-CAPS03',
        'Nama Produk': 'Jerjhon Topi Olahraga Unisex - Relentless Caps SALE',
        'Kode Variasi': '256656872895',
        'SKU Variasi': 'CADENCE,ALL SIZE',
        'SKU Induk': 'Caps',
        'Harga': 'Rp175.000',
        'Stok': 3,
        'HPP': 'Rp50.000',
        'Gudang': 'Jadex'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Katalog');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, 'Template_Import_Katalog_Produk_JerjhonERP.xlsx');
    } else {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Template_Import_Katalog_Produk_JerjhonERP.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const parseNumberOrCurrency = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    
    let str = String(val).trim();
    if (!str) return 0;

    // Remove currency indicators
    str = str.replace(/^(rp|usd|\$)\.?\s*/i, '');

    // Handle Indonesian dot formatting e.g. "329.000", "98.478"
    if (str.includes('.') && !str.includes(',')) {
      str = str.replace(/\./g, '');
    } else if (str.includes('.') && str.includes(',')) {
      const lastDot = str.lastIndexOf('.');
      const lastComma = str.lastIndexOf(',');
      if (lastComma > lastDot) {
        str = str.replace(/\./g, '').replace(/,/g, '.');
      } else {
        str = str.replace(/,/g, '');
      }
    } else if (str.includes(',')) {
      const parts = str.split(',');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        str = str.replace(/,/g, '');
      } else {
        str = str.replace(/,/g, '.');
      }
    }

    str = str.replace(/[^0-9.]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const handleSeedJerjhonCSV = async () => {
    try {
      setImporting(true);
      setImportStatus('Membersihkan katalog lama dan mensinkronisasi data dari CSV Jerjhon...');

      // 1. Clear existing products and variant configurations
      await clearProducts();

      setVariantPrices({});
      setVariantStocks({});
      setVariantCosts({});
      setVariantSKUs({});
      setVariantKeycells({});

      // 2. Parse CSV
      const lines = JERJHON_CSV_DATA.split('\n');
      if (lines.length < 2) {
        setImporting(false);
        setImportStatus('Data CSV kosong atau tidak valid.');
        return;
      }

      const rows: string[][] = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.split(';'));

      const headers = rows[0].map(h => h.trim().toLowerCase());

      const prodCodeIdx = headers.indexOf('kode produk');
      const nameIdx = headers.indexOf('nama produk');
      const varCodeIdx = headers.indexOf('kode variasi');
      const varSkuIdx = headers.findIndex(h => h === 'sku variasi' || h === 'nama variasi');
      const parentSkuIdx = headers.indexOf('sku induk');
      const priceIdx = headers.findIndex(h => h === 'harga' || h === 'harga jual');
      const stockIdx = headers.indexOf('stok');
      const costIdx = headers.indexOf('hpp');
      const whIdx = headers.indexOf('gudang');

      const productMap = new Map<string, {
        sku: string;
        parentSku?: string;
        name: string;
        category: string;
        warehouse: string;
        unitCostPrice: number;
        sellingPrice: number;
        stockQuantity: number;
        minimumStock: number;
        safetyStock: number;
        unit: 'Pcs';
        variations: { varCode: string; label: string; size: string; color: string; price: number; cost: number; stock: number; warehouse: string }[];
      }>();

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const prodName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : '';
        if (!prodName) continue;

        const pSku = prodCodeIdx !== -1 && row[prodCodeIdx] ? row[prodCodeIdx].trim() : '';
        const parentSkuVal = parentSkuIdx !== -1 && row[parentSkuIdx] ? row[parentSkuIdx].trim() : '';
        const varCodeVal = varCodeIdx !== -1 && row[varCodeIdx] ? row[varCodeIdx].trim() : '';
        const varSkuVal = varSkuIdx !== -1 && row[varSkuIdx] ? row[varSkuIdx].trim() : 'Default';

        const price = priceIdx !== -1 && row[priceIdx] ? parseNumberOrCurrency(row[priceIdx]) || 175000 : 175000;
        const cost = costIdx !== -1 && row[costIdx] ? parseNumberOrCurrency(row[costIdx]) || 50000 : 50000;
        const stock = stockIdx !== -1 && row[stockIdx] ? parseInt(String(row[stockIdx]).replace(/[^0-9]/g, ''), 10) || 0 : 0;
        const warehouse = whIdx !== -1 && row[whIdx] ? row[whIdx].trim() : 'Jadex';

        const { size, color } = parseVariationSpec(varSkuVal);
        const mapKey = pSku || prodName;

        if (!productMap.has(mapKey)) {
          productMap.set(mapKey, {
            sku: pSku || `SKU-${Math.floor(Math.random() * 100000)}`,
            parentSku: parentSkuVal || undefined,
            name: prodName,
            category: parentSkuVal || 'Sportswear',
            warehouse,
            unitCostPrice: cost,
            sellingPrice: price,
            stockQuantity: 0,
            minimumStock: 10,
            safetyStock: 20,
            unit: 'Pcs',
            variations: []
          });
        }

        const existing = productMap.get(mapKey)!;
        existing.stockQuantity += stock;
        existing.variations.push({
          varCode: varCodeVal || `${pSku}-${i}`,
          label: varSkuVal,
          size,
          color,
          price,
          cost,
          stock,
          warehouse
        });
      }

      let importedCount = 0;
      const sizeOptionsMap: Record<string, string[]> = {};
      const colorOptionsMap: Record<string, string[]> = {};
      const localStocks: Record<string, number> = {};
      const localPrices: Record<string, number> = {};
      const localCosts: Record<string, number> = {};
      const localSKUs: Record<string, string> = {};

      productMap.forEach((pData, pSku) => {
        const newProdId = `PROD-${pSku}`;
        const newProduct: ProductItem = {
          id: newProdId,
          sku: pData.sku,
          parentSku: pData.parentSku,
          name: pData.name,
          category: pData.category,
          warehouse: pData.warehouse,
          stockQuantity: pData.stockQuantity,
          minimumStock: pData.minimumStock,
          safetyStock: pData.safetyStock,
          unitCostPrice: pData.unitCostPrice,
          sellingPrice: pData.sellingPrice,
          unit: pData.unit,
          status: pData.stockQuantity <= 0 ? 'Out of Stock' : pData.stockQuantity <= pData.safetyStock ? 'Low Stock' : 'Ready',
          lastUpdated: new Date().toISOString().substring(0, 10)
        };

        addProduct(newProduct);
        importedCount++;

        const sizesSet = new Set<string>();
        const colorsSet = new Set<string>();

        pData.variations.forEach(v => {
          sizesSet.add(v.size);
          if (v.color !== '-') colorsSet.add(v.color);

          const globalKey = `${newProdId}-${v.size}-${v.color}---`;

          localStocks[globalKey] = v.stock;
          localPrices[globalKey] = v.price;
          localCosts[globalKey] = v.cost;
          localSKUs[globalKey] = v.varCode || v.label;
        });

        if (sizesSet.size > 0) {
          sizeOptionsMap[newProdId] = Array.from(sizesSet);
        }
        if (colorsSet.size > 0) {
          colorOptionsMap[newProdId] = Array.from(colorsSet);
        }
      });

      setVariantStocks(localStocks);
      setVariantPrices(localPrices);
      setVariantCosts(localCosts);
      setVariantSKUs(localSKUs);
      setSizeOptions(sizeOptionsMap);
      setColorOptions(colorOptionsMap);

      setImporting(false);
      setImportStatus(`Sukses menyinkronkan data katalog: ${importedCount} produk berhasil di-seed dari data CSV Jerjhon.`);
      setToast({
        type: 'success',
        title: 'Sinkronisasi CSV Jerjhon Berhasil',
        message: `Katalog tersinkronisasi: ${importedCount} produk Jerjhon beserta seluruh variasi harga & stok berhasil dimasukkan.`
      });
      setTimeout(() => {
        setShowSeedCSVModal(false);
        setImportStatus(null);
      }, 2500);
    } catch (err) {
      console.error(err);
      setImporting(false);
      setImportStatus('Gagal memproses seeding CSV.');
      setToast({
        type: 'error',
        title: 'Gagal Seeding CSV',
        message: 'Terjadi kesalahan saat memproses data CSV Jerjhon.'
      });
    }
  };

  // Bulk File Upload Parsing (Excel / CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus('Membaca dan memproses file catalog import...');

    const isCSV = file.name.toLowerCase().endsWith('.csv');

    const processMatrix = (matrix: any[][]) => {
      try {
        let headerIdx = -1;
        for (let i = 0; i < Math.min(matrix.length, 15); i++) {
          const rowStr = JSON.stringify(matrix[i]).toLowerCase();
          if (
            rowStr.includes('nama produk') ||
            rowStr.includes('product name') ||
            rowStr.includes('harga') ||
            rowStr.includes('stok') ||
            rowStr.includes('sku') ||
            rowStr.includes('kode variasi') ||
            rowStr.includes('kode produk')
          ) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) headerIdx = 0;

        const headers = matrix[headerIdx].map((h: any) => String(h || '').trim().toLowerCase());

        // Product-level columns
        const prodCodeIdx = headers.findIndex(h => h.includes('kode produk') || h.includes('product code') || h === 'kode_produk');
        const nameIdx = headers.findIndex(h => h.includes('nama produk') || h.includes('product name') || h === 'nama_produk');
        const parentSkuIdx = headers.findIndex(h => h.includes('sku induk') || h.includes('parent sku') || h.includes('sku_induk'));

        // Variation-level columns
        const varCodeIdx = headers.findIndex(h => h.includes('kode variasi') || h.includes('variation code') || h.includes('variant code'));
        const varSkuIdx = headers.findIndex(h => h.includes('sku variasi') || h.includes('nama variasi') || h.includes('variation name') || h.includes('variant name') || h.includes('variation sku'));
        const skuIdx = headers.findIndex(h => h === 'sku' || h === 'kode sku' || (h.includes('sku') && !h.includes('induk') && !h.includes('variasi')));

        // Financials & inventory quantities
        const priceIdx = headers.findIndex(h => h === 'harga' || h === 'harga jual' || h.includes('harga') || h.includes('price'));
        const costIdx = headers.findIndex(h => h === 'hpp' || h === 'cost' || h.includes('hpp') || h.includes('cost') || h.includes('modal') || h.includes('beli'));
        const stockIdx = headers.findIndex(h => h === 'stok' || h === 'stock' || h.includes('stok') || h.includes('stock') || h.includes('qty') || h.includes('jumlah'));

        // Warehouse & Category
        const catIdx = headers.findIndex(h => h.includes('kategori') || h.includes('category'));
        const whIdx = headers.findIndex(h => h.includes('gudang') || h.includes('warehouse'));

        const productMap = new Map<string, {
          sku: string;
          parentSku?: string;
          name: string;
          category: string;
          warehouse: string;
          unitCostPrice: number;
          sellingPrice: number;
          stockQuantity: number;
          minimumStock: number;
          safetyStock: number;
          unit: 'Pcs';
          variations: { varCode: string; label: string; size: string; color: string; price: number; cost: number; stock: number; warehouse: string }[];
        }>();

        for (let i = headerIdx + 1; i < matrix.length; i++) {
          let row = matrix[i];
          if (!row || row.length === 0) continue;

          // Split semicolon separated text line if needed
          if (row.length === 1 && typeof row[0] === 'string' && row[0].includes(';')) {
            row = row[0].split(';');
          }

          const prodName = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';
          if (!prodName) continue;

          const prodNameLower = prodName.toLowerCase();
          if (
            prodNameLower.includes('wajib') ||
            prodNameLower.includes('contoh') ||
            prodNameLower.includes('mohon masukkan') ||
            prodNameLower.startsWith('---')
          ) {
            continue;
          }

          const prodCodeVal = prodCodeIdx !== -1 && row[prodCodeIdx] ? String(row[prodCodeIdx]).trim() : '';
          const parentSkuVal = parentSkuIdx !== -1 && row[parentSkuIdx] ? String(row[parentSkuIdx]).trim() : '';
          const skuVal = skuIdx !== -1 && row[skuIdx] ? String(row[skuIdx]).trim() : '';

          const productSku = prodCodeVal || parentSkuVal || skuVal || `SKU-IMP-${Math.floor(100 + Math.random() * 900)}`;

          const varCodeVal = varCodeIdx !== -1 && row[varCodeIdx] ? String(row[varCodeIdx]).trim() : '';
          const varSkuVal = varSkuIdx !== -1 && row[varSkuIdx] ? String(row[varSkuIdx]).trim() : 'Default';

          const price = priceIdx !== -1 ? parseNumberOrCurrency(row[priceIdx]) : 175000;
          const cost = costIdx !== -1 ? parseNumberOrCurrency(row[costIdx]) : 50000;
          const stock = stockIdx !== -1 ? parseInt(String(row[stockIdx] || '0').replace(/[^0-9]/g, ''), 10) || 0 : 0;

          const category = catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : (parentSkuVal || 'Cycling & Sport');
          const warehouse = whIdx !== -1 && row[whIdx] ? String(row[whIdx]).trim() : 'Jadex';

          const { size, color } = parseVariationSpec(varSkuVal);

          const mapKey = productSku;

          if (!productMap.has(mapKey)) {
            productMap.set(mapKey, {
              sku: productSku,
              parentSku: parentSkuVal || undefined,
              name: prodName,
              category,
              warehouse,
              unitCostPrice: cost,
              sellingPrice: price,
              stockQuantity: 0,
              minimumStock: 10,
              safetyStock: 20,
              unit: 'Pcs',
              variations: []
            });
          }

          const existing = productMap.get(mapKey)!;
          existing.stockQuantity += stock;
          existing.variations.push({
            varCode: varCodeVal || `${productSku}-${i}`,
            label: varSkuVal,
            size,
            color,
            price,
            cost,
            stock,
            warehouse
          });
        }

        let importedCount = 0;
        const sizeOptionsMap: Record<string, string[]> = {};
        const colorOptionsMap: Record<string, string[]> = {};
        const localStocks: Record<string, number> = {};
        const localPrices: Record<string, number> = {};
        const localCosts: Record<string, number> = {};
        const localSKUs: Record<string, string> = {};

        productMap.forEach((pData) => {
          const newProdId = `PROD-${pData.sku}`;
          const newProduct: ProductItem = {
            id: newProdId,
            sku: pData.sku,
            parentSku: pData.parentSku,
            name: pData.name,
            category: pData.category,
            warehouse: pData.warehouse,
            stockQuantity: pData.stockQuantity,
            minimumStock: pData.minimumStock,
            safetyStock: pData.safetyStock,
            unitCostPrice: pData.unitCostPrice,
            sellingPrice: pData.sellingPrice,
            unit: pData.unit,
            status: pData.stockQuantity <= 0 ? 'Out of Stock' : pData.stockQuantity <= pData.safetyStock ? 'Low Stock' : 'Ready',
            lastUpdated: new Date().toISOString().substring(0, 10)
          };

          addProduct(newProduct);
          importedCount++;

          const sizesSet = new Set<string>();
          const colorsSet = new Set<string>();

          pData.variations.forEach(v => {
            sizesSet.add(v.size);
            if (v.color !== '-') colorsSet.add(v.color);

            const globalKey = `${newProdId}-${v.size}-${v.color}---`;

            localStocks[globalKey] = v.stock;
            localPrices[globalKey] = v.price;
            localCosts[globalKey] = v.cost;
            localSKUs[globalKey] = v.varCode || v.label;
          });

          if (sizesSet.size > 0) {
            sizeOptionsMap[newProdId] = Array.from(sizesSet);
          }
          if (colorsSet.size > 0) {
            colorOptionsMap[newProdId] = Array.from(colorsSet);
          }
        });

        setVariantStocks(prev => ({ ...prev, ...localStocks }));
        setVariantPrices(prev => ({ ...prev, ...localPrices }));
        setVariantCosts(prev => ({ ...prev, ...localCosts }));
        setVariantSKUs(prev => ({ ...prev, ...localSKUs }));
        setSizeOptions(prev => ({ ...prev, ...sizeOptionsMap }));
        setColorOptions(prev => ({ ...prev, ...colorOptionsMap }));

        setImporting(false);
        setImportStatus(`Sukses mengimpor ${importedCount} produk beserta variasi dari file.`);
        setToast({
          type: 'success',
          title: 'Import File Berhasil',
          message: `Berhasil mengimpor ${importedCount} SKU produk beserta variasi harga & stok dari file.`
        });
        setTimeout(() => {
          setShowImportModal(false);
          setImportStatus(null);
        }, 2200);
      } catch (err) {
        console.error(err);
        setImporting(false);
        setImportStatus('Gagal memproses file import catalog.');
        setToast({
          type: 'error',
          title: 'Gagal Import File',
          message: 'Format file tidak sesuai atau berisi data korupt. Silakan gunakan template resmi.'
        });
      }
    };

    const reader = new FileReader();
    if (isCSV) {
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (!text) return;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        const delimiter = text.includes(';') ? ';' : text.includes('\t') ? '\t' : ',';
        const matrix = lines.map(line => line.split(delimiter));
        processMatrix(matrix);
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.onload = (evt) => {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        processMatrix(matrix);
      };
      reader.readAsBinaryString(file);
    }
  };

  // Export Filtered Catalog to Excel / CSV / PDF
  const handleExportData = (type: 'excel' | 'csv' | 'pdf') => {
    const targetProducts = selectedProductIds.length > 0
      ? products.filter(p => selectedProductIds.includes(p.id))
      : filteredProducts;

    if (targetProducts.length === 0) {
      setToast({
        type: 'warning',
        title: 'Tidak Ada Data',
        message: 'Tidak ada data produk yang sesuai untuk diexport.'
      });
      return;
    }

    if (type === 'csv') {
      const rows = targetProducts.map(p => ({
        'Kode SKU': p.sku,
        'Nama Produk': p.name,
        'Kategori': p.category,
        'Gudang': p.warehouse,
        'Stok (Qty)': p.stockQuantity,
        'Satuan': p.unit,
        'Harga HPP (Rp)': p.unitCostPrice,
        'Harga Jual (Rp)': p.sellingPrice,
        'Est Margin (%)': Math.round(((p.sellingPrice - p.unitCostPrice) / (p.sellingPrice || 1)) * 100),
        'Total Nilai Stok HPP (Rp)': p.stockQuantity * p.unitCostPrice,
        'Status': p.status,
        'Terakhir Diperbarui': p.lastUpdated
      }));
      exportToCSV('JerjhonERP_Katalog_Produk', rows);
    } else if (type === 'excel') {
      const rows = targetProducts.map(p => ({
        'Kode SKU': p.sku,
        'Nama Produk': p.name,
        'Kategori': p.category,
        'Gudang Penyimpanan': p.warehouse,
        'Stok Total': p.stockQuantity,
        'Safety Stock': p.safetyStock,
        'Satuan': p.unit,
        'Harga HPP (Rp)': p.unitCostPrice,
        'Harga Jual (Rp)': p.sellingPrice,
        'Total Nilai HPP (Rp)': p.stockQuantity * p.unitCostPrice,
        'Status Stok': p.status,
        'Last Update': p.lastUpdated
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Katalog_Produk');
      XLSX.writeFile(workbook, `JerjhonERP_Export_Produk_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } else if (type === 'pdf') {
      const headers = ['SKU', 'Nama Produk', 'Kategori', 'Gudang', 'Stok', 'HPP (Rp)', 'Harga Jual (Rp)', 'Status'];
      const data = targetProducts.map(p => [
        p.sku,
        p.name,
        p.category,
        p.warehouse,
        `${p.stockQuantity} ${p.unit}`,
        formatIDR(p.unitCostPrice),
        formatIDR(p.sellingPrice),
        p.status
      ]);
      exportToPDF('Laporan Katalog Produk & Inventaris Stok', headers, data);
    }
  };

  const handleExportMovements = () => {
    if (filteredStockMovements.length === 0) {
      setToast({
        type: 'warning',
        title: 'Tidak Ada Log Pergerakan',
        message: 'Tidak ada data pergerakan stok yang sesuai dengan filter untuk diexport.'
      });
      return;
    }
    const rows = filteredStockMovements.map(m => ({
      'ID Gerakan': m.id,
      'Tanggal': m.date,
      'SKU Produk': m.productSku,
      'Nama Produk': m.productName,
      'Jenis Pergerakan': m.type,
      'Quantity (Pcs)': m.quantity,
      'Lokasi Asal': m.sourceLocation,
      'Lokasi Tujuan': m.destinationLocation,
      'Operator': m.operator,
      'No Referensi': m.referenceNumber || '-'
    }));
    exportToCSV('JerjhonERP_Pergerakan_Stok', rows);
  };

  // Copy SKU handler
  const handleCopySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <RoleAccessBanner moduleName="Katalog Produk & Manajemen Stok Varian" />

      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-rose-100 dark:bg-rose-950/60 text-[#b90f0f] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              Gudang & Inventaris
            </span>
            <span className="text-slate-400 text-xs">• Enterprise ERP Module</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Package className="w-7 h-7 text-[#b90f0f]" />
            Katalog Produk & Stok Varian
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Sistem manajemen katalog produk terpadu gaya e-commerce (Shopee/Tokopedia). Mendukung CRUD lengkap, stok variasi multi-tipe, kontrol nilai aset HPP, restok instan, dan impor/ekspor file Excel / CSV.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs border border-slate-200 dark:border-slate-600"
            title="Download Format File Excel / CSV"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Download Template</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel / CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total SKU" value={stats.totalSku} icon={Tag} />
        <StatCard title="Total Stok" value={stats.totalStock} icon={Layers} />
        <StatCard title="Nilai Stok (HPP)" value={formatIDR(stats.totalValuationCost)} icon={DollarSign} />
        <StatCard title="Potensi Penjualan" value={formatIDR(stats.totalValuationSelling)} icon={TrendingUp} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setShowSeedCSVModal(true)}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs transition-all"
            title="Sinkronkan dengan data katalog CSV Jerjhon asli"
          >
            <Boxes className="w-4 h-4" />
            <span>Seed Data CSV</span>
          </button>

          <button
            onClick={() => {
              syncInventoryToPOS();
              setToast({
                type: 'success',
                title: 'Sinkronisasi POS Kasir Berhasil',
                message: 'Pemetaan variasi SKU dari Modul Inventaris ke database kasir POS telah diperbarui.'
              });
            }}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Sync SKU Variations from Inventory module to POS Kasir item database"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Sync POS Kasir</span>
          </button>

          <div className="relative group">
            <button
              onClick={() => handleExportData('excel')}
              className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Export</span>
            </button>
          </div>

          <button
            onClick={() => setGlobalActiveTab('pos_retail')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer"
            title="Buka Kasir Retail POS dengan katalog produk terintegrasi"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buka POS Kasir</span>
          </button>

          {!isStaff && (
            <>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>

              <button
                onClick={() => setShowDeleteAllModal(true)}
                disabled={isClearing || products.length === 0}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-2xl text-xs font-bold transition-all border border-rose-200 dark:border-rose-900 disabled:opacity-50"
                title="Hapus Semua Data Katalog"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      
      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-[#b90f0f] flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Produk SKU</span>
            <span className="text-xl font-black text-slate-900 dark:text-white block">{stats.totalSku} Item</span>
            <span className="text-[10px] text-slate-500">{stats.totalStock.toLocaleString()} Pcs Total Stok</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nilai Aset Stok (HPP)</span>
            <span className="text-lg font-black text-slate-900 dark:text-white block">{formatIDR(stats.totalValuationCost)}</span>
            <span className="text-[10px] text-emerald-600 font-bold">Est Jual: {formatIDR(stats.totalValuationSelling)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Stok Kritis / Low</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 block">{stats.lowStockCount} SKU</span>
            <span className="text-[10px] text-amber-600 font-medium">Di bawah safety limit</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Stok Habis (Empty)</span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 block">{stats.outOfStockCount} SKU</span>
            <span className="text-[10px] text-rose-500 font-medium">Perlu Restok Ulang</span>
          </div>
        </div>
      </div>

      {/* Main View Mode Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'catalog'
              ? 'bg-[#b90f0f] text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Katalog Utama ({filteredProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('low_stock')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'low_stock'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Radar Stok Kritis ({lowStockProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'movements'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Log Pergerakan Stok ({stockMovements.length})</span>
        </button>
      </div>

      {/* TAB 1: KATALOG UTAMA */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU, nama produk, kategori, atau gudang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#b90f0f]/30"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={parentSkuFilter}
                  onChange={(e) => setParentSkuFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="all">Semua SKU Induk</option>
                  {availableParentSkus.map(ps => (
                    <option key={ps} value={ps}>{ps}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Boxes className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="all">Semua Gudang</option>
                  {availableWarehouses.map(wh => (
                    <option key={wh} value={wh}>{wh}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowCategoryWarehouseManager(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Kelola & Hapus Master Kategori / Gudang"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Kelola Kategori & Gudang</span>
              </button>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="name_asc">Nama (A - Z)</option>
                  <option value="name_desc">Nama (Z - A)</option>
                  <option value="stock_high">Stok Tertinggi</option>
                  <option value="stock_low">Stok Terendah</option>
                  <option value="price_high">Harga Jual Tertinggi</option>
                  <option value="price_low">Harga Jual Terendah</option>
                </select>
              </div>

              {/* Status Filter Pills & Expand All Toggle */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'Ready', 'Low Stock', 'Out of Stock'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'Semua Status' : st}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const allSkus = groupedProductList.map(g => g.sku);
                    const areAllExpanded = allSkus.every(sku => expandedProducts[sku]);
                    const nextState: Record<string, boolean> = {};
                    if (!areAllExpanded) {
                      allSkus.forEach(sku => { nextState[sku] = true; });
                    }
                    setExpandedProducts(nextState);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200/80 dark:border-indigo-800"
                  title="Buka / Tutup Semua Dropdown Varian"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{groupedProductList.length > 0 && groupedProductList.every(g => expandedProducts[g.sku]) ? 'Tutup Semua Varian' : 'Buka Semua Varian'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Catalog Data Table */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left border-collapse text-xs min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-black uppercase tracking-wider">
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                        className="rounded border-slate-300 text-[#b90f0f] focus:ring-[#b90f0f]"
                      />
                    </th>
                    <th className="p-4">Kode Produk</th>
                    <th className="p-4">Nama Produk</th>
                    <th className="p-4">Kode Variasi</th>
                    <th className="p-4">SKU Variasi</th>
                    <th className="p-4">SKU Induk</th>
                    <th className="p-4">Harga Jual</th>
                    <th className="p-4">Stok</th>
                    <th className="p-4">HPP</th>
                    <th className="p-4">Gudang</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {groupedProductList.length > 0 ? (
                    groupedProductList.map((group) => {
                      const { sku, products: prods, primaryProduct: p, allItems, totalStock, minPrice, maxPrice, avgCost } = group;
                      const isExpanded = !!expandedProducts[sku];

                      return (
                        <React.Fragment key={`group-${sku}`}>
                          {/* Master Product Row with Dropdown ▶ */}
                          <tr
                            className={`transition-colors border-b border-slate-200/80 dark:border-slate-700/80 ${
                              isExpanded ? 'bg-slate-100/70 dark:bg-slate-800/90' : 'hover:bg-slate-50/80 dark:hover:bg-slate-750/50 bg-white dark:bg-slate-800'
                            }`}
                          >
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={prods.every(prd => selectedProductIds.includes(prd.id))}
                                onChange={() => {
                                  const allSelected = prods.every(prd => selectedProductIds.includes(prd.id));
                                  if (allSelected) {
                                    setSelectedProductIds(prev => prev.filter(id => !prods.some(prd => prd.id === id)));
                                  } else {
                                    const newIds = prods.map(prd => prd.id);
                                    setSelectedProductIds(prev => Array.from(new Set([...prev, ...newIds])));
                                  }
                                }}
                                className="rounded border-slate-300 text-[#b90f0f] focus:ring-[#b90f0f]"
                              />
                            </td>

                            {/* 1. Kode Produk with Dropdown Play Icon ▶ */}
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(sku)}
                                  className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                                  title={isExpanded ? "Tutup varian produk" : "Buka varian produk"}
                                >
                                  <Play
                                    className={`w-3 h-3 text-slate-800 dark:text-slate-200 fill-slate-800 dark:fill-slate-200 transition-transform duration-200 ${
                                      isExpanded ? 'rotate-90 text-[#b90f0f] dark:text-rose-400 fill-[#b90f0f] dark:fill-rose-400' : ''
                                    }`}
                                  />
                                </button>
                                <span
                                  onClick={() => toggleExpand(sku)}
                                  className="font-mono text-xs font-black text-slate-900 dark:text-white cursor-pointer hover:text-[#b90f0f] dark:hover:text-rose-400 transition-colors"
                                >
                                  {sku}
                                </span>
                                {allItems.length > 1 && (
                                  <span className="text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/50 text-[#b90f0f] dark:text-rose-400 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                                    {allItems.length}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 2. Nama Produk */}
                            <td className="p-4 font-bold text-slate-900 dark:text-white max-w-[220px] truncate" title={p.name}>
                              {p.name}
                            </td>

                            {/* 3. Kode Variasi */}
                            <td className="p-4 whitespace-nowrap">
                              {allItems.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(sku)}
                                  className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg font-extrabold text-[10px] border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                                >
                                  <span>{allItems.length} Varian</span>
                                  <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">-</span>
                              )}
                            </td>

                            {/* 4. SKU Variasi */}
                            <td className="p-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {allItems.length === 1 ? allItems[0].vSku : <span className="text-slate-400 italic text-[11px]">Multiple SKU ({allItems.length})</span>}
                            </td>

                            {/* 5. SKU Induk */}
                            <td className="p-4 font-mono text-xs font-medium text-slate-500 whitespace-nowrap">
                              {p.parentSku || '-'}
                            </td>

                            {/* 6. Harga Jual */}
                            <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              {minPrice === maxPrice ? formatIDR(minPrice) : `${formatIDR(minPrice)} - ${formatIDR(maxPrice)}`}
                            </td>

                            {/* 7. Stok */}
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs">
                                <span>{totalStock}</span>
                                <span className="text-slate-400 text-[10px] font-normal">{p.unit}</span>
                                {totalStock <= p.safetyStock && (
                                  <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[8px] px-1 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-bold">
                                    Limit!
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 8. HPP */}
                            <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {formatIDR(avgCost)}
                            </td>

                            {/* 9. Gudang */}
                            <td className="p-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                              {p.warehouse}
                            </td>

                            {/* Aksi */}
                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenDetailModal(p)}
                                  className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
                                  title="Detail & Barcode SKU"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setGlobalActiveTab('pos_retail')}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl transition-colors cursor-pointer"
                                  title="Jual Produk Ini di Kasir POS"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                </button>

                                {!isStaff && (
                                  <>
                                    <button
                                      onClick={() => handleOpenAdjustStockModal(p)}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl transition-colors"
                                      title="Koreksi / Restok Stok"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleOpenEditModal(p)}
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded-xl transition-colors"
                                      title="Edit Data Produk"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleOpenDeleteConfirmModal(p)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl transition-colors"
                                      title="Hapus SKU Produk"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Child Rows (Rolled Down Variant Details) */}
                          {isExpanded && allItems.map((item, idx) => {
                            const { product: itemProd, combo, globalKey, vSku, vCost, vStock, vPrice } = item;
                            const isItemTmpSelected = selectedProductIds.includes(itemProd.id);

                            return (
                              <tr
                                key={`${sku}-variant-${globalKey}-${idx}`}
                                className={`bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800 transition-colors ${
                                  isItemTmpSelected ? 'bg-rose-50/40 dark:bg-rose-950/30' : 'hover:bg-slate-100/80 dark:hover:bg-slate-850'
                                }`}
                              >
                                <td className="p-3 text-center pl-6">
                                  <input
                                    type="checkbox"
                                    checked={isItemTmpSelected}
                                    onChange={() => handleSelectProduct(itemProd.id)}
                                    className="rounded border-slate-300 text-[#b90f0f] focus:ring-[#b90f0f]"
                                  />
                                </td>

                                {/* 1. Kode Produk (Indented with ↳ branch) */}
                                <td className="p-3 pl-8 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 dark:text-slate-500 font-mono text-sm">↳</span>
                                    <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                      {sku}
                                    </span>
                                  </div>
                                </td>

                                {/* 2. Nama Produk */}
                                <td className="p-3 text-slate-700 dark:text-slate-300 text-xs font-medium max-w-[200px] truncate" title={itemProd.name}>
                                  {itemProd.name}
                                </td>

                                {/* 3. Kode Variasi */}
                                <td className="p-3 font-mono text-xs font-bold whitespace-nowrap">
                                  {vSku ? (
                                    <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border border-indigo-200 dark:border-indigo-800 inline-block">
                                      {vSku}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">-</span>
                                  )}
                                </td>

                                {/* 4. SKU Variasi */}
                                <td className="p-3 font-medium text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                  {combo.label === 'Default Varian' ? (
                                    <span className="text-slate-400 italic text-[11px]">-</span>
                                  ) : (
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-semibold text-xs border border-slate-200 dark:border-slate-700 inline-block">
                                      {combo.label}
                                    </span>
                                  )}
                                </td>

                                {/* 5. SKU Induk */}
                                <td className="p-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                                  {itemProd.parentSku || '-'}
                                </td>

                                {/* 6. Harga Jual */}
                                <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">
                                  {formatIDR(vPrice)}
                                </td>

                                {/* 7. Stok */}
                                <td className="p-3 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-mono font-bold text-xs ${
                                      vStock === 0
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : vStock <= itemProd.safetyStock
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-slate-900 dark:text-white'
                                    }`}>
                                      {vStock} {itemProd.unit}
                                    </span>

                                    {!isStaff && (
                                      <div className="inline-flex items-center gap-0.5 ml-1">
                                        <button
                                          onClick={() => {
                                            const nextVal = Math.max(0, vStock - 1);
                                            setVariantStocks({ ...variantStocks, [globalKey]: nextVal });
                                          }}
                                          className="w-5 h-5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 rounded font-bold text-[10px] flex items-center justify-center transition-colors cursor-pointer"
                                          title="Kurangi 1 Stok"
                                        >
                                          -
                                        </button>
                                        <button
                                          onClick={() => {
                                            const nextVal = vStock + 1;
                                            setVariantStocks({ ...variantStocks, [globalKey]: nextVal });
                                          }}
                                          className="w-5 h-5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 rounded font-bold text-[10px] flex items-center justify-center transition-colors cursor-pointer"
                                          title="Tambah 1 Stok"
                                        >
                                          +
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* 8. HPP */}
                                <td className="p-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {formatIDR(vCost)}
                                </td>

                                {/* 9. Gudang */}
                                <td className="p-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                                  {itemProd.warehouse}
                                </td>

                                {/* Aksi */}
                                <td className="p-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleOpenDetailModal(itemProd)}
                                      className="p-1 bg-slate-200/60 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 rounded-lg text-xs"
                                      title="Lihat Barcode / Detail"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                    {!isStaff && (
                                      <button
                                        onClick={() => handleOpenAdjustStockModal(itemProd)}
                                        className="p-1 bg-emerald-100/70 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs"
                                        title="Koreksi Stok Varian"
                                      >
                                        <RefreshCw className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="p-12 text-center text-slate-400">
                        <div className="max-w-md mx-auto space-y-3">
                          <Package className="w-10 h-10 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-700 dark:text-slate-300">Tidak ada produk ditemukan</p>
                          <p className="text-xs text-slate-400">
                            Coba ubah kata kunci pencarian atau filter SKU Induk Anda, atau tambahkan produk baru.
                          </p>
                          <button
                            onClick={handleOpenAddModal}
                            className="inline-flex items-center gap-1.5 bg-[#b90f0f] text-white px-4 py-2 rounded-xl text-xs font-bold"
                          >
                            <Plus className="w-4 h-4" /> Tambah Produk Baru
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RADAR STOK KRITIS */}
      {activeTab === 'low_stock' && (
        <LowStockAlertView
          lowStockProducts={lowStockProducts}
          handleOpenAdjustStockModal={handleOpenAdjustStockModal}
          handleOpenDetailModal={handleOpenDetailModal}
        />
      )}

      {/* TAB 3: RIWAYAT PERGERAKAN STOK */}
      {activeTab === 'movements' && (
        <StockMovementsTable
          movementStats={movementStats}
          movementSearch={movementSearch}
          setMovementSearch={setMovementSearch}
          movementTypeFilter={movementTypeFilter}
          setMovementTypeFilter={setMovementTypeFilter}
          movementOperatorFilter={movementOperatorFilter}
          setMovementOperatorFilter={setMovementOperatorFilter}
          movementDateFilter={movementDateFilter}
          setMovementDateFilter={setMovementDateFilter}
          uniqueOperators={uniqueOperators}
          handleExportMovements={handleExportMovements}
          setDeleteAllMovementsConfirmModal={setDeleteAllMovementsConfirmModal}
          filteredStockMovements={filteredStockMovements}
          stockMovements={stockMovements}
          setDeleteMovementConfirmModal={setDeleteMovementConfirmModal}
        />
      )}

      {/* MODAL 1: ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#b90f0f]" />
                  Tambah SKU Produk Baru Ke Katalog
                </h3>
                <p className="text-xs text-slate-500">
                  Isi informasi utama, atur dimensi variasi dinamis (POS Kasir / Shopee style), dan tentukan stok per varian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b pb-2">
              <button
                type="button"
                onClick={() => setEditModalTab('basic')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  editModalTab === 'basic'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>1. Informasi Utama Produk</span>
              </button>

              <button
                type="button"
                onClick={() => setEditModalTab('dimensions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  editModalTab === 'dimensions'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Tag className="w-4 h-4 text-indigo-500" />
                <span>2. Dimensi Varian ({editDimensionGroups.length} Atribut)</span>
              </button>

              <button
                type="button"
                onClick={() => setEditModalTab('variants')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  editModalTab === 'variants'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>3. Edit Stok & Harga Varian ({editVariants.length})</span>
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {/* TAB 1: BASIC INFORMATION */}
              {editModalTab === 'basic' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Kode SKU *</label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                        placeholder="Contoh: SKU-JJ-105"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Nama Produk *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                        placeholder="Nama produk lengkap..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* SKU Induk Input */}
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        SKU Induk (Parent SKU) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.parentSku || ''}
                        onChange={(e) => setFormData({ ...formData, parentSku: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                        placeholder="Contoh: SKU-PARENT-01"
                      />
                    </div>

                    {/* Warehouse Selector with Manual Option */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">
                          Gudang Penyimpanan Utama
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomWarehouseInput(!isCustomWarehouseInput);
                            setNewWarehouseInputValue('');
                          }}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 cursor-pointer"
                        >
                          {isCustomWarehouseInput ? '← Pilih dari List' : '+ Tambah Gudang Baru'}
                        </button>
                      </div>

                      {isCustomWarehouseInput ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Ketik nama gudang baru..."
                            value={newWarehouseInputValue}
                            onChange={(e) => {
                              setNewWarehouseInputValue(e.target.value);
                              setFormData({ ...formData, warehouse: e.target.value });
                            }}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newWarehouseInputValue.trim()) {
                                const val = newWarehouseInputValue.trim();
                                addCustomWarehouse(val);
                                setFormData({ ...formData, warehouse: val });
                                setIsCustomWarehouseInput(false);
                              }
                            }}
                            className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shrink-0 hover:bg-indigo-700 cursor-pointer"
                          >
                            Simpan
                          </button>
                        </div>
                      ) : (
                        <select
                          value={formData.warehouse}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomWarehouseInput(true);
                              setNewWarehouseInputValue('');
                            } else {
                              setFormData({ ...formData, warehouse: e.target.value });
                            }
                          }}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        >
                          {availableWarehouses.map(wh => (
                            <option key={wh} value={wh}>{wh}</option>
                          ))}
                          <option value="__ADD_NEW__" className="text-indigo-600 font-bold">+ Tambah Gudang Baru Manual...</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Safety Stock (Batas Alert)</label>
                      <input
                        type="number"
                        value={formData.safetyStock}
                        onChange={(e) => setFormData({ ...formData, safetyStock: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Batas Minimal Stok</label>
                      <input
                        type="number"
                        value={formData.minimumStock}
                        onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Satuan Unit</label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Box">Box</option>
                        <option value="Kg">Kg</option>
                        <option value="Set">Set</option>
                        <option value="Meter">Meter</option>
                        <option value="Roll">Roll</option>
                        <option value="Pasang">Pasang</option>
                        <option value="Botol">Botol</option>
                        <option value="Unit">Unit</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Variant Banner */}
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs text-indigo-900 dark:text-indigo-200 font-semibold">
                        Konfigurasi Varian: <strong className="font-mono text-indigo-700 dark:text-indigo-300">{editVariants.length} Kombinasi Varian</strong> akan dibuat secara otomatis.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditModalTab('dimensions')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      Lanjut Atur Dimensi Varian ➔
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: DYNAMIC VARIANT DIMENSIONS (POS KASIR / SHOPEE STYLE) */}
              {editModalTab === 'dimensions' && (
                <div className="space-y-4 text-xs">
                  {/* Preset Template Quick Toolbar */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Template Cepat Atribut Varian:
                      </span>
                      <button
                        type="button"
                        onClick={handleAddDimensionGroup}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Dimensi Baru
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTemplate('clothing')}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:border-indigo-500 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        + Pakaian (Ukuran + Warna)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTemplate('shoes')}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:border-indigo-500 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        + Sepatu (EU Size + Warna)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTemplate('electronics')}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:border-indigo-500 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        + Elektronik (Kapasitas + Warna)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTemplate('clear')}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 rounded-xl font-bold hover:bg-rose-100 cursor-pointer"
                      >
                        Kosongkan Atribut
                      </button>
                    </div>
                  </div>

                  {/* List of Dynamic Dimension Groups */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {editDimensionGroups.map((group, groupIdx) => (
                      <div key={group.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-black flex items-center justify-center text-xs shrink-0">
                              {groupIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={group.name}
                              onChange={(e) => handleUpdateDimensionName(group.id, e.target.value)}
                              placeholder="Nama Dimensi (misal: Ukuran, Warna, Bahan, Rasa)..."
                              className="font-extrabold text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl w-full focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveDimensionGroup(group.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer shrink-0"
                            title="Hapus Dimensi Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Options Chip Input & Tags */}
                        <div className="space-y-2 pl-8">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={`Tambah opsi pilihan ${group.name} lalu tekan Enter...`}
                              value={group.newOptionInput || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditDimensionGroups(prev => prev.map(g => g.id === group.id ? { ...g, newOptionInput: val } : g));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddOptionToGroup(group.id);
                                }
                              }}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddOptionToGroup(group.id)}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer"
                            >
                              + Tambah
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {group.options.length === 0 ? (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                                Belum ada opsi dimasukkan. Ketik nilai di atas (misal: S, M, L) lalu tekan Tambah.
                              </span>
                            ) : (
                              group.options.map((opt) => (
                                <span
                                  key={opt}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold"
                                >
                                  {opt}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOptionFromGroup(group.id, opt)}
                                    className="hover:text-rose-600 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {editDimensionGroups.length === 0 && (
                      <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3">
                        <Tag className="w-8 h-8 text-slate-400 mx-auto" />
                        <div>
                          <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">Belum Ada Dimensi Variasi</p>
                          <p className="text-xs text-slate-400">Produk ini saat ini dianggap sebagai produk tunggal tanpa varian.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddDimensionGroup}
                          className="bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          + Tambah Dimensi Variasi
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Combination Calculation Footer Banner */}
                  <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs text-blue-900 dark:text-blue-200 font-semibold">
                        Kombinasi Otomatis: <strong className="font-mono text-blue-700 dark:text-blue-300">{editVariants.length} Varian</strong> akan dibuat & dapat diatur harganya pada Tab 3.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditModalTab('variants')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      Lanjut ke Atur Stok & Harga Varian ➔
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: VARIANT GRID & BULK STOCK EDITING (SHOPEE STYLE) */}
              {editModalTab === 'variants' && (
                <div className="space-y-4 text-xs">
                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Kombinasi Varian</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-base">{editVariants.length} Varian</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Stok Akumulasi</span>
                      <span className="font-mono font-black text-blue-600 text-base">
                        {editVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)} {formData.unit}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Nilai Potensi Jual</span>
                      <span className="font-mono font-black text-emerald-600 text-xs">
                        {formatIDR(editVariants.reduce((sum, v) => sum + ((Number(v.stock) || 0) * (Number(v.price) || 0)), 0))}
                      </span>
                    </div>
                  </div>

                  {/* Bulk Edit Bar (Shopee / Tokopedia Seller Style) */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 p-3.5 rounded-2xl border border-blue-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-xs">
                        <Zap className="w-4 h-4 text-blue-600" />
                        Ubah Massal ({selectedVariantKeys.length > 0 ? `${selectedVariantKeys.length} Varian Terpilih` : `Terapkan Ke Seluruh ${editVariants.length} Varian`})
                      </span>
                      <div className="flex items-center gap-1.5">
                        {selectedVariantKeys.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedVariantKeys([])}
                            className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-100 cursor-pointer"
                          >
                            Batal Pilih ({selectedVariantKeys.length})
                          </button>
                        )}
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleBulkAdjustStockDelta(10)}
                            className="bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg font-bold border hover:bg-blue-50 cursor-pointer"
                          >
                            +10 Stok
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkAdjustStockDelta(25)}
                            className="bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg font-bold border hover:bg-indigo-50 cursor-pointer"
                          >
                            +25 Stok
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkAdjustStockDelta(-10)}
                            className="bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg font-bold border hover:bg-rose-50 cursor-pointer"
                          >
                            -10 Stok
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {/* Bulk Cost Input */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-500 pl-1 shrink-0">Set HPP:</span>
                        <input
                          type="number"
                          placeholder="HPP Rp..."
                          value={bulkCostVal}
                          onChange={(e) => setBulkCostVal(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleBulkApplyCost}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded-lg text-xs shrink-0 cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>

                      {/* Bulk Price Input */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-500 pl-1 shrink-0">Set Harga:</span>
                        <input
                          type="number"
                          placeholder="Harga Rp..."
                          value={bulkPriceVal}
                          onChange={(e) => setBulkPriceVal(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleBulkApplyPrice}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg text-xs shrink-0 cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>

                      {/* Bulk Stock Input */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-500 pl-1 shrink-0">Set Stok:</span>
                        <input
                          type="number"
                          placeholder="Qty..."
                          value={bulkStockVal}
                          onChange={(e) => setBulkStockVal(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleBulkApplyStock}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded-lg text-xs shrink-0 cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>

                    {/* Combined Direct Bulk Edit Button */}
                    <div className="pt-2 border-t border-blue-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleBulkApplyAllDirect}
                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                        Terapkan HPP, Harga & Stok Sekaligus {selectedVariantKeys.length > 0 ? `(ke ${selectedVariantKeys.length} Varian Terpilih)` : (variantSearchQuery ? `(ke "${variantSearchQuery}")` : `(ke Semua Varian)`)}
                      </button>
                      <span className="text-[10px] text-slate-500 font-medium">
                        *Centang varian pada tabel di bawah untuk menerapkan HPP/Harga/Stok hanya ke varian terpilih.
                      </span>
                    </div>
                  </div>

                  {/* Variant Search Filter */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari varian spesifik (misal: S, Merah, L, XL)..."
                      value={variantSearchQuery}
                      onChange={(e) => setVariantSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                    />
                  </div>

                  {/* Variant Table Grid */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b">
                        <tr>
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={isAllVariantsSelected}
                              onChange={toggleSelectAllVariants}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                              title="Pilih / Batal Pilih Semua Varian"
                            />
                          </th>
                          <th className="p-3">Kombinasi Varian & SKU</th>
                          <th className="p-3 w-32">Harga HPP (Rp)</th>
                          <th className="p-3 w-32">Harga Jual (Rp)</th>
                          <th className="p-3 w-36">Stok Qty ({formData.unit})</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {editVariants
                          .filter(v => !variantSearchQuery || v.label.toLowerCase().includes(variantSearchQuery.toLowerCase()) || v.sku.toLowerCase().includes(variantSearchQuery.toLowerCase()))
                          .map((variant) => {
                            const realIdx = editVariants.findIndex(orig => orig.key === variant.key);
                            const isSelected = selectedVariantKeys.includes(variant.key);
                            return (
                              <tr key={variant.key} className={`transition-colors ${isSelected ? 'bg-blue-50/80 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectVariant(variant.key)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                  />
                                </td>
                                <td className="p-3">
                                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                    {variant.label}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[10px] text-slate-400">SKU Varian:</span>
                                    <input
                                      type="text"
                                      value={variant.sku}
                                      onChange={(e) => handleUpdateEditVariantRow(realIdx, 'sku', e.target.value)}
                                      className="font-mono text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border px-1.5 py-0.5 rounded w-36"
                                    />
                                  </div>
                                </td>

                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={variant.cost ?? 0}
                                    onChange={(e) => handleUpdateEditVariantRow(realIdx, 'cost', Number(e.target.value))}
                                    className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold text-indigo-600 text-xs"
                                  />
                                </td>

                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={variant.price}
                                    onChange={(e) => handleUpdateEditVariantRow(realIdx, 'price', Number(e.target.value))}
                                    className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold text-emerald-600 text-xs"
                                  />
                                </td>

                                <td className="p-3">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateEditVariantRow(realIdx, 'stock', Math.max(0, variant.stock - 1))}
                                      className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 font-bold rounded cursor-pointer"
                                    >
                                      -1
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={variant.stock}
                                      onChange={(e) => handleUpdateEditVariantRow(realIdx, 'stock', Math.max(0, Number(e.target.value)))}
                                      className="w-full p-1.5 text-center bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold text-slate-900 dark:text-white text-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateEditVariantRow(realIdx, 'stock', variant.stock + 1)}
                                      className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-600 font-bold rounded cursor-pointer"
                                    >
                                      +1
                                    </button>
                                  </div>
                                </td>

                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] ${
                                    variant.stock <= 0
                                      ? 'bg-rose-100 text-rose-700'
                                      : variant.stock <= formData.safetyStock
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {variant.stock <= 0 ? 'Out' : variant.stock <= formData.safetyStock ? 'Low' : 'Ready'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span>Akumulasi Stok: <strong className="text-slate-900 dark:text-white">{editVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)} {formData.unit}</strong></span>
                  <span>•</span>
                  <span>{editVariants.length} Varian</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-bold transition-all text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 text-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Simpan Produk Baru</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PRODUCT MODAL WITH ENHANCED VARIANT & STOCK MANAGEMENT */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    Edit Produk & Manajemen Stok Varian
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    SKU Induk: #{selectedProduct.sku} • {selectedProduct.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700">
                  {editVariants.length} Kombinasi Varian
                </span>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Edit Modal Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setEditModalTab('basic')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  editModalTab === 'basic'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>1. Informasi Utama Produk</span>
              </button>

              <button
                type="button"
                onClick={() => setEditModalTab('attributes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  editModalTab === 'attributes'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>2. Dimensi Varian ({editSizes.length} Ukuran, {editColors.length} Warna)</span>
              </button>

              <button
                type="button"
                onClick={() => setEditModalTab('variants')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  editModalTab === 'variants'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>3. Edit Stok & Harga Varian ({editVariants.length})</span>
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              {/* TAB 1: BASIC INFORMATION */}
              {editModalTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Kode SKU *</label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Nama Produk *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* SKU Induk Input */}
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        SKU Induk (Parent SKU) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.parentSku || ''}
                        onChange={(e) => setFormData({ ...formData, parentSku: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                        placeholder="Contoh: SKU-PARENT-01"
                      />
                    </div>

                    {/* Warehouse Selector with Manual Option */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">
                          Gudang Penyimpanan Utama
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomWarehouseInput(!isCustomWarehouseInput);
                            setNewWarehouseInputValue('');
                          }}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 cursor-pointer"
                        >
                          {isCustomWarehouseInput ? '← Pilih dari List' : '+ Tambah Gudang Baru'}
                        </button>
                      </div>

                      {isCustomWarehouseInput ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Ketik nama gudang baru..."
                            value={newWarehouseInputValue}
                            onChange={(e) => {
                              setNewWarehouseInputValue(e.target.value);
                              setFormData({ ...formData, warehouse: e.target.value });
                            }}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newWarehouseInputValue.trim()) {
                                const val = newWarehouseInputValue.trim();
                                addCustomWarehouse(val);
                                setFormData({ ...formData, warehouse: val });
                                setIsCustomWarehouseInput(false);
                              }
                            }}
                            className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shrink-0 hover:bg-indigo-700 cursor-pointer"
                          >
                            Simpan
                          </button>
                        </div>
                      ) : (
                        <select
                          value={formData.warehouse}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomWarehouseInput(true);
                              setNewWarehouseInputValue('');
                            } else {
                              setFormData({ ...formData, warehouse: e.target.value });
                            }
                          }}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        >
                          {availableWarehouses.map(wh => (
                            <option key={wh} value={wh}>{wh}</option>
                          ))}
                          <option value="__ADD_NEW__" className="text-indigo-600 font-bold">+ Tambah Gudang Baru Manual...</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Safety Stock (Batas Alert)</label>
                      <input
                        type="number"
                        value={formData.safetyStock}
                        onChange={(e) => setFormData({ ...formData, safetyStock: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Batas Minimal Stok</label>
                      <input
                        type="number"
                        value={formData.minimumStock}
                        onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Satuan Unit</label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Box">Box</option>
                        <option value="Kg">Kg</option>
                        <option value="Set">Set</option>
                      </select>
                    </div>
                  </div>

                  {/* Stock Calculation Helper Banner */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs text-blue-900 dark:text-blue-200 font-semibold">
                        Total stok produk akan otomatis dihitung dari penjumlahan seluruh kuantitas varian pada Tab 3.
                      </span>
                    </div>
                    <span className="font-mono font-black text-sm text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border">
                      {editVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)} {formData.unit}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: VARIANT ATTRIBUTES & DYNAMIC DIMENSIONS (POS Kasir / Shopee style) */}
              {editModalTab === 'attributes' && (
                <div className="space-y-5">
                  {/* Top Notice & Quick Action Bar */}
                  <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-indigo-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        Atur dimensi variasi produk secara fleksibel (seperti form POS Kasir). Anda dapat menambah atribut kustom (seperti Ukuran, Warna, Bahan, Kapasitas, Rasa) dan mengetik opsi secara manual.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleAddDimensionGroup}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Tambah Dimensi Variasi
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalTab('variants')}
                        className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        Lihat Tabel Varian ➔
                      </button>
                    </div>
                  </div>

                  {/* Preset Template Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                    <span className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" /> Preset Dimensi Cepat:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTemplate('clothing')}
                        className="bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900/50 transition-colors cursor-pointer"
                      >
                        + Pakaian (Ukuran & Warna)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTemplate('shoes')}
                        className="bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/50 transition-colors cursor-pointer"
                      >
                        + Sepatu (EU & Warna)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTemplate('electronics')}
                        className="bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50 transition-colors cursor-pointer"
                      >
                        + Elektronik (Kapasitas & Warna)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTemplate('clear')}
                        className="bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-rose-500 font-bold px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Dimension Groups Cards */}
                  <div className="space-y-4">
                    {editDimensionGroups.map((group, gIdx) => (
                      <div
                        key={group.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xs relative"
                      >
                        {/* Group Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0">
                              {gIdx + 1}
                            </span>
                            <div className="flex-1 space-y-1">
                              <label className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">
                                Nama Atribut Variasi
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="misal: Ukuran, Warna, Bahan, Kapasitas..."
                                  value={group.name}
                                  onChange={(e) => handleUpdateDimensionName(group.id, e.target.value)}
                                  className="w-full max-w-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                                {/* Quick Name Chips */}
                                <div className="hidden sm:flex items-center gap-1 text-[10px]">
                                  {['Ukuran', 'Warna', 'Kapasitas', 'Bahan'].map((presetName) => (
                                    <button
                                      key={presetName}
                                      type="button"
                                      onClick={() => handleUpdateDimensionName(group.id, presetName)}
                                      className={`px-2 py-0.5 rounded-md border text-[9px] font-bold transition-all cursor-pointer ${
                                        group.name === presetName
                                          ? 'bg-indigo-600 text-white border-indigo-600'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                                      }`}
                                    >
                                      {presetName}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900">
                              {group.options.length} Opsi
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDimensionGroup(group.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                              title="Hapus atribut ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Option Tag Chips Display */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider flex items-center justify-between">
                            <span>Daftar Opsi Variasi ({group.name || 'Atribut'})</span>
                            <span className="text-[9px] font-normal text-slate-400">Tekan Enter atau klik Tambah untuk memasukkan opsi</span>
                          </label>

                          <div className="flex flex-wrap items-center gap-2 min-h-[36px] p-2 bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-850 rounded-xl">
                            {group.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 text-indigo-950 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800 text-xs font-bold px-3 py-1 rounded-xl shadow-2xs"
                              >
                                {opt}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionFromGroup(group.id, opt)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}

                            {group.options.length === 0 && (
                              <span className="text-xs text-slate-400 italic px-1">
                                Belum ada opsi variasi. Ketik di kolom bawah untuk menambah...
                              </span>
                            )}
                          </div>

                          {/* Add Option Input Row */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              placeholder={`Ketik opsi ${group.name || 'variasi'} lalu tekan Enter (contoh: S, Merah, 128GB)...`}
                              value={group.newOptionInput || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditDimensionGroups(prev => prev.map(g => g.id === group.id ? { ...g, newOptionInput: val } : g));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddOptionToGroup(group.id);
                                }
                              }}
                              className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddOptionToGroup(group.id)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            >
                              + Tambah Opsi
                            </button>
                          </div>

                          {/* Quick Option Suggestions for specific groups */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-400 font-bold">Preset Cepat Opsi:</span>
                            {/ukuran|size/i.test(group.name) && (
                              ['S', 'M', 'L', 'XL', '2XL', '3XL'].map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleAddOptionToGroup(group.id, opt)}
                                  className="text-[10px] bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                  + {opt}
                                </button>
                              ))
                            )}
                            {/warna|color/i.test(group.name) && (
                              ['Hitam', 'Putih', 'Merah', 'Navy', 'Hijau', 'Abu-Abu'].map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleAddOptionToGroup(group.id, opt)}
                                  className="text-[10px] bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                  + {opt}
                                </button>
                              ))
                            )}
                            {/lengan|sleeve/i.test(group.name) && (
                              ['Pendek', 'Panjang', '3/4'].map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleAddOptionToGroup(group.id, opt)}
                                  className="text-[10px] bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                  + {opt}
                                </button>
                              ))
                            )}
                            {/desain|design|model/i.test(group.name) && (
                              ['Polos', 'Batik', 'Motif', 'Graphic'].map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleAddOptionToGroup(group.id, opt)}
                                  className="text-[10px] bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                  + {opt}
                                </button>
                              ))
                            )}
                            {/kapasitas|memory|ram/i.test(group.name) && (
                              ['64GB', '128GB', '256GB', '512GB', '1TB'].map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleAddOptionToGroup(group.id, opt)}
                                  className="text-[10px] bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                  + {opt}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {editDimensionGroups.length === 0 && (
                      <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3">
                        <Tag className="w-8 h-8 text-slate-400 mx-auto" />
                        <div>
                          <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">Belum Ada Dimensi Variasi</p>
                          <p className="text-xs text-slate-400">Produk ini saat ini dianggap sebagai produk tunggal tanpa varian.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddDimensionGroup}
                          className="bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          + Tambah Dimensi Variasi
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Combination Calculation Footer Banner */}
                  <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs text-blue-900 dark:text-blue-200 font-semibold">
                        Kombinasi Otomatis: <strong className="font-mono text-blue-700 dark:text-blue-300">{editVariants.length} Varian</strong> akan dibuat & dapat diedit harganya pada Tab 3.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditModalTab('variants')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      Lanjut ke Edit Stok & Harga Varian ➔
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: VARIANT GRID & BULK STOCK EDITING (SHOPEE STYLE) */}
              {editModalTab === 'variants' && (
                <div className="space-y-4">
                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Kombinasi Varian</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-base">{editVariants.length} Varian</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Stok Akumulasi</span>
                      <span className="font-mono font-black text-blue-600 text-base">
                        {editVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)} {formData.unit}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Nilai Potensi Jual</span>
                      <span className="font-mono font-black text-emerald-600 text-xs">
                        {formatIDR(editVariants.reduce((sum, v) => sum + ((Number(v.stock) || 0) * (Number(v.price) || 0)), 0))}
                      </span>
                    </div>
                  </div>

                  {/* Bulk Edit Bar (Shopee / Tokopedia Seller Style) */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 p-3.5 rounded-2xl border border-blue-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-xs">
                        <Zap className="w-4 h-4 text-blue-600" />
                        Ubah Massal ({selectedVariantKeys.length > 0 ? `${selectedVariantKeys.length} Varian Terpilih` : `Terapkan Ke Seluruh ${editVariants.length} Varian`})
                      </span>
                      <div className="flex items-center gap-1.5">
                        {selectedVariantKeys.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedVariantKeys([])}
                            className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-100 cursor-pointer"
                          >
                            Batal Pilih ({selectedVariantKeys.length})
                          </button>
                        )}
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleBulkAdjustStockDelta(10)}
                            className="bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg font-bold border hover:bg-blue-50 cursor-pointer"
                          >
                            +10 Stok
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkAdjustStockDelta(25)}
                            className="bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg font-bold border hover:bg-indigo-50 cursor-pointer"
                          >
                            +25 Stok
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkAdjustStockDelta(-10)}
                            className="bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg font-bold border hover:bg-rose-50 cursor-pointer"
                          >
                            -10 Stok
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {/* Bulk Cost Input */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-500 pl-1 shrink-0">Set HPP:</span>
                        <input
                          type="number"
                          placeholder="HPP Rp..."
                          value={bulkCostVal}
                          onChange={(e) => setBulkCostVal(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleBulkApplyCost}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded-lg text-xs shrink-0 cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>

                      {/* Bulk Price Input */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-500 pl-1 shrink-0">Set Harga:</span>
                        <input
                          type="number"
                          placeholder="Harga Rp..."
                          value={bulkPriceVal}
                          onChange={(e) => setBulkPriceVal(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleBulkApplyPrice}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg text-xs shrink-0 cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>

                      {/* Bulk Stock Input */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-500 pl-1 shrink-0">Set Stok:</span>
                        <input
                          type="number"
                          placeholder="Qty..."
                          value={bulkStockVal}
                          onChange={(e) => setBulkStockVal(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleBulkApplyStock}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded-lg text-xs shrink-0 cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>

                    {/* Combined Direct Bulk Edit Button */}
                    <div className="pt-2 border-t border-blue-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleBulkApplyAllDirect}
                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                        Terapkan HPP, Harga & Stok Sekaligus {selectedVariantKeys.length > 0 ? `(ke ${selectedVariantKeys.length} Varian Terpilih)` : (variantSearchQuery ? `(ke "${variantSearchQuery}")` : `(ke Semua Varian)`)}
                      </button>
                      <span className="text-[10px] text-slate-500 font-medium">
                        *Centang varian pada tabel di bawah untuk menerapkan HPP/Harga/Stok hanya ke varian terpilih.
                      </span>
                    </div>
                  </div>

                  {/* Variant Search Filter */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari varian spesifik (misal: S, Merah, L, XL)..."
                      value={variantSearchQuery}
                      onChange={(e) => setVariantSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                    />
                  </div>

                  {/* Variant Table Grid */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b">
                        <tr>
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={isAllVariantsSelected}
                              onChange={toggleSelectAllVariants}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                              title="Pilih / Batal Pilih Semua Varian"
                            />
                          </th>
                          <th className="p-3">Kombinasi Varian & SKU</th>
                          <th className="p-3 w-32">Harga HPP (Rp)</th>
                          <th className="p-3 w-32">Harga Jual (Rp)</th>
                          <th className="p-3 w-36">Stok Qty ({formData.unit})</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {editVariants
                          .filter(v => !variantSearchQuery || v.label.toLowerCase().includes(variantSearchQuery.toLowerCase()) || v.sku.toLowerCase().includes(variantSearchQuery.toLowerCase()))
                          .map((variant) => {
                            const realIdx = editVariants.findIndex(orig => orig.key === variant.key);
                            const isSelected = selectedVariantKeys.includes(variant.key);
                            return (
                              <tr key={variant.key} className={`transition-colors ${isSelected ? 'bg-blue-50/80 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectVariant(variant.key)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                  />
                                </td>
                                <td className="p-3">
                                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                    {variant.label}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[10px] text-slate-400">SKU Varian:</span>
                                    <input
                                      type="text"
                                      value={variant.sku}
                                      onChange={(e) => handleUpdateEditVariantRow(realIdx, 'sku', e.target.value)}
                                      className="font-mono text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border px-1.5 py-0.5 rounded w-36"
                                    />
                                  </div>
                                </td>

                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={variant.cost ?? 0}
                                    onChange={(e) => handleUpdateEditVariantRow(realIdx, 'cost', Number(e.target.value))}
                                    className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold text-indigo-600 text-xs"
                                  />
                                </td>

                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={variant.price}
                                    onChange={(e) => handleUpdateEditVariantRow(realIdx, 'price', Number(e.target.value))}
                                    className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold text-emerald-600 text-xs"
                                  />
                                </td>

                                <td className="p-3">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateEditVariantRow(realIdx, 'stock', Math.max(0, variant.stock - 1))}
                                      className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 font-bold rounded"
                                    >
                                      -1
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={variant.stock}
                                      onChange={(e) => handleUpdateEditVariantRow(realIdx, 'stock', Math.max(0, Number(e.target.value)))}
                                      className="w-full p-1.5 text-center bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold text-slate-900 dark:text-white text-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateEditVariantRow(realIdx, 'stock', variant.stock + 1)}
                                      className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-600 font-bold rounded"
                                    >
                                      +1
                                    </button>
                                  </div>
                                </td>

                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] ${
                                    variant.stock <= 0
                                      ? 'bg-rose-100 text-rose-700'
                                      : variant.stock <= formData.safetyStock
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {variant.stock <= 0 ? 'Out' : variant.stock <= formData.safetyStock ? 'Low' : 'Ready'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span>Akumulasi Stok: <strong className="text-slate-900 dark:text-white">{editVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)} {formData.unit}</strong></span>
                  <span>•</span>
                  <span>{editVariants.length} Varian</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-bold transition-all text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 text-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan & Sync Stok</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADJUST STOCK MODAL */}
      <AdjustStockModal
        isOpen={showAdjustStockModal}
        selectedProduct={selectedProduct}
        onClose={() => setShowAdjustStockModal(false)}
        onSubmit={handleSaveStockAdjustment}
        stockAdjustment={stockAdjustment}
        setStockAdjustment={setStockAdjustment}
      />

      {/* MODAL 4: DETAIL & BARCODE PREVIEW MODAL */}
      <ProductDetailModal
        isOpen={showDetailModal}
        selectedProduct={selectedProduct}
        onClose={() => setShowDetailModal(false)}
        formatIDR={formatIDR}
        getProductCombos={getProductCombos}
        copiedSku={copiedSku}
        onCopySku={handleCopySku}
      />

      {/* MODAL 5: DOWNLOAD TEMPLATE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                Download Template Impor Katalog Produk
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Pilih format file template di bawah ini. Template sudah diformat dengan header kolom resmi untuk pengunggahan masal katalog produk dan varian stok.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  handleDownloadTemplate('xlsx');
                  setShowTemplateModal(false);
                }}
                className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-center space-y-2 transition-all"
              >
                <FileText className="w-8 h-8 text-emerald-600 mx-auto" />
                <span className="font-bold text-xs block">Format Excel (.XLSX)</span>
                <span className="text-[10px] text-emerald-600 block">Rekomendasi untuk Microsoft Excel</span>
              </button>

              <button
                onClick={() => {
                  handleDownloadTemplate('csv');
                  setShowTemplateModal(false);
                }}
                className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-center space-y-2 transition-all"
              >
                <FileText className="w-8 h-8 text-blue-600 mx-auto" />
                <span className="font-bold text-xs block">Format Comma CSV (.CSV)</span>
                <span className="text-[10px] text-blue-600 block">Untuk Google Sheets / CSV UTF-8</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Kolom Wajib Isi:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><code>Kode SKU Induk</code> & <code>Nama Produk</code></li>
                <li><code>Harga Jual (Rp)</code> & <code>Harga HPP (Rp)</code></li>
                <li><code>Stok Variasi (Pcs)</code> & <code>Gudang Penyimpanan</code></li>
              </ul>
            </div>

            <div className="flex items-center justify-end border-t pt-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: IMPORT EXCEL / CSV MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Import Katalog & Stok Varian (.xlsx / .csv)
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Unggah file data produk berformat Excel (.xlsx) atau CSV. Sistem akan otomatis mendeteksi nama produk, SKU, varian, harga jual, HPP, dan jumlah stok.
            </p>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
                id="katalog-file-upload"
              />
              <label
                htmlFor="katalog-file-upload"
                className="cursor-pointer inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Upload className="w-4 h-4" /> Pilih File XLSX / CSV
              </label>
              <p className="text-[11px] text-slate-400">Atau seret file ke area ini</p>
            </div>

            {importStatus && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <button
                type="button"
                onClick={() => handleDownloadTemplate('xlsx')}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Template File
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: DELETE INDIVIDUAL PRODUCT CONFIRMATION */}
      {showDeleteConfirmModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Hapus Produk #{selectedProduct.sku}?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Apakah Anda yakin ingin menghapus produk <strong>"{selectedProduct.name}"</strong>? Seluruh data stok varian terkait akan dihapus secara permanen.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus Produk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: DELETE ALL CONFIRMATION MODAL */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Hapus Seluruh Katalog Produk?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Tindakan ini akan menghapus <strong>{products.length} SKU produk</strong> beserta seluruh stok dan variasi ukuran/warna yang tersimpan di sistem.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isClearing}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={async () => {
                  setIsClearing(true);
                  try {
                    await clearProducts();
                  } finally {
                    setIsClearing(false);
                    setShowDeleteAllModal(false);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE INDIVIDUAL STOCK MOVEMENT LOG */}
      {deleteMovementConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Hapus Log Pergerakan Stok?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Apakah Anda yakin ingin menghapus log mutasi <strong className="font-mono text-slate-900 dark:text-white">[{deleteMovementConfirmModal.referenceNumber || 'Log Stok'}]</strong> (<span className="font-semibold">{deleteMovementConfirmModal.productName}</span>)?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setDeleteMovementConfirmModal(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteStockMovement(deleteMovementConfirmModal.id);
                  setDeleteMovementConfirmModal(null);
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE ALL STOCK MOVEMENT LOGS */}
      {deleteAllMovementsConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Hapus SEMUA Log Pergerakan Stok?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong>seluruh riwayat log pergerakan stok</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setDeleteAllMovementsConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearAllStockMovements();
                  setDeleteAllMovementsConfirmModal(false);
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Ya, Hapus Semua Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8.5: SEED JERJHON CSV CONFIRMATION */}
      <SeedCSVModal
        isOpen={showSeedCSVModal}
        onClose={() => setShowSeedCSVModal(false)}
        onConfirm={handleSeedJerjhonCSV}
        importing={importing}
        importStatus={importStatus}
      />

      {/* MODAL 9: KELOLA KATEGORI & GUDANG MASTER MODAL */}
      <CategoryWarehouseManagerModal
        isOpen={showCategoryWarehouseManager}
        onClose={() => setShowCategoryWarehouseManager(false)}
        availableCategories={availableCategories}
        availableWarehouses={availableWarehouses}
        products={products}
        addCustomCategory={addCustomCategory}
        deleteCategory={deleteCategory}
        addCustomWarehouse={addCustomWarehouse}
        deleteWarehouse={deleteWarehouse}
      />

      {/* GLOBAL INVENTORY TOAST NOTIFICATION */}
      <InventoryToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
