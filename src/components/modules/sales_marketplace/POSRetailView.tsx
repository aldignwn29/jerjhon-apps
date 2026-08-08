import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  ShoppingBag, Search, Plus, Minus, Trash2, Printer, List, 
  CheckCircle2, QrCode, Banknote, CreditCard, DollarSign, ArrowLeft, 
  Sparkles, Tag, Check, Calendar, Info, Bell, MessageSquare, 
  HelpCircle, Trash, RefreshCcw, Wifi, HardDrive, ToggleLeft, 
  ToggleRight, Image, PlusCircle, Settings, X, Edit, Sliders,
  Upload, Download, ChevronDown, ChevronUp, Package, Layers, Zap, AlertCircle,
  Lock, Play, Building2
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RoleAccessBanner } from '../../common/RoleAccessBanner';
import { POSCartItem } from '../../../types';
import { JERJHON_CSV_DATA } from '../../../data/csvSeedData';
import { calculateVariantPrice, getGlobalVariantKey } from '../../../utils/priceSync';
import SyncDiagnosticsDashboard from './SyncDiagnosticsDashboard';
import { useHardwareMonitor } from '../../../hooks/useHardwareMonitor';

const parseJerjhonCsvData = () => {
  const rowsList: Array<{
    pSku: string;
    pName: string;
    varCode: string;
    skuVariasi: string;
    model: string;
    size: string;
    price: number;
    stock: number;
  }> = [];

  const lines = JERJHON_CSV_DATA.split('\n');
  if (lines.length < 2) return rowsList;

  const rows = lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.split(';'));

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const prodCodeIdx = headers.indexOf('kode produk');
  const nameIdx = headers.indexOf('nama produk');
  const varCodeIdx = headers.indexOf('kode variasi');
  const varSkuIdx = headers.findIndex(h => h === 'sku variasi' || h === 'nama variasi');
  const priceIdx = headers.findIndex(h => h === 'harga' || h === 'harga jual');
  const stockIdx = headers.indexOf('stok');

  const sizeRegex = /^(s|m|l|xl|xxl|2xl|3xl|4xl|5xl|xs|xs - s|m - l|xl - xxl|all size|standard|[0-9]+(ml|g|kg|cm|mm)?)$/i;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const pSku = prodCodeIdx !== -1 && row[prodCodeIdx] ? row[prodCodeIdx].trim() : '';
    const pName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : '';
    if (!pSku && !pName) continue;

    const varCode = varCodeIdx !== -1 && row[varCodeIdx] ? row[varCodeIdx].trim() : '';
    const skuVariasi = varSkuIdx !== -1 && row[varSkuIdx] ? row[varSkuIdx].trim() : '';

    const price = priceIdx !== -1 && row[priceIdx] ? parseFloat(row[priceIdx].replace(/[^0-9]/g, '')) || 175000 : 175000;
    const stock = stockIdx !== -1 && row[stockIdx] ? parseInt(row[stockIdx].replace(/[^0-9]/g, ''), 10) || 0 : 0;

    let model = '-';
    let size = '-';

    if (skuVariasi) {
      const parts = skuVariasi.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        if (sizeRegex.test(parts[1])) {
          model = parts[0];
          size = parts[1];
        } else if (sizeRegex.test(parts[0])) {
          size = parts[0];
          model = parts[1];
        } else {
          model = parts[0];
          size = parts[1];
        }
      } else if (parts.length === 1) {
        if (sizeRegex.test(parts[0])) {
          size = parts[0];
          model = 'Model Standard';
        } else {
          model = parts[0];
          size = 'ALL SIZE';
        }
      }
    }

    rowsList.push({
      pSku,
      pName,
      varCode,
      skuVariasi,
      model: model !== '-' ? model : 'Model Standard',
      size: size !== '-' ? size : 'Standard',
      price,
      stock
    });
  }

  return rowsList;
};

const parsedJerjhonCsvRows = parseJerjhonCsvData();

interface ExtendedPOSCartItem extends POSCartItem {
  size: string;
  color: string;
  cartId: string;
}

interface PromoCode {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  description: string;
}

export const POSRetailView: React.FC = () => {
  const {
    currentUser,
    products,
    addMarketplaceOrder,
    marketplaceOrders,
    updateMarketplaceOrder,
    deleteMarketplaceOrder,
    formatIDR,
    addProduct,
    deleteProduct,
    updateProduct,
    updateProductStock,
    sizeOptions,
    setSizeOptions,
    colorOptions,
    setColorOptions,
    sleeveOptions,
    setSleeveOptions,
    designOptions,
    setDesignOptions,
    sizeExtraPrices,
    setSizeExtraPrices,
    colorExtraPrices,
    setColorExtraPrices,
    sleeveExtraPrices,
    setSleeveExtraPrices,
    designExtraPrices,
    setDesignExtraPrices,
    variantPrices,
    setVariantPrices,
    variantStocks,
    setVariantStocks,
    variantCosts,
    setVariantCosts,
    variantSKUs,
    setVariantSKUs,
    customVariantNames,
    setCustomVariantNames,
    setActiveTab: setGlobalActiveTab
  } = useERP();
  
  // Tab Navigation (POS Terminal vs. Settings & Connections Deck)
  const [activeTab, setActiveTab] = useState<'terminal' | 'management' | 'reports'>('terminal');

  // Dynamic Product State (allowing newly added ones to populate real-time)
  const [localProducts, setLocalProducts] = useState<any[]>([]);

  // Dynamic Categories State (allowing deletions and custom additions)
  const [categories, setCategories] = useState<string[]>([
    'Jersey', 'Activewear', 'Skirt', 'Accessories'
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Products');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Dynamic Promos State
  const [promos, setPromos] = useState<PromoCode[]>([
    { code: 'KMZ-WAY-87AA', type: 'flat', value: 24530, description: 'Diskon Flat Rp 24.530' },
    { code: 'JERJHON-SUPER', type: 'percentage', value: 15, description: 'Diskon Mega 15% All Items' },
    { code: 'SPORT-BEST', type: 'flat', value: 50000, description: 'Potongan Khusus Sportwear Rp 50.000' }
  ]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoType, setNewPromoType] = useState<'percentage' | 'flat'>('flat');
  const [newPromoValue, setNewPromoValue] = useState<number>(10000);
  const [newPromoDesc, setNewPromoDesc] = useState('');

  // Product Creator Form States (3-Tab System matching Katalog Produk)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editModalTab, setEditModalTab] = useState<'basic' | 'dimensions' | 'variants'>('basic');
  const [prodSku, setProdSku] = useState<string>('');
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(125000);
  const [prodUnitCostPrice, setProdUnitCostPrice] = useState<number>(75000);
  const [prodStock, setProdStock] = useState<number>(150);
  const [prodCategory, setProdCategory] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('Gudang BUDP');
  const [prodWarehouse, setProdWarehouse] = useState<string>('Gudang BUDP');
  const [prodSafetyStock, setProdSafetyStock] = useState<number>(10);
  const [prodMinimumStock, setProdMinimumStock] = useState<number>(5);
  const [prodUnit, setProdUnit] = useState<'Pcs' | 'Box' | 'Kg' | 'Set' | 'Meter' | 'Roll' | 'Pasang' | 'Botol' | 'Unit'>('Pcs');
  const [formError, setFormError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState<boolean>(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [prodPhoto, setProdPhoto] = useState<string>(''); // Base64 or preset
  const [prodPhotoPreset, setProdPhotoPreset] = useState<string>('PROD-101');

  // Custom Category & Warehouse States
  const [isCustomCategoryInput, setIsCustomCategoryInput] = useState<boolean>(false);
  const [newCategoryInputValue, setNewCategoryInputValue] = useState<string>('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isCustomWarehouseInput, setIsCustomWarehouseInput] = useState<boolean>(false);
  const [newWarehouseInputValue, setNewWarehouseInputValue] = useState<string>('');
  const [customWarehouses, setCustomWarehouses] = useState<string[]>([]);

  // Tab 2: Dimension Groups State
  const [editDimensionGroups, setEditDimensionGroups] = useState<{id: string; name: string; options: string[]; newOptionInput?: string;}[]>([]);

  // Tab 3: Variant Grid & Bulk Edit State
  const [editVariants, setEditVariants] = useState<{key: string; globalKey: string; size: string; color: string; sleeve: string; design: string; label: string; sku: string; cost: number; price: number; stock: number;}[]>([]);
  const [selectedVariantKeys, setSelectedVariantKeys] = useState<string[]>([]);
  const [bulkCostVal, setBulkCostVal] = useState<string | number>('');
  const [bulkPriceVal, setBulkPriceVal] = useState<string | number>('');
  const [bulkStockVal, setBulkStockVal] = useState<string | number>('');
  const [variantSearchQuery, setVariantSearchQuery] = useState<string>('');

  // Legacy fallback states
  const [builderVariants, setBuilderVariants] = useState<{name: string, options: string[]}[]>([]);
  const [modalComboPrices, setModalComboPrices] = useState<Record<string, number>>({});
  const [modalComboStocks, setModalComboStocks] = useState<Record<string, number>>({});
  const [selectedPosComboKeys, setSelectedPosComboKeys] = useState<string[]>([]);

  // Connection Configurations (Simulated Hardware Integration)
  const [printerConnected, setPrinterConnected] = useState(true);
  const [printerType, setPrinterType] = useState<'USB' | 'Bluetooth' | 'WiFi'>('USB');
  const [printerPaperSize, setPrinterPaperSize] = useState<'80mm' | '58mm' | '112mm'>('80mm');
  const [printerAutoPrint, setPrinterAutoPrint] = useState(true);
  const [printerTestStatus, setPrinterTestStatus] = useState('');
  const [printerModelName, setPrinterModelName] = useState<string>('Universal ESC/POS (Semua Merek / All Models)');
  const [printerCommandProtocol, setPrinterCommandProtocol] = useState<'ESC/POS' | 'CPCL' | 'StarPRNT' | 'TSPL' | 'Raw Hex Stream'>('ESC/POS');

  const [scannerConnected, setScannerConnected] = useState(true);
  const [scannerType, setScannerType] = useState<'USB' | 'Bluetooth' | 'Camera'>('Camera');
  const [scannerBeepVolume, setScannerBeepVolume] = useState<'high' | 'low' | 'off'>('high');
  const [scanTestInput, setScanTestInput] = useState('');
  const [scanTestResult, setScanTestResult] = useState('');

  // Hardware Notification Toast State & Device Detection Handlers
  const hardwareMonitor = useHardwareMonitor();
  const [hardwareToast, setHardwareToast] = useState<{ title: string; desc: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showHardwareToast = (title: string, desc: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setHardwareToast({ title, desc, type });
    setTimeout(() => {
      setHardwareToast(null);
    }, 4500);
  };

  const handleTogglePrinter = (connect: boolean) => {
    setPrinterConnected(connect);
    if (connect) {
      const deviceName = printerType === 'USB' 
        ? 'USB Thermal Printer (Epson TM-T82 / XP-58IIH)' 
        : printerType === 'Bluetooth' 
          ? 'Bluetooth Thermal Printer (Goojprt PT-210 / RPP02)' 
          : 'Network Thermal Printer (IP: 192.168.1.150 - EPSON LAN)';
      showHardwareToast("Perangkat Printer Terdeteksi!", `Perangkat terhubung via ${printerType}: ${deviceName}`, "success");
    } else {
      showHardwareToast("Printer Thermal Terputus", "Koneksi perangkat printer kasir terputus dari sistem.", "warning");
    }
  };

  const handleToggleScanner = (connect: boolean) => {
    setScannerConnected(connect);
    if (connect) {
      const deviceName = scannerType === 'USB' 
        ? 'USB Laser Barcode Scanner (Honeywell Voyager 1200g)' 
        : scannerType === 'Bluetooth' 
          ? 'Bluetooth Wireless Barcode Reader (Symbol LS2208 BT)' 
          : 'Built-in Camera Barcode Scanner (Android/iOS Optical Camera)';
      showHardwareToast("Perangkat Barcode Scanner Terdeteksi!", `Perangkat terhubung via ${scannerType}: ${deviceName}`, "success");
    } else {
      showHardwareToast("Barcode Scanner Terputus", "Koneksi perangkat scanner terputus dari sistem.", "warning");
    }
  };

  const runPrinterCalibrationWithCheck = () => {
    if (!printerConnected) {
      showHardwareToast("Aksi Ditolak", "Printer Thermal belum terhubung! Uji kalibrasi & cetak test page tidak dapat dilakukan jika perangkat tidak terhubung.", "warning");
      return;
    }
    runPrinterCalibration();
  };

  const handleTestBarcodeScanWithCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerConnected) {
      showHardwareToast("Aksi Ditolak", "Barcode Scanner belum terhubung! Simulasi scan tidak dapat dilakukan jika perangkat tidak terhubung.", "warning");
      return;
    }
    handleTestBarcodeScan(e);
  };

  const handleScanBarcodeWithCheck = () => {
    if (!scannerConnected) {
      showHardwareToast("Aksi Ditolak", "Barcode Scanner belum terhubung! Pemindaian kamera tidak dapat dijalankan.", "warning");
      return;
    }
    handleScanBarcode();
  };

  // Additional Hardware & Management States
  const [cashDrawerConnected, setCashDrawerConnected] = useState(true);
  const [cashDrawerTestStatus, setCashDrawerTestStatus] = useState('');
  const runCashDrawerTest = () => {
    setCashDrawerTestStatus('Mengirim sinyal ESC/POS Kick Drawer (0x1B, 0x70)...');
    setTimeout(() => {
      setCashDrawerTestStatus('✅ Laci Kasir Berhasil Terbuka! (Hardware Kick Sinyal OK)');
    }, 1200);
  };

  const [edcConnected, setEdcConnected] = useState(true);
  const [edcProvider, setEdcProvider] = useState<'BCA' | 'Mandiri' | 'QRIS' | 'EDC Android'>('BCA');
  const [edcTerminalId, setEdcTerminalId] = useState('EDC-BCNET-8890');
  const [edcTestStatus, setEdcTestStatus] = useState('');
  const runEdcTest = () => {
    setEdcTestStatus(`Menghubungkan ke Gateway ${edcProvider} (${edcTerminalId})...`);
    setTimeout(() => {
      setEdcTestStatus(`✅ Koneksi EDC & QRIS ${edcProvider} Stabil! Response Time: 42ms`);
    }, 1200);
  };

  const [receiptStoreTitle, setReceiptStoreTitle] = useState('JERJHON ENTERPRISE POS');
  const [receiptStoreAddress, setReceiptStoreAddress] = useState('Jl. Raya Sport & Activewear No. 88, Cikarang');
  const [receiptFooterMessage, setReceiptFooterMessage] = useState('Terima kasih atas kunjungan Anda! Barang yang sudah dibeli tidak dapat ditukar.');

  const [shiftActive, setShiftActive] = useState(true);
  const [shiftStartingCash, setShiftStartingCash] = useState(500000);
  const [shiftTotalSales, setShiftTotalSales] = useState(0);
  const [shiftCashierName, setShiftCashierName] = useState('Jhony (Supervisor)');
  const [showCloseShiftConfirm, setShowCloseShiftConfirm] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setShiftCashierName(`${currentUser.name} (${currentUser.role || 'Kasir'})`);
    } else {
      setShiftCashierName('Jhony (Supervisor)');
    }
  }, [currentUser]);

  // POS Operational States
  const [cart, setCart] = useState<ExtendedPOSCartItem[]>([]);
  const [mobileViewTab, setMobileViewTab] = useState<'catalog' | 'cart'>('catalog');
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS'>('Cash');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [receiptModal, setReceiptModal] = useState<any>(null);
  
  // Discount Application
  const [discountCode, setDiscountCode] = useState('KMZ-WAY-87AA');
  const [isDiscountApplied, setIsDiscountApplied] = useState(true);
  const [discountValue, setDiscountValue] = useState(24530); // flat Rp 24,530 to match screenshot

  // Scanner Simulator UI Modal
  const [scannerActive, setScannerActive] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  
  // Barcode Tools Modals
  const [showBarcodeListModal, setShowBarcodeListModal] = useState(false);
  const [showBarcodePrintModal, setShowBarcodePrintModal] = useState(false);
  const [isDownloadingPNG, setIsDownloadingPNG] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  
  // Hardware Settings Modal
  const [showHardwareSettingsModal, setShowHardwareSettingsModal] = useState(false);

  // CSV Import States
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Sales Report CRUD States
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [selectedReportOrder, setSelectedReportOrder] = useState<any>(null);
  const [editOrderData, setEditOrderData] = useState<any>({});
  const [reportSearch, setReportSearch] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, name: string, type: 'product' | 'order' } | null>(null);

  // Map product options

  
  const [sizes, setSizes] = useState<Record<string, string>>({
    "PROD-101": "50ml",
    "PROD-102": "100ml",
    "PROD-103": "30g",
    "PROD-104": "Standard"
  });
  
  const [colors, setColors] = useState<Record<string, string>>({
    "PROD-101": "Amber",
    "PROD-102": "Ocean Blue",
    "PROD-103": "Teal",
    "PROD-104": "Royal Purple"
  });

  const [sleeves, setSleeves] = useState<Record<string, string>>({
    "PROD-101": "Lengan Pendek",
    "PROD-102": "Lengan Pendek",
    "PROD-103": "Lengan Pendek",
    "PROD-104": "Lengan Pendek"
  });

  const [designs, setDesigns] = useState<Record<string, string>>({
    "PROD-101": "Polos",
    "PROD-102": "Polos",
    "PROD-103": "Polos",
    "PROD-104": "Polos"
  });

  // Variant Specific Pricing state (extra premium charge added per attribute item)
  
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Barcode / Kode Variasi Generator (Penggabungan antara Kode Produk + Varian Size / Ukuran)
  const getDeterministicEAN13 = (sku: string, size = '-', color = '-', sleeve = '-', design = '-', prodId?: string): string => {
    const cleanSku = (sku || 'PROD').trim().toUpperCase();
    const cleanSize = (size || '-').trim().toUpperCase();
    const cleanColor = (color || '-').trim().toUpperCase();
    const cleanSleeve = (sleeve || '-').trim().toUpperCase();
    const cleanDesign = (design || '-').trim().toUpperCase();
    const cleanProdId = (prodId || '').trim().toUpperCase();

    // 1. Direct lookup in variantSKUs if explicitly configured
    if (prodId && variantSKUs) {
      const globalKey = getGlobalVariantKey(prodId, size, color, sleeve, design);
      if (variantSKUs[globalKey]) {
        return String(variantSKUs[globalKey]);
      }
    }

    // 2. Incorporate all attributes to guarantee uniqueness
    return `${cleanSku}-${cleanProdId}-${cleanSize}-${cleanColor}-${cleanSleeve}-${cleanDesign}`;
  };

  // Helper to standardize variant keys
  const getGlobalVariantKey = (prodId: string, size: string, color: string, sleeve: string, design: string): string => {
    const cleanProdId = (prodId || '').trim().toUpperCase();
    const cleanSize = (size || '-').trim().toUpperCase();
    const cleanColor = (color || '-').trim().toUpperCase();
    const cleanSleeve = (sleeve || '-').trim().toUpperCase();
    const cleanDesign = (design || '-').trim().toUpperCase();
    return `${cleanProdId}-${cleanSize}-${cleanColor}-${cleanSleeve}-${cleanDesign}`;
  };

  // Helper to calculate total price using real-time price synchronization utility
  const getCalculatedPrice = (prod: any, size: string, color: string, sleeve: string, design: string): number => {
    return calculateVariantPrice(prod, size, color, sleeve, design, variantPrices, sizeExtraPrices, colorExtraPrices);
  };

  // Smart model options helper for each product
  const getProductModelOptions = (p: any): { name: string; hex?: string }[] => {
    if (colorOptions[p.id] && colorOptions[p.id].length > 0 && colorOptions[p.id][0].name !== '-' && colorOptions[p.id][0].name !== 'Default') {
      return colorOptions[p.id];
    }
    
    const nameLower = (p.name || '').toLowerCase();
    const catLower = (p.category || '').toLowerCase();

    // 1. Rok / Skirt
    if (nameLower.includes('rok') || catLower.includes('rok') || catLower.includes('skirt') || nameLower.includes('skirt')) {
      return [
        { name: "2in1 Rok Pendek", hex: "#0f172a" },
        { name: "2in1 Rok Panjang", hex: "#1e293b" },
        { name: "3in1 Legging Pendek", hex: "#334155" },
        { name: "3in1 Legging Panjang", hex: "#475569" }
      ];
    }

    // 2. Celana / Active Flex / Shorts / Pants
    if (nameLower.includes('celana') || nameLower.includes('active flex') || catLower.includes('celana') || catLower.includes('pants') || nameLower.includes('shorts') || nameLower.includes('flex')) {
      return [
        { name: "Hitam", hex: "#000000" },
        { name: "Navy", hex: "#1e3a8a" },
        { name: "Charcoal", hex: "#374151" }
      ];
    }

    // 3. Caps / Topi / Headwear / Cadence
    if (nameLower.includes('cap') || nameLower.includes('topi') || nameLower.includes('cadence') || catLower.includes('headwear') || catLower.includes('topi')) {
      return [
        { name: "Cadence", hex: "#111827" },
        { name: "Pro Performance", hex: "#1e293b" },
        { name: "Aerofit", hex: "#0f172a" }
      ];
    }

    // 4. Manset / Baselayer / Longsleeve / Shirt
    if (nameLower.includes('manset') || nameLower.includes('baselayer') || nameLower.includes('thumbhole') || nameLower.includes('longsleeve') || nameLower.includes('shirt')) {
      return [
        { name: "Thumbhole Black", hex: "#0f172a" },
        { name: "Base Layer Pro", hex: "#1e293b" },
        { name: "Longsleeve Unisex", hex: "#334155" }
      ];
    }

    // 5. Serum / Skincare / Sunscreen / Cream
    if (nameLower.includes('serum') || catLower.includes('serum') || nameLower.includes('sunscreen') || nameLower.includes('cream')) {
      return [
        { name: "50ml Regular", hex: "#f59e0b" },
        { name: "100ml Value Pack", hex: "#d97706" }
      ];
    }

    // 6. Jersey / Cycling / Apparel
    if (nameLower.includes('jersey') || catLower.includes('cycling') || catLower.includes('apparel')) {
      return [
        { name: "Pro Fit Black", hex: "#0f172a" },
        { name: "Aero Navy", hex: "#1e3a8a" },
        { name: "Speed Red", hex: "#dc2626" }
      ];
    }

    // 7. Bundle / Set
    if (nameLower.includes('bundle') || nameLower.includes('set')) {
      return [
        { name: "Complete Edition", hex: "#0f172a" },
        { name: "Starter Kit", hex: "#1e293b" }
      ];
    }

    return [
      { name: "Model Standard", hex: "#1e293b" },
      { name: "Model Premium", hex: "#0f172a" }
    ];
  };

  const getCatalogVariantData = (p: any) => {
    const models = colorOptions[p.id] || [{ name: 'Default', hex: '#1e293b' }];
    const sizes = sizeOptions[p.id] || ['Standard'];
    const sleeves = sleeveOptions[p.id] || ['-'];
    const designs = designOptions[p.id] || ['-'];

    const items: any[] = [];
    models.forEach(m => {
      sizes.forEach(sz => {
        sleeves.forEach(sl => {
          designs.forEach(ds => {
            const vBarcode = getDeterministicEAN13(p.sku, sz, m.name, sl, ds, p.id);
            const vStock = getVariantStock(p.id, sz, m.name, sl, ds);
            const vPrice = getCalculatedPrice(p, sz, m.name, sl, ds);
            const skuVar = [m.name, sz, sl, ds].filter(x => x && x !== '-' && x !== 'Default' && x !== 'Standard').join(', ');
            items.push({
              varCode: variantSKUs ? variantSKUs[`${p.id}-${sz}-${m.name}-${sl}-${ds}`] : vBarcode,
              skuVariasi: skuVar || p.name,
              model: m.name,
              size: sz,
              sleeve: sl,
              design: ds,
              price: vPrice,
              stock: vStock,
              barcode: vBarcode
            });
          });
        });
      });
    });

    return {
      hasCsv: false,
      items,
      models,
      sizes
    };
  };

  const getAllVariantsList = () => {
    const list: any[] = [];
    localProducts.forEach(p => {
      const catalogData = getCatalogVariantData(p);
      catalogData.items.forEach(item => {
        let displayVar = item.skuVariasi;
        if (!displayVar) {
          if (item.size && item.size !== 'Standard' && item.size !== '-' && item.size !== 'ALL SIZE') {
            displayVar = `${item.model}, ${item.size}`;
          } else {
            displayVar = item.model;
          }
        }

        list.push({
          product: p,
          size: item.size,
          color: { name: item.model, hex: '#1e293b' },
          modelName: item.model,
          variantText: displayVar,
          varCode: item.varCode,
          skuVariasi: item.skuVariasi,
          barcode: item.barcode,
          stock: item.stock,
          price: item.price
        });
      });
    });
    return list;
  };

  const handleDownloadVariantBarcodesAsPDF = async () => {
    const list = getAllVariantsList();
    if (list.length === 0) return;
    
    setIsDownloadingPDF(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const cardWidth = 56;
      const cardHeight = 40;
      const columns = 3;
      const rowsPerPage = 6;
      const marginX = 11;
      const marginY = 15;
      const gapX = 10;
      const gapY = 8;

      for (let i = 0; i < list.length; i++) {
        const v = list[i];
        
        const itemIndexOnPage = i % (columns * rowsPerPage);
        const colIndex = itemIndexOnPage % columns;
        const rowIndex = Math.floor(itemIndexOnPage / columns);

        if (i > 0 && itemIndexOnPage === 0) {
          doc.addPage();
        }

        const x = marginX + colIndex * (cardWidth + gapX);
        const y = marginY + rowIndex * (cardHeight + gapY);

        // Draw card border & white background
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

        // 1. Draw Product Title (wrapped!)
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42); // slate-900

        // We wrap the title into lines of max width (cardWidth - 8)
        const titleLines = doc.splitTextToSize(v.product.name || '', cardWidth - 8);
        // Draw up to 2 lines to avoid overlapping
        let titleY = y + 5;
        doc.text(titleLines.slice(0, 2), x + cardWidth / 2, titleY, { align: 'center' });

        // 2. Draw Variant Attributes (Model / Warna / Design)
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105); // slate-600

        const attrText = v.variantText || v.skuVariasi || v.modelName || (v.color?.name && v.color.name !== '-' ? v.color.name : 'Model Standard');

        let attrY = titleY + (titleLines.length > 1 ? 7 : 4);
        doc.text(attrText, x + cardWidth / 2, attrY, { align: 'center' });

        // 3. Draw Price
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42); // slate-900
        let priceY = attrY + 5;
        doc.text(formatIDR(v.price), x + cardWidth / 2, priceY, { align: 'center' });

        // 4. Draw Barcode Lines directly as vector rectangles!
        const barcodeYStart = priceY + 2;
        const barcodeHeight = 8;
        const barWidth = 0.45; // mm wide for each unit bar

        const bars: { width: number; isBlack: boolean; isLong?: boolean }[] = [];
        // Left guard
        bars.push({ width: 1, isBlack: true, isLong: true });
        bars.push({ width: 1, isBlack: false, isLong: true });
        bars.push({ width: 1, isBlack: true, isLong: true });

        let seed = 0;
        const codeStr = v.barcode || '8991996220696';
        for (let charIdx = 0; charIdx < codeStr.length; charIdx++) {
          seed = (seed * 31 + codeStr.charCodeAt(charIdx)) | 0;
        }
        const absSeed = Math.abs(seed);

        for (let j = 0; j < 15; j++) {
          const w1 = ((absSeed >> (j * 2)) & 3) % 3 + 1;
          const w2 = ((absSeed >> (j * 2 + 1)) & 3) % 2 + 1;
          bars.push({ width: w1, isBlack: false });
          bars.push({ width: w2, isBlack: true });
        }
        // Center guard
        bars.push({ width: 1, isBlack: false, isLong: true });
        bars.push({ width: 1, isBlack: true, isLong: true });
        bars.push({ width: 1, isBlack: false, isLong: true });
        bars.push({ width: 1, isBlack: true, isLong: true });
        bars.push({ width: 1, isBlack: false, isLong: true });

        for (let j = 15; j < 30; j++) {
          const w1 = ((absSeed >> (j * 1.5)) & 3) % 3 + 1;
          const w2 = ((absSeed >> (j * 1.5 + 1)) & 3) % 2 + 1;
          bars.push({ width: w1, isBlack: false });
          bars.push({ width: w2, isBlack: true });
        }
        // Right guard
        bars.push({ width: 1, isBlack: true, isLong: true });
        bars.push({ width: 1, isBlack: false, isLong: true });
        bars.push({ width: 1, isBlack: true, isLong: true });

        // Total width calculation: sum of all bar widths
        let totalBarUnits = 0;
        bars.forEach(b => totalBarUnits += b.width);
        const totalBarcodeWidth = totalBarUnits * barWidth;
        const startX = x + (cardWidth - totalBarcodeWidth) / 2;

        // Draw bars
        let currentX = startX;
        doc.setFillColor(9, 13, 22); // dark black
        bars.forEach(b => {
          const w = b.width * barWidth;
          if (b.isBlack) {
            const h = b.isLong ? barcodeHeight : barcodeHeight * 0.84;
            doc.rect(currentX, barcodeYStart, w, h, 'F');
          }
          currentX += w;
        });

        // 5. Draw Barcode Text
        doc.setFont('Courier', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105); // slate-600
        let textY = barcodeYStart + barcodeHeight + 3;
        doc.text(codeStr, x + cardWidth / 2, textY, { align: 'center' });
      }

      doc.save('semua-barcode-pos-a4.pdf');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadVariantBarcodesAsPNG = async () => {
    const cards = document.querySelectorAll('.barcode-card-item');
    if (cards.length === 0) return;
    
    setIsDownloadingPNG(true);
    
    // Workaround for html2canvas oklch parsing crash:
    // Temporarily replace oklch(...) colors in all <style> tags with rgb(0,0,0)
    const styleElements = Array.from(document.querySelectorAll('style'));
    const originalStyles = styleElements.map(el => ({
      el,
      text: el.textContent
    }));
    
    try {
      styleElements.forEach(el => {
        if (el.textContent && (el.textContent.includes('oklch') || el.textContent.includes('oklab'))) {
          el.textContent = el.textContent
            .replace(/oklch\([^)]+\)/g, 'rgb(0,0,0)')
            .replace(/oklab\([^)]+\)/g, 'rgb(0,0,0)');
        }
      });
      
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        try {
          const canvas = await html2canvas(card, {
            backgroundColor: '#ffffff',
            scale: 4,
            useCORS: true,
            logging: false
          });
          
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          const variantData = getAllVariantsList()[i];
          
          let filename = 'barcode-label';
          if (variantData) {
            const nameClean = variantData.product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const sizeClean = variantData.size !== '-' ? `-${variantData.size}` : '';
            const colorClean = variantData.color.name !== '-' ? `-${variantData.color.name}` : '';
            filename = `${nameClean}${sizeClean}${colorClean}-${variantData.barcode}`;
          } else {
            filename = `barcode-label-${i}`;
          }
          
          link.download = `${filename}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Short pause between downloads
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error('Failed to generate PNG for barcode card:', error);
        }
      }
    } finally {
      // Restore original styles
      originalStyles.forEach(item => {
        if (item.el && item.text !== null) {
          item.el.textContent = item.text;
        }
      });
      setIsDownloadingPNG(false);
    }
  };

  const handleDownloadSingleBarcodeAsPNG = async (index: number) => {
    const cards = document.querySelectorAll('.barcode-card-item');
    if (cards.length === 0 || !cards[index]) return;
    
    // Workaround for html2canvas oklch parsing crash:
    const styleElements = Array.from(document.querySelectorAll('style'));
    const originalStyles = styleElements.map(el => ({
      el,
      text: el.textContent
    }));
    
    try {
      styleElements.forEach(el => {
        if (el.textContent && (el.textContent.includes('oklch') || el.textContent.includes('oklab'))) {
          el.textContent = el.textContent
            .replace(/oklch\([^)]+\)/g, 'rgb(0,0,0)')
            .replace(/oklab\([^)]+\)/g, 'rgb(0,0,0)');
        }
      });
      
      const card = cards[index] as HTMLElement;
      const canvas = await html2canvas(card, {
        backgroundColor: '#ffffff',
        scale: 4,
        useCORS: true,
        logging: false
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const variantData = getAllVariantsList()[index];
      
      let filename = 'barcode-label';
      if (variantData) {
        const nameClean = variantData.product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const sizeClean = variantData.size !== '-' ? `-${variantData.size}` : '';
        const colorClean = variantData.color.name !== '-' ? `-${variantData.color.name}` : '';
        filename = `${nameClean}${sizeClean}${colorClean}-${variantData.barcode}`;
      } else {
        filename = `barcode-label-${index}`;
      }
      
      link.download = `${filename}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to generate PNG for barcode card:', error);
    } finally {
      // Restore original styles
      originalStyles.forEach(item => {
        if (item.el && item.text !== null) {
          item.el.textContent = item.text;
        }
      });
    }
  };

  // Helper to retrieve stock of a specific variant combination
  const getVariantStock = (productId: string, size: string, color: string, sleeve: string, design: string): number => {
    const key = getGlobalVariantKey(productId, size, color, sleeve, design);
    if (variantStocks[key] !== undefined) {
      return variantStocks[key];
    }
    // Fallback to base product's stock quantity
    const prod = localProducts.find(p => p.id === productId);
    return prod ? prod.stockQuantity : 0;
  };

  // Helper to update stock of a specific variant combination
  const setVariantStockValue = (productId: string, size: string, color: string, sleeve: string, design: string, stock: number) => {
    const key = `${productId}-${size}-${color}-${sleeve}-${design}`;
    setVariantStocks(prev => ({
      ...prev,
      [key]: Math.max(0, stock)
    }));
  };

  // Helper to update stock with delta and auto-synchronize base product total stock quantity
  const adjustVariantStock = (productId: string, size: string, color: string, sleeve: string, design: string, delta: number) => {
    const key = `${productId}-${size}-${color}-${sleeve}-${design}`;
    const currentVal = getVariantStock(productId, size, color, sleeve, design);
    const newVal = Math.max(0, currentVal + delta);
    
    setVariantStocks(prev => {
      const updated = { ...prev, [key]: newVal };
      
      const pSizes = sizeOptions[productId] || ["Standard"];
      const pColors = colorOptions[productId] || [{ name: "Default", hex: "#cccccc" }];
      const pSleeves = sleeveOptions[productId] || ["-"];
      const pDesigns = designOptions[productId] || ["-"];
      
      let totalStock = 0;
      pSizes.forEach(sz => {
        pColors.forEach(col => {
          pSleeves.forEach(sl => {
            pDesigns.forEach(ds => {
              const vKey = `${productId}-${sz}-${col.name}-${sl}-${ds}`;
              const vStock = updated[vKey] !== undefined ? updated[vKey] : getVariantStock(productId, sz, col.name, sl, ds);
              totalStock += vStock;
            });
          });
        });
      });
      
      setLocalProducts(prevProds => prevProds.map(p => {
        if (p.id === productId) {
          return { ...p, stockQuantity: totalStock };
        }
        return p;
      }));

      return updated;
    });
  };

  // Beautiful render block for high-fidelity interactive vertical barcode lines
  const BarcodeVisual = ({ code }: { code: string }) => {
    const bars: { width: number; isBlack: boolean; isLong?: boolean }[] = [];
    
    // Left guard
    bars.push({ width: 1, isBlack: true, isLong: true });
    bars.push({ width: 1, isBlack: false, isLong: true });
    bars.push({ width: 1, isBlack: true, isLong: true });
    
    // Simple deterministic hash mapping digits to standard physical look with high variance
    let seed = 0;
    for (let i = 0; i < code.length; i++) {
      seed = (seed * 31 + code.charCodeAt(i)) | 0;
    }
    const absSeed = Math.abs(seed);
    
    for (let i = 0; i < 15; i++) {
      const w1 = ((absSeed >> (i * 2)) & 3) % 3 + 1;
      const w2 = ((absSeed >> (i * 2 + 1)) & 3) % 2 + 1;
      bars.push({ width: w1, isBlack: false });
      bars.push({ width: w2, isBlack: true });
    }
    
    // Center guard
    bars.push({ width: 1, isBlack: false, isLong: true });
    bars.push({ width: 1, isBlack: true, isLong: true });
    bars.push({ width: 1, isBlack: false, isLong: true });
    bars.push({ width: 1, isBlack: true, isLong: true });
    bars.push({ width: 1, isBlack: false, isLong: true });
    
    for (let i = 15; i < 30; i++) {
      const w1 = ((absSeed >> (i * 1.5)) & 3) % 3 + 1;
      const w2 = ((absSeed >> (i * 1.5 + 1)) & 3) % 2 + 1;
      bars.push({ width: w1, isBlack: false });
      bars.push({ width: w2, isBlack: true });
    }
    
    // Right guard
    bars.push({ width: 1, isBlack: true, isLong: true });
    bars.push({ width: 1, isBlack: false, isLong: true });
    bars.push({ width: 1, isBlack: true, isLong: true });

    const d1 = code[0] || '8';
    const d2 = code.slice(1, 7) || '991996';
    const d3 = code.slice(7) || '220696';

    return (
      <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center select-none w-full" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <div className="flex items-end h-9 w-full justify-center bg-white px-1 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
          {bars.map((bar, index) => (
            <div
              key={`${index}-${bar.width}-${bar.isBlack}`}
              className="h-full"
              style={{
                backgroundColor: bar.isBlack ? '#090d16' : 'transparent',
                width: `${bar.width * 1.2}px`,
                height: bar.isLong ? '100%' : '84%',
                minWidth: '1.2px'
              }}
            />
          ))}
        </div>
        <div className="text-center w-full px-2 font-mono text-[10px] font-extrabold mt-0.5 tracking-wider leading-none truncate" style={{ color: '#090d16' }}>
          {code}
        </div>
      </div>
    );
  };

  // Load products initially & synchronize categories with global products list
  useEffect(() => {
    if (products) {
      setLocalProducts(products);
      
      const uniqueCats = new Set<string>();
      products.forEach(p => {
        if (p.category) {
          uniqueCats.add(p.category);
        }
      });
      
      if (uniqueCats.size > 0) {
        setCategories(Array.from(uniqueCats));
      } else {
        setCategories(['Jersey', 'Activewear', 'Skirt', 'Accessories']);
      }
    }
  }, [products]);

  // Listen for physical hardware barcode scanner keystrokes globally
  useEffect(() => {
    if (!scannerConnected) return;

    let buffer = '';
    let lastKeyTime = Date.now();
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        // If typing in simulated input or general search, do not intercept normal letters but let Enter proceed if it looks like a barcode scan
        if (target.getAttribute('placeholder')?.includes('Contoh SKU') || target.getAttribute('placeholder')?.includes('Cari Produk')) {
          // Allow
        } else {
          return;
        }
      }
      
      const currentTime = Date.now();
      
      // Barcode scanners type very quickly (usually < 40ms per keystroke).
      if (currentTime - lastKeyTime > 120) {
        buffer = '';
      }
      
      lastKeyTime = currentTime;
      
      if (e.key === 'Enter') {
        if (buffer.length >= 6) {
          e.preventDefault();
          triggerLaserScanCode(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1 && /[0-9a-zA-Z\-]/.test(e.key)) {
        buffer += e.key;
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [scannerConnected, localProducts]);

  // Set default product category on mount or when categories change
  useEffect(() => {
    if (categories.length > 0) {
      setProdCategory(categories[0]);
    }
  }, [categories]);

  // Handle Dynamic Category Deletions
  const handleDeleteCategory = (catName: string) => {
    setCategories(prev => prev.filter(c => c !== catName));
    if (selectedCategory === catName) {
      setSelectedCategory('All Products');
    }
  };

  // Handle Dynamic Category Additions
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;

    setCategories(prev => [...prev, trimmed]);
    setNewCategoryName('');
  };

  const handleSelectCatalogProduct = (p: any) => {
    setProdName(p.name || '');
    setProdPrice(p.sellingPrice || 120000);
    setProdStock(p.stockQuantity || 100);
    if (p.category && categories.includes(p.category)) {
      setProdCategory(p.category);
    }
    if (p.imageUrl) {
      setProdPhoto(p.imageUrl);
    }
    setShowCatalogPicker(false);
  };

  const openNewProductModal = () => {
    const newSku = `SKU-POS-${Math.floor(100000 + Math.random() * 900000)}`;
    setEditModalTab('basic');
    setEditingProductId(null);
    setProdSku(newSku);
    setProdName('');
    setProdPrice(125000);
    setProdUnitCostPrice(75000);
    setProdStock(150);
    setProdCategory(categories[0] || 'Jersey Casual');
    setProdWarehouse('Gudang BUDP');
    setProdSafetyStock(10);
    setProdMinimumStock(5);
    setProdUnit('Pcs');
    setProdPhoto('');
    setProdPhotoPreset('PROD-101');
    setEditDimensionGroups([]);
    setEditVariants([]);
    setSelectedVariantKeys([]);
    setBulkCostVal('');
    setBulkPriceVal('');
    setBulkStockVal('');
    setVariantSearchQuery('');
    setFormError(null);
    setFormTouched(false);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProductId(null);
    setProdSku('');
    setProdName('');
    setProdPrice(125000);
    setProdUnitCostPrice(75000);
    setProdStock(150);
    setProdCategory('');
    setProdPhoto('');
    setEditDimensionGroups([]);
    setEditVariants([]);
    setSelectedVariantKeys([]);
    setBulkCostVal('');
    setBulkPriceVal('');
    setBulkStockVal('');
    setVariantSearchQuery('');
    setFormError(null);
    setFormTouched(false);
  };

  // Generate Local POS Variants from Dimension Groups (Matching Katalog Produk)
  const generatePosLocalVariantsFromGroups = (
    pId: string,
    pSku: string,
    basePrice: number,
    baseCost: number,
    totalStockQty: number,
    groups: {id: string; name: string; options: string[]; newOptionInput?: string;}[],
    existingDrafts: {key: string; globalKey: string; size: string; color: string; sleeve: string; design: string; label: string; sku: string; cost: number; price: number; stock: number;}[] = []
  ) => {
    const activeGroups = groups.filter(g => g.options.length > 0);
    const draftMap = new Map<string, any>();
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

    const newVariants: {key: string; globalKey: string; size: string; color: string; sleeve: string; design: string; label: string; sku: string; cost: number; price: number; stock: number;}[] = [];

    combinations.forEach(combo => {
      const szObj = combo.find(c => /ukuran|size/i.test(c.name));
      const colObj = combo.find(c => /warna|color/i.test(c.name));
      const slObj = combo.find(c => /lengan|sleeve/i.test(c.name));
      const dsObj = combo.find(c => /desain|design|model/i.test(c.name));

      const sz = szObj ? szObj.val : (combo[0]?.val || '-');
      const col = colObj ? colObj.val : (combo[1]?.val || '-');
      const sl = slObj ? slObj.val : (combo[2]?.val || '-');
      const ds = dsObj ? dsObj.val : (combo[3]?.val || '-');

      const key = combo.map(c => `${c.name}:${c.val}`).join('|');
      const globalKey = getGlobalVariantKey(pId, sz, col, sl, ds);
      const label = combo.map(c => `${c.name}: ${c.val}`).join(' | ');
      const skuSuffix = combo.map(c => c.val.slice(0, 3).toUpperCase()).join('-');
      const sku = `${pSku || 'SKU'}-${skuSuffix}`;

      if (draftMap.has(key)) {
        const existing = draftMap.get(key)!;
        newVariants.push({
          ...existing,
          cost: existing.cost ?? baseCost
        });
      } else {
        const comboKey = combo.map(c => c.val).join(' - ');
        let price = modalComboPrices[comboKey] ?? variantPrices[globalKey] ?? basePrice;
        let stock = modalComboStocks[comboKey] ?? variantStocks[globalKey] ?? defaultProportionalStock;

        newVariants.push({
          key,
          globalKey,
          size: sz,
          color: col,
          sleeve: sl,
          design: ds,
          label,
          sku,
          cost: variantCosts[globalKey] || baseCost || Math.round(basePrice * 0.6),
          price: Number(price) || basePrice,
          stock: Number(stock) || 0
        });
      }
    });

    setEditVariants(newVariants);
  };

  // Tab 2 Dimension Group Handlers
  const handleAddDimensionGroup = () => {
    const currentProdId = editingProductId || 'PROD-NEW-1';
    const newGroup = {
      id: 'dim-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: `Atribut ${editDimensionGroups.length + 1}`,
      options: [],
      newOptionInput: ''
    };
    const nextGroups = [...editDimensionGroups, newGroup];
    setEditDimensionGroups(nextGroups);
    generatePosLocalVariantsFromGroups(currentProdId, prodSku, prodPrice, prodUnitCostPrice, prodStock, nextGroups, editVariants);
  };

  const handleRemoveDimensionGroup = (id: string) => {
    const currentProdId = editingProductId || 'PROD-NEW-1';
    const nextGroups = editDimensionGroups.filter(g => g.id !== id);
    setEditDimensionGroups(nextGroups);
    generatePosLocalVariantsFromGroups(currentProdId, prodSku, prodPrice, prodUnitCostPrice, prodStock, nextGroups, editVariants);
  };

  const handleUpdateDimensionGroupName = (id: string, newName: string) => {
    const currentProdId = editingProductId || 'PROD-NEW-1';
    const nextGroups = editDimensionGroups.map(g => g.id === id ? { ...g, name: newName } : g);
    setEditDimensionGroups(nextGroups);
    generatePosLocalVariantsFromGroups(currentProdId, prodSku, prodPrice, prodUnitCostPrice, prodStock, nextGroups, editVariants);
  };

  const handleAddOptionToGroup = (groupId: string, optionVal?: string) => {
    const currentProdId = editingProductId || 'PROD-NEW-1';
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
    generatePosLocalVariantsFromGroups(currentProdId, prodSku, prodPrice, prodUnitCostPrice, prodStock, nextGroups, editVariants);
  };

  const handleRemoveOptionFromGroup = (groupId: string, optionVal: string) => {
    const currentProdId = editingProductId || 'PROD-NEW-1';
    const nextGroups = editDimensionGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, options: g.options.filter(o => o !== optionVal) };
      }
      return g;
    });
    setEditDimensionGroups(nextGroups);
    generatePosLocalVariantsFromGroups(currentProdId, prodSku, prodPrice, prodUnitCostPrice, prodStock, nextGroups, editVariants);
  };

  const handleApplyPresetTemplate = (templateType: 'clothing' | 'shoes' | 'electronics' | 'clear') => {
    const currentProdId = editingProductId || 'PROD-NEW-1';
    let nextGroups: {id: string; name: string; options: string[]; newOptionInput?: string;}[] = [];

    if (templateType === 'clothing') {
      nextGroups = [
        { id: 'dim-sz-' + Date.now(), name: 'Ukuran', options: ['S', 'M', 'L', 'XL', '2XL'], newOptionInput: '' },
        { id: 'dim-col-' + Date.now(), name: 'Warna', options: ['Hitam', 'Putih', 'Navy', 'Merah'], newOptionInput: '' }
      ];
    } else if (templateType === 'shoes') {
      nextGroups = [
        { id: 'dim-sz-' + Date.now(), name: 'Ukuran EU', options: ['38', '39', '40', '41', '42', '43', '44'], newOptionInput: '' },
        { id: 'dim-col-' + Date.now(), name: 'Warna', options: ['Hitam', 'Putih', 'Cokelat'], newOptionInput: '' }
      ];
    } else if (templateType === 'electronics') {
      nextGroups = [
        { id: 'dim-cap-' + Date.now(), name: 'Kapasitas', options: ['128GB', '256GB', '512GB'], newOptionInput: '' },
        { id: 'dim-col-' + Date.now(), name: 'Warna', options: ['Space Gray', 'Silver', 'Gold'], newOptionInput: '' }
      ];
    } else if (templateType === 'clear') {
      nextGroups = [];
    }

    setEditDimensionGroups(nextGroups);
    generatePosLocalVariantsFromGroups(currentProdId, prodSku, prodPrice, prodUnitCostPrice, prodStock, nextGroups, editVariants);
  };

  // Tab 3 Bulk Apply & Checkable Table Handlers
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

  const handleUpdateEditVariantRow = (realIdx: number, field: string, value: any) => {
    setEditVariants(prev => {
      const next = [...prev];
      if (next[realIdx]) {
        next[realIdx] = { ...next[realIdx], [field]: value };
      }
      return next;
    });
  };

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
      const isTargeted = targetKeys
        ? targetKeys.has(v.key)
        : (!variantSearchQuery ||
           v.label.toLowerCase().includes(variantSearchQuery.toLowerCase()) ||
           v.sku.toLowerCase().includes(variantSearchQuery.toLowerCase()));

      if (!isTargeted) return v;
      return { ...v, stock: Math.max(0, (v.stock || 0) + delta) };
    }));
  };

  const handleEditProductClick = (p: any) => {
    const pId = p.id;
    setEditModalTab('basic');
    setEditingProductId(pId);
    setProdSku(p.sku || `SKU-${pId}`);
    setProdName(p.name || '');
    setProdPrice(p.sellingPrice || 0);
    setProdUnitCostPrice(p.unitCostPrice || Math.round((p.sellingPrice || 0) * 0.6));
    setProdStock(p.stockQuantity || 0);
    setProdCategory(p.category || categories[0] || 'Uncategorized');
    setProdWarehouse(p.warehouse || 'Gudang Utama Cikarang');
    setProdSafetyStock(p.safetyStock || 10);
    setProdMinimumStock(p.minimumStock || 5);
    setProdUnit(p.unit || 'Pcs');
    setProdPhoto(p.imageUrl || '');
    setProdPhotoPreset(p.presetStyle || 'PROD-101');
    setFormError(null);
    setFormTouched(false);

    // Reconstruct editDimensionGroups from existing variant options
    const reconstructedGroups: {id: string; name: string; options: string[]; newOptionInput?: string;}[] = [];
    if (sizeOptions[pId] && !(sizeOptions[pId].length === 1 && sizeOptions[pId][0] === "-")) {
      reconstructedGroups.push({
        id: 'dim-sz-' + pId,
        name: customVariantNames[pId]?.[0] || 'Ukuran',
        options: [...sizeOptions[pId]],
        newOptionInput: ''
      });
    }
    if (colorOptions[pId] && !(colorOptions[pId].length === 1 && colorOptions[pId][0].name === "-")) {
      reconstructedGroups.push({
        id: 'dim-col-' + pId,
        name: customVariantNames[pId]?.[1] || 'Warna',
        options: colorOptions[pId].map(c => c.name),
        newOptionInput: ''
      });
    }
    if (sleeveOptions[pId] && !(sleeveOptions[pId].length === 1 && sleeveOptions[pId][0] === "-")) {
      reconstructedGroups.push({
        id: 'dim-sl-' + pId,
        name: customVariantNames[pId]?.[2] || 'Lengan',
        options: [...sleeveOptions[pId]],
        newOptionInput: ''
      });
    }
    if (designOptions[pId] && !(designOptions[pId].length === 1 && designOptions[pId][0] === "-")) {
      reconstructedGroups.push({
        id: 'dim-ds-' + pId,
        name: customVariantNames[pId]?.[3] || 'Desain',
        options: [...designOptions[pId]],
        newOptionInput: ''
      });
    }

    setEditDimensionGroups(reconstructedGroups);
    generatePosLocalVariantsFromGroups(pId, p.sku || `SKU-${pId}`, p.sellingPrice || 0, p.unitCostPrice || 0, p.stockQuantity || 0, reconstructedGroups, []);
    setSelectedVariantKeys([]);
    setBulkCostVal('');
    setBulkPriceVal('');
    setBulkStockVal('');
    setVariantSearchQuery('');

    setShowProductModal(true);
  };

  // Handle Add/Edit Product Submission
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched(true);
    if (!prodName.trim()) {
      setFormError('Nama produk wajib diisi.');
      setEditModalTab('basic');
      return;
    }
    if (prodPrice <= 0 || isNaN(prodPrice)) {
      setFormError('Harga dasar produk harus lebih besar dari 0.');
      setEditModalTab('basic');
      return;
    }
    setFormError(null);

    const targetId = editingProductId || `PROD-NEW-${Date.now()}`;
    const targetSku = prodSku.trim() || `SKU-POS-${Math.floor(100000 + Math.random() * 900000)}`;

    const totalCalculatedStock = editVariants.length > 0
      ? editVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : Number(prodStock || 0);

    const targetProd = {
      id: targetId,
      sku: targetSku,
      name: prodName,
      category: prodCategory || categories[0] || 'Uncategorized',
      warehouse: prodWarehouse || 'Gudang Utama Cikarang',
      sellingPrice: Number(prodPrice || 0),
      unitCostPrice: Number(prodUnitCostPrice || 0),
      stockQuantity: totalCalculatedStock,
      minimumStock: Number(prodMinimumStock || 5),
      safetyStock: Number(prodSafetyStock || 10),
      unit: prodUnit,
      description: 'Produk Kasir POS Retail',
      status: totalCalculatedStock > 0 ? ('Ready' as const) : ('Out of Stock' as const),
      imageUrl: prodPhoto || null,
      presetStyle: prodPhoto ? "" : (prodPhotoPreset || "PROD-101"),
      lastUpdated: new Date().toISOString().substring(0, 10)
    };

    // Save variants into variantPrices & variantStocks for checkout
    if (editVariants.length > 0) {
      const newVariantPrices: Record<string, number> = {};
      const newVariantStocks: Record<string, number> = {};

      editVariants.forEach(variant => {
        if (variant.globalKey) {
          newVariantPrices[variant.globalKey] = variant.price;
          newVariantStocks[variant.globalKey] = variant.stock;
        }
      });

      setVariantPrices(prev => ({ ...prev, ...newVariantPrices }));
      setVariantStocks(prev => ({ ...prev, ...newVariantStocks }));

      // Map dimension groups to fixed options for checkout selection
      const szGroup = editDimensionGroups.find(g => /ukuran|size/i.test(g.name)) || editDimensionGroups[0];
      const colGroup = editDimensionGroups.find(g => /warna|color/i.test(g.name)) || editDimensionGroups[1];
      const slGroup = editDimensionGroups.find(g => /lengan|sleeve/i.test(g.name)) || editDimensionGroups[2];
      const dsGroup = editDimensionGroups.find(g => /desain|design|model/i.test(g.name)) || editDimensionGroups[3];

      if (szGroup && szGroup.options.length > 0) {
        setSizeOptions(prev => ({ ...prev, [targetId]: szGroup.options }));
      }
      if (colGroup && colGroup.options.length > 0) {
        setColorOptions(prev => ({
          ...prev,
          [targetId]: colGroup.options.map(c => ({ name: c, hex: '#1e293b' }))
        }));
      }
      if (slGroup && slGroup.options.length > 0) {
        setSleeveOptions(prev => ({ ...prev, [targetId]: slGroup.options }));
      }
      if (dsGroup && dsGroup.options.length > 0) {
        setDesignOptions(prev => ({ ...prev, [targetId]: dsGroup.options }));
      }
    }

    if (editingProductId) {
      setLocalProducts(prev => prev.map(p => p.id === editingProductId ? targetProd : p));
      updateProduct(editingProductId, targetProd);
    } else {
      setLocalProducts(prev => [targetProd, ...prev]);
      addProduct(targetProd);
    }

    closeProductModal();
  };

  // Handle Add Custom Promo Codes
  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const codeUpper = newPromoCode.trim().toUpperCase();
    if (!codeUpper) return;

    const newPromo: PromoCode = {
      code: codeUpper,
      type: newPromoType,
      value: Number(newPromoValue),
      description: newPromoDesc || `Diskon khusus ${codeUpper}`
    };

    setPromos(prev => [...prev, newPromo]);
    setNewPromoCode('');
    setNewPromoDesc('');
  };

  const handleDeletePromo = (codeToDelete: string) => {
    setPromos(prev => prev.filter(p => p.code !== codeToDelete));
    if (discountCode.toUpperCase() === codeToDelete.toUpperCase()) {
      setIsDiscountApplied(false);
      setDiscountValue(0);
    }
  };

  // Base64 file reader helper
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Robust CSV Parsing Function
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 1) return null;

    // Filter out completely empty lines
    const activeLines = lines.map(line => line.trim()).filter(line => line.length > 0);
    if (activeLines.length < 2) return null;

    const headerLine = activeLines[0];
    let sep = ',';
    if (headerLine.includes(';') && !headerLine.includes(',')) {
      sep = ';';
    }

    const headers = headerLine.split(sep).map(h => h.trim().replace(/^["']|["']$/g, ''));

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < activeLines.length; i++) {
      const line = activeLines[i];
      const values: string[] = [];
      let currentVal = '';
      let inQuotes = false;

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === sep && !inQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      const rowObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowObj[header] = values[index] || '';
      });
      rows.push(rowObj);
    }

    return { headers, rows };
  };

  const handleOpenEditOrder = (order: any) => {
    setSelectedReportOrder(order);
    setEditOrderData({ ...order });
    setShowEditOrderModal(true);
  };

  const handleSaveEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReportOrder) {
      updateMarketplaceOrder(selectedReportOrder.id, editOrderData);
      setShowEditOrderModal(false);
      setSelectedReportOrder(null);
    }
  };

  // CSV Template Downloader with 4D Variant Columns
  const handleDownloadTemplate = () => {
    const headers = [
      'Nama Produk', 
      'SKU_Barcode', 
      'Kategori', 
      'Harga Jual', 
      'Stok', 
      'Deskripsi',
      'Varian Size (pisahkan dengan |)',
      'Varian Warna (pisahkan Nama:Hex dengan |)',
      'Varian Lengan (pisahkan dengan |)',
      'Varian Desain (pisahkan dengan |)'
    ];
    
    const sampleRow1 = [
      '"Kemeja Flanel Premium"', 
      '"ROKVELORAPDK"', 
      '"Pakaian Pria"', 
      '"185000"', 
      '"120"', 
      '"Kemeja flanel katun premium nyaman dipakai."',
      '"S|M|L|XL"',
      '"Navy:#1e3a8a|Red:#991b1b|Black:#111827"',
      '"Lengan Pendek|Lengan Panjang"',
      '"Polos|Kotak-Kotak"'
    ];
    
    const sampleRow2 = [
      '"T-Shirt Oversized Basic"', 
      '"TSHIRTOVER"', 
      '"Kaos"', 
      '"95000"', 
      '"80"', 
      '"Kaos polos katun combed 24s tebal."',
      '"M|L|XL"',
      '"White:#ffffff|Sage Green:#86efac"',
      '"Lengan Pendek"',
      '"Polos|Saku Depan"'
    ];

    const csvContent = [
      headers.join(','),
      sampleRow1.join(','),
      sampleRow2.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_pos_4d_variants.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Bulk Uploader & Parser Handler supporting 4D Clothing Variants
  const handleUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setUploadError('File kosong atau tidak dapat dibaca.');
          return;
        }

        const parsed = parseCSV(text);
        if (!parsed || parsed.rows.length === 0) {
          setUploadError('Format CSV tidak valid atau tidak ada data produk.');
          return;
        }

        const { headers, rows } = parsed;

        // Map column headers flexibly
        const nameKey = headers.find(h => ['nama produk', 'nama', 'name', 'nama_produk'].includes(h.toLowerCase().trim())) || headers[0];
        const skuKey = headers.find(h => ['sku_barcode', 'sku', 'sku_barcodenya', 'barcode', 'sku/barcode', 'barcode/sku'].includes(h.toLowerCase().trim().replace(/[^a-z0-9_/]/g, ''))) || headers[1];
        const categoryKey = headers.find(h => ['kategori', 'category'].includes(h.toLowerCase().trim())) || headers[2];
        const priceKey = headers.find(h => ['harga jual', 'harga', 'selling price', 'price', 'harga_jual'].includes(h.toLowerCase().trim())) || headers[3];
        const stockKey = headers.find(h => ['stok', 'stok quantity', 'stock', 'quantity', 'stock_quantity'].includes(h.toLowerCase().trim())) || headers[4];
        const descKey = headers.find(h => ['deskripsi', 'description'].includes(h.toLowerCase().trim())) || headers[5];

        // Advanced 4D variant keys
        const sizeKey = headers.find(h => h.toLowerCase().includes('varian 1') || h.toLowerCase().includes('size') || h.toLowerCase().includes('ukuran'));
        const colorKey = headers.find(h => h.toLowerCase().includes('varian 2') || h.toLowerCase().includes('warna') || h.toLowerCase().includes('color'));
        const sleeveKey = headers.find(h => h.toLowerCase().includes('varian 3') || h.toLowerCase().includes('lengan') || h.toLowerCase().includes('sleeve'));
        const designKey = headers.find(h => h.toLowerCase().includes('varian 4') || h.toLowerCase().includes('desain') || h.toLowerCase().includes('design'));

        const newProductsList: any[] = [];
        const newSizeOptions: Record<string, string[]> = {};
        const newColorOptions: Record<string, {name: string, hex: string}[]> = {};
        const newSleeveOptions: Record<string, string[]> = {};
        const newDesignOptions: Record<string, string[]> = {};

        const newSizes: Record<string, string> = {};
        const newColors: Record<string, string> = {};
        const newSleeves: Record<string, string> = {};
        const newDesigns: Record<string, string> = {};
        
        const newVariantStocks: Record<string, number> = {};
        const newCustomVariantNames: Record<string, string[]> = {};

        let importedCount = 0;
        let skippedCount = 0;

        rows.forEach((row, idx) => {
          const nameVal = row[nameKey]?.trim();
          const skuVal = row[skuKey]?.trim();

          // Skip if product name is empty
          if (!nameVal) {
            skippedCount++;
            return;
          }

          const priceVal = Number(row[priceKey]?.replace(/[^0-9.-]+/g, '')) || 120000;
          const stockVal = Number(row[stockKey]?.replace(/[^0-9]+/g, '')) || 150;
          const categoryVal = row[categoryKey]?.trim() || 'Pakaian Pria';
          const descVal = row[descKey]?.trim() || 'Imported massal via CSV';

          // Standardize SKU / barcode
          const finalSku = skuVal || `SKU-IMP-${Math.floor(100000 + Math.random() * 900000)}`;
          const finalId = `PROD-IMP-${Date.now()}-${idx}`;

          // Parse Varian 1 (Sizes)
          const sizeValStr = sizeKey ? row[sizeKey]?.trim() : '';
          let v1Name = "Ukuran";
          let parsedSizes = ['S', 'M', 'L'];
          if (sizeValStr) {
             const parts = sizeValStr.split('::');
             if (parts.length > 1) {
                 v1Name = parts[0].trim();
                 parsedSizes = parts[1].split('|').map(s => s.trim());
             } else {
                 parsedSizes = sizeValStr.split('|').map(s => s.trim());
             }
          }

          // Parse Varian 2 (Colors)
          const colorValStr = colorKey ? row[colorKey]?.trim() : '';
          let v2Name = "Warna";
          let parsedColors = [
            { name: 'Black', hex: '#111827' },
            { name: 'White', hex: '#ffffff' }
          ];
          if (colorValStr) {
             const parts = colorValStr.split('::');
             let optionsStr = colorValStr;
             if (parts.length > 1) {
                 v2Name = parts[0].trim();
                 optionsStr = parts[1];
             }
             parsedColors = optionsStr.split('|').map(c => {
                 const cParts = c.split(':');
                 const name = cParts[0]?.trim() || 'Default';
                 const hex = cParts[1]?.trim() || '#111827';
                 return { name, hex };
             });
          }

          // Parse Varian 3 (Sleeves)
          const sleeveValStr = sleeveKey ? row[sleeveKey]?.trim() : '';
          let v3Name = "Lengan";
          let parsedSleeves = ['-', 'Lengan Panjang'];
          if (sleeveValStr) {
             const parts = sleeveValStr.split('::');
             if (parts.length > 1) {
                 v3Name = parts[0].trim();
                 parsedSleeves = parts[1].split('|').map(s => s.trim());
             } else {
                 parsedSleeves = sleeveValStr.split('|').map(s => s.trim());
             }
          }

          // Parse Varian 4 (Designs)
          const designValStr = designKey ? row[designKey]?.trim() : '';
          let v4Name = "Desain";
          let parsedDesigns = ['-', 'Batik'];
          if (designValStr) {
             const parts = designValStr.split('::');
             if (parts.length > 1) {
                 v4Name = parts[0].trim();
                 parsedDesigns = parts[1].split('|').map(s => s.trim());
             } else {
                 parsedDesigns = designValStr.split('|').map(s => s.trim());
             }
          }
          
          newCustomVariantNames[finalId] = [v1Name, v2Name, v3Name, v4Name];

          const newProductObj = {
            id: finalId,
            name: nameVal,
            sku: finalSku, // Auto-generate Indonesian EAN-13 from this SKU base
            category: categoryVal,
            sellingPrice: priceVal,
            unitCostPrice: Math.round(priceVal * 0.6),
            stockQuantity: stockVal, // Total stock will be synchronized from sum of variations
            description: descVal,
            status: 'Ready',
            imageUrl: null,
            presetStyle: 'PROD-101'
          };

          // Setup appropriate 4D options mapping
          newSizeOptions[finalId] = parsedSizes;
          newColorOptions[finalId] = parsedColors;
          newSleeveOptions[finalId] = parsedSleeves;
          newDesignOptions[finalId] = parsedDesigns;

          newSizes[finalId] = parsedSizes[0] || 'S';
          newColors[finalId] = parsedColors[0]?.name || 'Default';
          newSleeves[finalId] = parsedSleeves[0] || '-';
          newDesigns[finalId] = parsedDesigns[0] || '-';

          // Distribute stock across the variant combinations
          const totalCombos = parsedSizes.length * parsedColors.length * parsedSleeves.length * parsedDesigns.length;
          const distributedStock = Math.max(1, Math.round(stockVal / totalCombos));
          
          let actualSumStock = 0;
          parsedSizes.forEach(sz => {
            parsedColors.forEach(col => {
              parsedSleeves.forEach(sl => {
                parsedDesigns.forEach(ds => {
                  const key = `${finalId}-${sz}-${col.name}-${sl}-${ds}`;
                  newVariantStocks[key] = distributedStock;
                  actualSumStock += distributedStock;
                });
              });
            });
          });

          // Match base stock quantity exactly to distributed sum
          newProductObj.stockQuantity = actualSumStock;

          newProductsList.push(newProductObj);
          importedCount++;

          // Dynamically add category if it's new
          if (categoryVal && !categories.some(c => c.toLowerCase() === categoryVal.toLowerCase())) {
            setCategories(prev => [...prev, categoryVal]);
          }
        });

        if (newProductsList.length > 0) {
          setSizeOptions(prev => ({ ...prev, ...newSizeOptions }));
          setColorOptions(prev => ({ ...prev, ...newColorOptions }));
          setSleeveOptions(prev => ({ ...prev, ...newSleeveOptions }));
          setDesignOptions(prev => ({ ...prev, ...newDesignOptions }));

          setSizes(prev => ({ ...prev, ...newSizes }));
          setColors(prev => ({ ...prev, ...newColors }));
          setSleeves(prev => ({ ...prev, ...newSleeves }));
          setDesigns(prev => ({ ...prev, ...newDesigns }));

          setVariantStocks(prev => ({ ...prev, ...newVariantStocks }));
          setCustomVariantNames(prev => ({ ...prev, ...newCustomVariantNames }));
          setLocalProducts(prev => [...newProductsList, ...prev]);
          setUploadSuccess(`Sukses mengimpor ${importedCount} produk massal dengan integrasi barcode 4D ke sistem POS.`);
        } else {
          setUploadError('Tidak ada baris produk valid yang berhasil diimpor.');
        }
      } catch (err: any) {
        setUploadError(`Gagal membaca & memproses file CSV: ${err.message || err}`);
      }
    };
    reader.readAsText(file);

    // Clear input to allow re-upload of same file
    e.target.value = '';
  };

  // Find a product variant by scanning its EAN-13 barcode or Kode Variasi / Variant SKU
  const findProductVariantByEAN13 = (scannedCode: string) => {
    const codeClean = scannedCode.trim();
    if (!codeClean) return null;
    
    // 1. Direct match in variantSKUs map
    if (variantSKUs) {
      for (const [globalKey, vSkuVal] of Object.entries(variantSKUs)) {
        if (String(vSkuVal).toLowerCase() === codeClean.toLowerCase()) {
          const parts = globalKey.split('-');
          if (parts.length >= 5) {
            const prodId = parts[0];
            const sz = parts[1];
            const col = parts[2];
            const sl = parts[3];
            const ds = parts.slice(4).join('-');
            const prod = localProducts.find(p => p.id === prodId || p.sku === prodId);
            if (prod) {
              return { product: prod, size: sz, color: col, sleeve: sl, design: ds };
            }
          }
        }
      }
    }

    // 2. EAN-13 Barcode calculation match
    for (const p of localProducts) {
      const pSizes = sizeOptions[p.id] || (p.sku ? sizeOptions[p.sku] : undefined) || ["Standard"];
      const rawColors = colorOptions[p.id] || (p.sku ? colorOptions[p.sku] : undefined);
      const pColors = rawColors ? rawColors.map((c: any) => typeof c === 'string' ? { name: c, hex: '#cccccc' } : c) : [{ name: "Default", hex: "#cccccc" }];
      const pSleeves = sleeveOptions[p.id] || (p.sku ? sleeveOptions[p.sku] : undefined) || ["-"];
      const pDesigns = designOptions[p.id] || (p.sku ? designOptions[p.sku] : undefined) || ["-"];
      
      for (const sz of pSizes) {
        for (const col of pColors) {
          for (const sl of pSleeves) {
            for (const ds of pDesigns) {
              const generatedCode = getDeterministicEAN13(p.sku, sz, col.name, sl, ds, p.id);
              if (generatedCode.toLowerCase() === codeClean.toLowerCase()) {
                return { product: p, size: sz, color: col.name, sleeve: sl, design: ds };
              }
            }
          }
        }
      }
    }
    
    // 3. Fallback: Match base SKU, product ID, or parent SKU
    const matchedBase = localProducts.find(p => 
      (p.sku && p.sku.toLowerCase() === codeClean.toLowerCase()) || 
      (p.id && p.id.toLowerCase() === codeClean.toLowerCase()) ||
      (p.parentSku && p.parentSku.toLowerCase() === codeClean.toLowerCase())
    );
    if (matchedBase) {
      const activeSize = sizes[matchedBase.id] || sizeOptions[matchedBase.id]?.[0] || 'Standard';
      const activeColor = colors[matchedBase.id] || colorOptions[matchedBase.id]?.[0]?.name || 'Default';
      const activeSleeve = sleeves[matchedBase.id] || sleeveOptions[matchedBase.id]?.[0] || '-';
      const activeDesign = designs[matchedBase.id] || designOptions[matchedBase.id]?.[0] || '-';
      return { product: matchedBase, size: activeSize, color: activeColor, sleeve: activeSleeve, design: activeDesign };
    }
    
    return null;
  };

  // Main laser scanning simulation processor (triggers beep and adds exact variant to cart)
  const triggerLaserScanCode = (code: string) => {
    const matchedVariant = findProductVariantByEAN13(code);
    if (matchedVariant) {
      const { product, size, color, sleeve, design } = matchedVariant;
      
      // Check stock
      const stock = getVariantStock(product.id, size, color, sleeve || '-', design || '-');
      if (stock <= 0) {
        setScanTestResult(`GAGAL: Varian "${product.name} (${size} - ${color} - ${sleeve} - ${design})" habis stok.`);
        return;
      }

      addToCart(product, size, color, sleeve, design);
      
      if (scannerBeepVolume !== 'off') {
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = context.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1400, context.currentTime); // High pitch beep
          osc.connect(context.destination);
          osc.start();
          osc.stop(context.currentTime + 0.15);
        } catch (err) {}
      }
      setScanTestResult(`SUKSES! Varian "${product.name} (${size} - ${color} - ${sleeve} - ${design})" terdeteksi via scan laser.`);
    } else {
      setScanTestResult(`GAGAL: SKU/Barcode "${code}" tidak terdaftar dalam sistem.`);
    }
  };

  // Test barcode device keystrokes simulator
  const handleTestBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanTestInput.trim();
    if (!code) return;
    triggerLaserScanCode(code);
    setScanTestInput('');
  };

  // Handle direct barcode click from product card
  const handleBarcodeClick = (eanCode: string) => {
    triggerLaserScanCode(eanCode);
  };

  // Simulated printer calibration engine
  const runPrinterCalibration = () => {
    setPrinterTestStatus('Mengirim sinyal inisialisasi ke thermal print-head...');
    setTimeout(() => {
      setPrinterTestStatus('Melakukan feed kertas dan sensor pitch alignment...');
      setTimeout(() => {
        setPrinterTestStatus('Printer Ready! Kalibrasi layout kertas 80mm berhasil.');
      }, 1000);
    }, 1000);
  };

  // Catalog Filtration
  const filteredProducts = localProducts.filter(p => {
    // Filter by selected warehouse
    if (selectedWarehouse && selectedWarehouse !== 'all') {
      const pWh = (p.warehouse || 'Gudang Utama Cikarang').trim().toLowerCase();
      if (pWh !== selectedWarehouse.trim().toLowerCase()) {
        return false;
      }
    }

    const query = search.trim().toLowerCase();
    
    // Check match in basic fields
    const nameMatch = p.name ? p.name.toLowerCase().includes(query) : false;
    const skuMatch = p.sku ? p.sku.toLowerCase().includes(query) : false;
    const parentSkuMatch = p.parentSku ? p.parentSku.toLowerCase().includes(query) : false;
    const categoryMatch = p.category ? p.category.toLowerCase().includes(query) : false;
    
    // Check match in variant SKUs
    let variantSkuMatch = false;
    if (query && variantSKUs) {
      for (const [globalKey, vVal] of Object.entries(variantSKUs)) {
        if (globalKey.startsWith(p.id) || globalKey.startsWith(p.sku)) {
          if (String(vVal).toLowerCase().includes(query)) {
            variantSkuMatch = true;
            break;
          }
        }
      }
    }

    const matchesSearch = !query || nameMatch || skuMatch || parentSkuMatch || categoryMatch || variantSkuMatch;
    if (!matchesSearch) return false;

    if (selectedCategory === 'All Products') return true;
    return (p.category || 'Umum').toLowerCase() === selectedCategory.toLowerCase();
  });

  const addToCart = (prod: any, customSize?: string, customColor?: string, customSleeve?: string, customDesign?: string) => {
    if (!shiftActive) {
      showHardwareToast('Transaksi Diblokir', 'Silakan buka shift kasir terlebih dahulu sebelum memulai transaksi POS.', 'warning');
      return;
    }
    const size = customSize || sizes[prod.id] || sizeOptions[prod.id]?.[0] || 'Standard';
    const color = customColor || colors[prod.id] || colorOptions[prod.id]?.[0]?.name || 'Default';
    const sleeve = customSleeve || sleeves[prod.id] || sleeveOptions[prod.id]?.[0] || '-';
    const design = customDesign || designs[prod.id] || designOptions[prod.id]?.[0] || '-';
    const cartId = `${prod.id}-${size}-${color}-${sleeve}-${design}`;
    const stock = getVariantStock(prod.id, size, color, sleeve, design);

    if (stock <= 0) {
      setScanTestResult(`GAGAL: Varian "${prod.name} (${size} - ${color} - ${sleeve} - ${design})" habis stok.`);
      return;
    }

    const finalPrice = getCalculatedPrice(prod, size, color, sleeve, design);

    setCart(prev => {
      const existing = prev.find(item => item.cartId === cartId);
      if (existing) {
        if (existing.quantity >= stock) {
          setScanTestResult(`Peringatan: Jumlah di keranjang sudah mencapai batas stok (${stock}) untuk varian ini.`);
          return prev;
        }
        return prev.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        productId: prod.id,
        cartId,
        size,
        color,
        sleeve,
        design,
        code: prod.sku,
        name: prod.name,
        price: finalPrice,
        quantity: 1,
        discount: 0,
        stock: stock
      }];
    });
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQ = item.quantity + delta;
        const stock = getVariantStock(item.productId, item.size, item.color, item.sleeve, item.design);
        if (newQ > stock) {
          setScanTestResult(`Peringatan: Jumlah melebihi stok yang tersedia (${stock}) untuk varian ini.`);
          return item;
        }
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Invoice calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = isDiscountApplied && subtotal > 0 ? Math.min(discountValue, subtotal) : 0;
  const taxAmount = Math.round((subtotal - discountAmount) * 0.11); // 11% PPN
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);
  const change = Math.max(0, amountReceived - grandTotal);

  // Apply promo vouchers
  const applyDiscount = () => {
    const matchingPromo = promos.find(p => p.code.toUpperCase() === discountCode.trim().toUpperCase());
    if (matchingPromo) {
      setIsDiscountApplied(true);
      if (matchingPromo.type === 'flat') {
        setDiscountValue(matchingPromo.value);
      } else {
        setDiscountValue(Math.round(subtotal * (matchingPromo.value / 100)));
      }
    } else {
      setIsDiscountApplied(false);
      setDiscountValue(0);
    }
  };

  // Recalculate discount whenever subtotal changes to keep percentage-based discounts in sync
  useEffect(() => {
    if (isDiscountApplied) {
      const matchingPromo = promos.find(p => p.code.toUpperCase() === discountCode.trim().toUpperCase());
      if (matchingPromo && matchingPromo.type === 'percentage') {
        setDiscountValue(Math.round(subtotal * (matchingPromo.value / 100)));
      }
    }
  }, [subtotal, promos, discountCode, isDiscountApplied]);

  // Simulating live barcode hardware gun scan
  const handleScanBarcode = () => {
    setScannerActive(true);
    setScanMessage('Memindai barcode dari sensor kamera...');
    setTimeout(() => {
      const pool = filteredProducts.length > 0 ? filteredProducts : localProducts;
      const randomProd = pool[Math.floor(Math.random() * pool.length)];
      if (randomProd) {
        const randomSizes = sizeOptions[randomProd.id] || ["Standard"];
        const randomColors = colorOptions[randomProd.id] || [{ name: "Default", hex: "#cccccc" }];
        const randomSleeves = sleeveOptions[randomProd.id] || ["-"];
        const randomDesigns = designOptions[randomProd.id] || ["-"];
        const chosenSize = randomSizes[Math.floor(Math.random() * randomSizes.length)];
        const chosenColor = randomColors[Math.floor(Math.random() * randomColors.length)].name;
        const chosenSleeve = randomSleeves[Math.floor(Math.random() * randomSleeves.length)];
        const chosenDesign = randomDesigns[Math.floor(Math.random() * randomDesigns.length)];
        
        addToCart(randomProd, chosenSize, chosenColor, chosenSleeve, chosenDesign);
        setScanMessage(`SUKSES! Terdeteksi SKU ${randomProd.sku} (${randomProd.name})`);
        
        if (scannerBeepVolume !== 'off') {
          try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            osc.frequency.setValueAtTime(1400, context.currentTime);
            osc.connect(context.destination);
            osc.start();
            osc.stop(context.currentTime + 0.12);
          } catch (e) {}
        }
        
        setTimeout(() => {
          setScannerActive(false);
          setScanMessage('');
        }, 800);
      }
    }, 1200);
  };

  const handleCheckout = () => {
    if (!shiftActive) {
      showHardwareToast('Transaksi Diblokir', 'Silakan buka shift kasir terlebih dahulu sebelum memulai transaksi POS.', 'warning');
      return;
    }
    if (cart.length === 0) return;

    const checkoutOrderNo = `POS-${Date.now().toString().slice(-6)}`;

    cart.forEach(item => {
      const prod = localProducts.find(p => p.id === item.productId);
      
      // Decrease variant stock in context and local
      const currentStock = getVariantStock(item.productId, item.size, item.color, item.sleeve, item.design);
      const newStock = Math.max(0, currentStock - item.quantity);
      setVariantStockValue(item.productId, item.size, item.color, item.sleeve, item.design, newStock);

      // Decrement the base stock in global state/Firestore & log stock movement
      updateProductStock(item.productId, -item.quantity, checkoutOrderNo);

      // Also update the base localProducts list stockQuantity to match for high visual sync
      setLocalProducts(prev => prev.map(p => {
        if (p.id === item.productId) {
          return { ...p, stockQuantity: Math.max(0, p.stockQuantity - item.quantity) };
        }
        return p;
      }));

      addMarketplaceOrder({
        orderNumber: checkoutOrderNo,
        channel: 'POS Retail',
        customerName,
        customerPhone: '+62 812-0000-0000',
        orderDate: new Date().toISOString().substring(0, 16).replace('T', ' '),
        skuCode: item.code,
        productName: `${item.name} (${item.size} - ${item.color} - ${item.sleeve} - ${item.design})`,
        quantity: item.quantity,
        unitPrice: item.price,
        grossAmount: item.price * item.quantity,
        voucherDiscount: Math.round(discountAmount / cart.length),
        marketplaceAdminFee: 0,
        adsCost: 0,
        shippingFee: 0,
        cogs: (prod ? prod.unitCostPrice : 0) * item.quantity,
        status: 'Selesai',
        paymentMethod
      });
    });

    setReceiptModal({
      items: cart,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      customerName,
      paymentMethod,
      amountReceived: paymentMethod === 'Cash' ? amountReceived : grandTotal,
      change: paymentMethod === 'Cash' ? change : 0,
      orderNo: checkoutOrderNo
    });

    setShiftTotalSales(prev => prev + grandTotal);
    setCart([]);
  };

  // High fidelity vector representations for products
  const renderProductMock = (p: any) => {
    // If customized base64 logo or photo exists
    if (p.imageUrl) {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800">
          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute top-2.5 right-2.5 bg-rose-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wide">NEW</div>
        </div>
      );
    }

    const preset = p.presetStyle || 'PROD-101';

    if (preset === 'PROD-101') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-tr from-amber-500/10 to-amber-600/5 dark:from-amber-950/20 dark:to-slate-900 rounded-2xl border border-amber-500/10 shadow-inner group-hover:scale-105 transition-transform duration-300">
          <div className="absolute top-2.5 right-2.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wide">Serum</div>
          <div className="w-14 h-24 bg-gradient-to-b from-amber-400 to-amber-600 rounded-t-xl rounded-b-2xl shadow-md relative flex flex-col items-center justify-between p-2 border border-amber-300/30">
            <div className="w-6 h-2.5 bg-slate-800 rounded-t-md shadow-xs"></div>
            <div className="w-1.5 h-3.5 bg-slate-400"></div>
            <div className="flex-1 w-full flex items-center justify-center">
              <span className="text-[9px] font-black text-amber-950 tracking-tighter bg-white/70 px-1 rounded-sm leading-none">VIT-C</span>
            </div>
            <div className="w-full text-center text-[7px] font-bold text-white/90">50ml</div>
          </div>
        </div>
      );
    }
    if (preset === 'PROD-102') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-tr from-sky-500/10 to-blue-600/5 dark:from-sky-950/20 dark:to-slate-900 rounded-2xl border border-sky-500/10 shadow-inner group-hover:scale-105 transition-transform duration-300">
          <div className="absolute top-2.5 right-2.5 bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wide">SPF50</div>
          <div className="w-14 h-24 bg-gradient-to-b from-sky-400 to-blue-600 rounded-xl shadow-md relative flex flex-col items-center justify-between p-2 border border-sky-300/30">
            <div className="w-8 h-2 bg-slate-800 rounded-t-sm"></div>
            <div className="flex-1 w-full flex flex-col items-center justify-center gap-0.5">
              <span className="text-[9px] font-black text-sky-950 tracking-tighter bg-white/70 px-1 rounded-sm leading-none">AQUA</span>
              <span className="text-[6px] font-black text-white/95 tracking-wide">SUNSCREEN</span>
            </div>
            <div className="w-full text-center text-[7px] font-bold text-white/90">100ml</div>
          </div>
        </div>
      );
    }
    if (preset === 'PROD-103') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-tr from-rose-500/10 to-rose-600/5 dark:from-rose-950/20 dark:to-slate-900 rounded-2xl border border-rose-500/10 shadow-inner group-hover:scale-105 transition-transform duration-300">
          <div className="absolute top-2.5 right-2.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wide">Cream</div>
          <div className="w-16 h-18 bg-gradient-to-b from-rose-400 to-rose-600 rounded-2xl shadow-md relative flex flex-col items-center justify-between p-2 border border-rose-300/30">
            <div className="w-12 h-3 bg-slate-100 rounded-md shadow-inner border border-rose-200"></div>
            <div className="flex-1 w-full flex items-center justify-center">
              <span className="text-[8px] font-black text-rose-950 tracking-tighter bg-white/70 px-1 rounded-sm leading-none">REPAIR</span>
            </div>
            <div className="w-full text-center text-[7px] font-bold text-white/90">30g</div>
          </div>
        </div>
      );
    }
    // Default dynamic bundles/sets mockup
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-500/10 to-purple-600/5 dark:from-purple-950/20 dark:to-slate-900 rounded-2xl border border-purple-500/10 shadow-inner group-hover:scale-105 transition-transform duration-300">
        <div className="absolute top-2.5 right-2.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wide">Bundle</div>
        <div className="flex gap-1.5 items-end">
          <div className="w-9 h-14 bg-gradient-to-b from-purple-400 to-purple-600 rounded-xl shadow-md relative flex flex-col items-center justify-end p-1 border border-purple-300/30">
            <span className="text-[6px] font-black text-white/90">GLOW</span>
          </div>
          <div className="w-11 h-18 bg-gradient-to-b from-pink-400 to-pink-600 rounded-xl shadow-md relative flex flex-col items-center justify-end p-1 border border-pink-300/30">
            <span className="text-[6px] font-black text-white/90">SET</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pos-retail-view-component-container relative">
      {/* Floating Hardware Toast Notification Popup */}
      {hardwareToast && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-slate-950/95 dark:bg-white text-white dark:text-slate-950 px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-200 flex items-start gap-3.5 animate-in slide-in-from-top-4 fade-in duration-300 backdrop-blur-md">
          <div className={`p-2 rounded-xl mt-0.5 ${hardwareToast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : hardwareToast.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
            {hardwareToast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="font-extrabold text-xs tracking-tight">{hardwareToast.title}</h4>
            <p className="text-[11px] opacity-90 leading-relaxed font-medium">{hardwareToast.desc}</p>
          </div>
          <button 
            onClick={() => setHardwareToast(null)}
            className="text-slate-400 hover:text-white dark:hover:text-slate-900 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      <RoleAccessBanner moduleName="POS Kasir Retail & Hardware Integrations" />

      {/* Primary Tab Navigation Controller */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-900 px-4 md:px-6 py-4 rounded-3xl border border-slate-200/50 dark:border-slate-850 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            title="Kembali ke Order Management"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
              Kasir Retail POS
            </h1>
            <p className="text-[11px] text-slate-500">Device Terminal #01-A • Active Operator</p>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-slate-850">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'terminal'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-rose-600" />
            <span>Kasir Terminal</span>
          </button>
          <button
            onClick={() => setActiveTab('management')}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'management'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-500" />
            <span>Manajemen & Koneksi</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            <List className="w-4 h-4 text-emerald-500" />
            <span>Laporan Penjualan</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('management');
            }}
            className="px-3.5 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 ml-1 cursor-pointer"
            title="Akhiri / Tutup Shift Kasir"
          >
            <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">Akhiri Shift</span>
          </button>
          <button
            onClick={() => setGlobalActiveTab('inventory_products')}
            className="px-3.5 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 ml-1 cursor-pointer"
            title="Buka Katalog Produk & Stok Inventaris"
          >
            <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Katalog & Stok</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CASHIER TERMINAL GRID VIEW */}
      {activeTab === 'terminal' && (
        <div className="space-y-4 relative">
          {!shiftActive && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md z-45 rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 min-h-[550px] overflow-hidden">
              <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 relative z-50">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
                  <Lock className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Shift Kasir Belum Dibuka!</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Silakan buka shift kasir terlebih dahulu dan tentukan Modal Awal Kas untuk memulai transaksi penjualan di POS Retail.
                  </p>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl space-y-3 border border-slate-100 dark:border-slate-850 text-left">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Kasir / Operator</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{shiftCashierName}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase">Atur Modal Awal Kas (Manual)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                      <input
                        type="number"
                        value={shiftStartingCash}
                        onChange={(e) => setShiftStartingCash(Number(e.target.value) || 0)}
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShiftActive(true);
                    showHardwareToast('Shift Kasir Dibuka', `Berhasil membuka shift dengan modal awal ${formatIDR(shiftStartingCash)}.`, 'success');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Buka Shift Kasir Sekarang</span>
                </button>
              </div>
            </div>
          )}
          {/* Mobile & Tablet View Switcher (< lg screens) */}
          <div className="flex lg:hidden bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setMobileViewTab('catalog')}
              className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                mobileViewTab === 'catalog'
                  ? 'bg-white dark:bg-slate-850 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4 text-rose-600" />
              <span>Katalog Produk</span>
            </button>
            <button
              onClick={() => setMobileViewTab('cart')}
              className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 relative ${
                mobileViewTab === 'cart'
                  ? 'bg-white dark:bg-slate-850 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span>Keranjang ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: Catalog panel (Visible on lg, or mobile when catalog tab active) */}
            <div className={`lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4 shadow-sm flex-col gap-4 ${
              mobileViewTab === 'catalog' ? 'flex' : 'hidden lg:flex'
            }`}>
              
              {/* Header Area */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Pilih Produk POS Retail</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Pilih varian size & warna lalu tambahkan ke keranjang</p>
                  </div>

                  {/* Warehouse Selector Pill */}
                  <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200/80 dark:border-rose-800/60 shadow-2xs">
                    <Building2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300">Gudang POS:</span>
                    <select
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="Gudang BUDP" className="bg-white dark:bg-slate-900 font-bold">Gudang BUDP (POS Primary)</option>
                      <option value="Gudang Utama Cikarang" className="bg-white dark:bg-slate-900 font-bold">Gudang Utama Cikarang</option>
                      <option value="Gudang Transit Jakarta" className="bg-white dark:bg-slate-900 font-bold">Gudang Transit Jakarta</option>
                      <option value="all" className="bg-white dark:bg-slate-900 font-bold">Semua Gudang (All Warehouses)</option>
                    </select>
                  </div>
                </div>

                {/* Tools and triggers */}
                <div className="flex items-center gap-2 flex-1 md:max-w-md md:justify-end">
                  <div className="relative flex-1 max-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari Produk..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800 focus:border-rose-500 rounded-xl text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleScanBarcodeWithCheck}
                    className="px-3 py-2 text-[11px] font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border bg-slate-950 hover:bg-slate-900 text-white border-transparent"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Scan</span>
                  </button>
                  <button
                    onClick={() => setShowHardwareSettingsModal(true)}
                    className="px-3 py-2 text-[11px] font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Alat Kasir</span>
                  </button>
                </div>
              </div>

              {/* Dynmic Category Selection & Removals Row */}
              <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
                <div className="bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center gap-1.5 min-w-max">
                  
                  {/* Fixed All Products Trigger */}
                  <button
                    onClick={() => setSelectedCategory('All Products')}
                    className={`px-3 py-2 text-xs rounded-lg font-black transition-all ${
                      selectedCategory === 'All Products'
                        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs border border-slate-200/40 dark:border-slate-800'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    All Products
                  </button>

                  {/* Dynamic Category List with quick deletions */}
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedCategory.toLowerCase() === cat.toLowerCase()
                          ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs border-slate-200/40 dark:border-slate-800'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border-transparent'
                      }`}
                    >
                      <button 
                        onClick={() => setSelectedCategory(cat)}
                        className="focus:outline-none"
                      >
                        {cat}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-0.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                        title={`Hapus kategori ${cat}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  {/* Inline Quick Add Category Trigger */}
                  <form onSubmit={handleAddCategory} className="flex items-center gap-1 pl-1.5 ml-1.5 border-l border-slate-200/80 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Kategori baru..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-[10px] focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-bold"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                      title="Tambah Kategori"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </form>

                </div>
              </div>

              {/* Catalog Grid View */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[62vh] overflow-y-auto pr-1">
                
                {/* Special Quick Add Product Inline card trigger */}
                <div 
                  onClick={() => setShowProductModal(true)}
                  className="group bg-slate-50/40 dark:bg-slate-950/20 border-2 border-dashed border-slate-200 hover:border-indigo-500/50 dark:border-slate-850 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-1.5 cursor-pointer hover:shadow-inner transition-all min-h-[170px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[11px] text-slate-900 dark:text-white">Tambah Produk</h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Kustomisasi & tambah produk POS
                    </p>
                  </div>
                </div>

                {filteredProducts.map((p, idx) => {
                  const catalogData = getCatalogVariantData(p);
                  const pSizes = catalogData.sizes;
                  const pColors = catalogData.models;
                  const pSleeves = sleeveOptions[p.id] || ["-"];
                  const pDesigns = designOptions[p.id] || ["-"];

                  const currentSize = sizes[p.id] || pSizes[0];
                  const currentColorName = colors[p.id] || pColors[0].name;
                  const currentSleeve = sleeves[p.id] || pSleeves[0];
                  const currentDesign = designs[p.id] || pDesigns[0];

                  const variantBarcode = getDeterministicEAN13(p.sku, currentSize, currentColorName, currentSleeve, currentDesign, p.id);
                  const variantStock = getVariantStock(p.id, currentSize, currentColorName, currentSleeve, currentDesign);
                  const calculatedPrice = getCalculatedPrice(p, currentSize, currentColorName, currentSleeve, currentDesign);

                  return (
                    <div
                      key={`${p.id}-${p.sku || ''}-${idx}`}
                      className="group bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-850 hover:border-rose-500/40 hover:shadow-md transition-all flex flex-col justify-between gap-2.5"
                    >
                      {/* Visual mockup rendering */}
                      <div className="h-20 w-full">
                        {renderProductMock(p)}
                      </div>

                      {/* Meta labels */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{p.category}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold border ${
                            variantStock <= 0 
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' 
                              : variantStock < 10 
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' 
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                          }`}>
                            Stok: {variantStock}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-rose-600 transition-colors">
                          {p.name}
                        </h4>
                      </div>

                      {/* Interactive attribute selection */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Size Selection */}
                          {pSizes[0] !== "-" && (
                            <div className="space-y-0.5">
                              <label className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{customVariantNames[p.id]?.[0] || 'Ukuran'}</label>
                              <select
                                value={currentSize}
                                onChange={(e) => setSizes(prev => ({ ...prev, [p.id]: e.target.value }))}
                                className="w-full text-[10px] font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                              >
                                {pSizes.map(sz => {
                                  const extra = sizeExtraPrices[p.id]?.[sz] || 0;
                                  return (
                                    <option key={`${p.id}-${sz}`} value={sz}>
                                      {sz} {extra > 0 ? `(+${formatIDR(extra).replace('Rp\u00a0', '')})` : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          )}

                          {/* Color Selection */}
                          {pColors[0].name !== "-" && (
                            <div className="space-y-0.5">
                              <label className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{customVariantNames[p.id]?.[1] || 'Warna'}</label>
                              <select
                                value={currentColorName}
                                onChange={(e) => setColors(prev => ({ ...prev, [p.id]: e.target.value }))}
                                className="w-full text-[10px] font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                              >
                                {pColors.map(col => {
                                  const extra = colorExtraPrices[p.id]?.[col.name] || 0;
                                  return (
                                    <option key={`${p.id}-${col.name}`} value={col.name}>
                                      {col.name} {extra > 0 ? `(+${formatIDR(extra).replace('Rp\u00a0', '')})` : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* INDONESIAN EAN-13 AUTOMATIC VARIANT BARCODE - COLLAPSIBLE DETAILS DISCLOSURE */}
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-850">
                          <details className="text-[10px] text-slate-500 dark:text-slate-400 group/barcode select-none cursor-pointer">
                            <summary className="list-none flex items-center justify-between text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1 hover:text-indigo-600 transition-colors">
                              <span>Barcode & Kode Variasi</span>
                              <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 transition-transform">▼</span>
                            </summary>
                            <div className="space-y-1 pt-1.5 border-t border-slate-100/50 dark:border-slate-800/40 mt-1 animate-in fade-in slide-in-from-top-1 duration-250">
                              <div 
                                onClick={() => handleBarcodeClick(variantBarcode)}
                                className="cursor-pointer hover:ring-2 hover:ring-rose-500/50 rounded-xl transition-all"
                                title="Klik untuk mensimulasikan scan laser barcode varian ini"
                              >
                                <BarcodeVisual code={variantBarcode} />
                              </div>
                              <div className="text-[9px] text-slate-500 font-bold text-center pt-1 border-t border-slate-100/30 dark:border-slate-800/20 font-mono">
                                Kode Variasi: <span className="text-emerald-600 dark:text-emerald-400">{variantBarcode}</span>
                              </div>
                            </div>
                          </details>
                        </div>

                      </div>

                      {/* Card Actions Footer */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 block font-medium">SKU: {p.sku}</span>
                          <span className="font-black text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                            {formatIDR(calculatedPrice)}
                          </span>
                        </div>
                        <button
                          onClick={() => addToCart(p, currentSize, currentColorName, currentSleeve, currentDesign)}
                          disabled={variantStock <= 0}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer ${
                            variantStock <= 0 
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none' 
                              : 'bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950'
                          }`}
                          title={variantStock <= 0 ? 'Stok varian habis' : 'Tambah ke Keranjang Kasir'}
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* RIGHT COLUMN: Real-time Cart and Payment Billing Panel (Visible on lg, or mobile when cart tab active) */}
            <div className={`bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4 shadow-md flex-col gap-4 ${
              mobileViewTab === 'cart' ? 'flex' : 'hidden lg:flex'
            }`}>
              
              {/* Header / Meta */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Detail Keranjang</h3>
                    <p className="text-[10px] text-slate-500">List belanja aktif kasir retail</p>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                      <span>Hapus Semua</span>
                    </button>
                  )}
                </div>

                {/* Cart Counters Info Bar */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 px-1">
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} Item Terpilih</span>
                  <span className="text-slate-400 font-normal">Antrean: {customerName}</span>
                </div>

                {/* Scrollable Shopping List */}
                <div className="space-y-2.5 max-h-[32vh] overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">Keranjang kosong. Pilih produk atau scan barcode produk.</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div 
                        key={item.cartId} 
                        className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850/80 flex items-center gap-3 relative hover:shadow-xs transition-shadow"
                      >
                        {/* Product Representation inside cart */}
                        <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 flex-shrink-0 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                          {item.productId.includes('NEW') ? 'CUSTOM' : item.productId.substring(0, 8)}
                        </div>

                        {/* Info & Configurations details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-950 dark:text-white truncate leading-tight">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                            <span>Varian: <strong className="text-slate-600 dark:text-slate-300">{item.size} • {item.color}</strong></span>
                          </p>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block mt-1">{formatIDR(item.price)}</span>
                        </div>

                        {/* Quantity Modifier counters */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200/60 dark:border-slate-800">
                          <button 
                            onClick={() => updateQuantity(item.cartId, -1)} 
                            className="p-1.5 text-slate-500 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 rounded-lg cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold font-mono px-2 text-slate-950 dark:text-white">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.cartId, 1)} 
                            className="p-1.5 text-slate-500 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 rounded-lg cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Delete Action Button */}
                        <button 
                          onClick={() => removeFromCart(item.cartId)} 
                          className="p-2 text-slate-300 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          title="Hapus item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Calculations & Settings invoice form */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-3">
                
                {/* Customer ID field */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Nama Pelanggan / Antrean</label>
                  <input
                    type="text"
                    placeholder="Walk-in Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl focus:border-rose-500 text-slate-900 dark:text-white font-bold focus:outline-none placeholder-slate-400 shadow-inner"
                  />
                </div>

                {/* Payment Methods */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod('Cash')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                        paymentMethod === 'Cash' 
                          ? 'bg-rose-500 border-rose-500 text-white shadow-md' 
                          : 'bg-white dark:bg-slate-950 border-slate-200/50 dark:border-slate-850 text-slate-500 hover:border-rose-200'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span className="text-xs font-black">Cash</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                        paymentMethod === 'QRIS' 
                          ? 'bg-rose-500 border-rose-500 text-white shadow-md' 
                          : 'bg-white dark:bg-slate-950 border-slate-200/50 dark:border-slate-850 text-slate-500 hover:border-rose-200'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="text-xs font-black">QRIS</span>
                    </button>
                  </div>
                </div>

                {/* Cash Calculator */}
                {paymentMethod === 'Cash' && (
                  <div className="space-y-2.5 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-850 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Uang Diterima</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Rp</span>
                        <input
                          type="number"
                          value={amountReceived || ''}
                          onChange={(e) => setAmountReceived(Number(e.target.value))}
                          placeholder="0"
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl focus:border-rose-500 text-slate-950 dark:text-white font-black focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Kembalian</span>
                      <span className={`text-xs font-black ${change > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {formatIDR(change)}
                      </span>
                    </div>

                    {/* Quick Amounts */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[50000, 100000, 200000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setAmountReceived(amt)}
                          className="py-1.5 text-[10px] font-black bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
                        >
                          {amt/1000}k
                        </button>
                      ))}
                      <button
                        onClick={() => setAmountReceived(grandTotal)}
                        className="col-span-3 py-1.5 text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all"
                      >
                        Uang Pas ({formatIDR(grandTotal)})
                      </button>
                    </div>
                  </div>
                )}

                {/* Promo Code Validation Settings inline */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Kode Kupon Promo</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Masukkan Kode Kupon..."
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl focus:border-rose-500 text-slate-900 dark:text-white font-black focus:outline-none placeholder-slate-400"
                      />
                      {isDiscountApplied && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500">
                          <CheckCircle2 className="w-4 h-4 fill-emerald-500/10" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={applyDiscount}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Klaim
                    </button>
                  </div>
                  {isDiscountApplied && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                        <span>Kupon Aktif: {discountCode.toUpperCase()}</span>
                      </span>
                      <span>-{formatIDR(discountValue)}</span>
                    </div>
                  )}
                </div>

                {/* Invoice Breakdown calculation summary */}
                <div className="space-y-2.5 text-xs pt-2.5 border-t border-slate-100 dark:border-slate-850">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Total Harga Produk</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-slate-200">{formatIDR(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-rose-500">
                    <span className="font-medium">Potongan Diskon</span>
                    <span className="font-bold font-mono">-{formatIDR(discountAmount)}</span>
                  </div>

                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span className="font-medium">PPN Pajak (11%)</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-slate-200">{formatIDR(taxAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-950 dark:text-white pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800">
                    <span className="font-extrabold text-sm tracking-tight">Grand Total</span>
                    <span className="font-black text-lg text-slate-950 dark:text-white font-mono tracking-tight">
                      {formatIDR(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Payment trigger action */}
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-950 hover:from-slate-850 hover:to-slate-900 dark:from-slate-100 dark:to-white dark:text-slate-950 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-98 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Bayar Transaksi Sekarang</span>
                </button>
              </div>

            </div>

          </div>

          {/* Floating Mobile Cart Summary Bar (< lg screens when cart has items) */}
          {cart.length > 0 && mobileViewTab === 'catalog' && (
            <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden bg-slate-950 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-800 animate-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block">{cart.reduce((s, i) => s + i.quantity, 0)} Item di Keranjang</span>
                <span className="text-sm font-black font-mono text-white">{formatIDR(grandTotal)}</span>
              </div>
              <button
                onClick={() => setMobileViewTab('cart')}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buka Keranjang & Bayar</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: MANAGEMENT & HARDWARE CONNECTIONS DECK */}
      {activeTab === 'management' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 0. LIVE PRINTER & SCANNER STATUS (WebUSB & Web Bluetooth Monitor) */}
          <div className="md:col-span-2 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                  <Wifi className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base tracking-tight">Status Perangkat Hardware (WebUSB & Web Bluetooth API)</h3>
                  <p className="text-xs text-indigo-200/80">Monitor real-time koneksi fisik Printer Thermal, Barcode Scanner, dan EDC</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => hardwareMonitor.requestWebUSBDevice()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Pair WebUSB Device</span>
                </button>
                <button
                  onClick={() => hardwareMonitor.requestWebBluetoothDevice()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Wifi className="w-4 h-4" />
                  <span>Pair Bluetooth</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hardwareMonitor.devices.map(dev => (
                <div key={dev.id} className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-indigo-300 font-bold uppercase">{dev.interfaceType}</span>
                    <button
                      onClick={() => hardwareMonitor.toggleDeviceStatus(dev.id)}
                      className={`w-3 h-3 rounded-full ${dev.status === 'connected' ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-500'}`}
                      title={dev.status === 'connected' ? 'Klik untuk memutuskan' : 'Klik untuk menyambungkan'}
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-xs text-white leading-snug">{dev.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{dev.details || 'Siap digunakan'}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
                    <span className="font-bold text-slate-300 uppercase">{dev.status}</span>
                    <span className="text-indigo-400 font-extrabold capitalize">{dev.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 1. THERMAL PRINTER HARDWARE CONFIGURATOR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${printerConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Printer Thermal Kasir</h3>
                  <p className="text-[11px] text-slate-500">Koneksi printer cetak struk kasir retail</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${printerConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                <span className="text-[10px] font-black uppercase text-slate-400">
                  {printerConnected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
            </div>

            {/* Connection Toggle & Selectors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Koneksi Driver</span>
                <button 
                  onClick={() => handleTogglePrinter(!printerConnected)}
                  className="focus:outline-none"
                >
                  {printerConnected ? (
                    <ToggleRight className="w-10 h-10 text-emerald-500 cursor-pointer" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-400 cursor-pointer" />
                  )}
                </button>
              </div>

              {/* Universal Printer Brand & Model Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Merek & Model Printer Thermal (Universal)</label>
                <select
                  value={printerModelName}
                  onChange={(e) => setPrinterModelName(e.target.value)}
                  disabled={!printerConnected}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                >
                  <option value="Universal ESC/POS (Semua Merek / All Models)">Universal ESC/POS (Semua Merek / All Models)</option>
                  <option value="Epson TM-T82 / TM-T88VI (ESC/POS High Speed)">Epson TM-T82 / TM-T88VI / TM-U220</option>
                  <option value="Xprinter XP-58IIH / XP-80C / XP-Q200">Xprinter XP-58IIH / XP-80C / XP-Q200</option>
                  <option value="Goojprt PT-210 / MTP-3 / JP-58H">Goojprt PT-210 / MTP-3 / JP-58H Bluetooth</option>
                  <option value="Zjiang ZJ-5809 / ZJ-8220 / ZJ-5890K">Zjiang ZJ-5809 / ZJ-8220 / ZJ-5890K</option>
                  <option value="RPP02 / RPP300 Mobile Thermal">RPP02 / RPP300 Mobile Thermal Printer</option>
                  <option value="Citizen CT-S310II / CMP-20II">Citizen CT-S310II / CMP-20II</option>
                  <option value="Star Micronics TSP100 / SM-L200">Star Micronics TSP100 / SM-L200</option>
                  <option value="Bixolon SRP-350III / SPP-R200III">Bixolon SRP-350III / SPP-R200III</option>
                  <option value="EPPOS EP-58 / EP-80 Series">EPPOS EP-58 / EP-80 Series</option>
                  <option value="Panda PR-58 / PR-80 / PR-EM58">Panda PR-58 / PR-80 / PR-EM58</option>
                  <option value="Rongta RP58 / RP80 / RPP300">Rongta RP58 / RP80 / RPP300</option>
                </select>
              </div>

              {/* Command Protocol Set */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Perintah Komunikasi (Command Set)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['ESC/POS', 'CPCL', 'StarPRNT', 'TSPL', 'Raw Hex Stream'] as const).map((proto) => (
                    <button
                      key={proto}
                      onClick={() => setPrinterCommandProtocol(proto)}
                      disabled={!printerConnected}
                      className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all ${
                        !printerConnected
                          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                          : printerCommandProtocol === proto
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {proto}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interface Port Type selection */}
              <div className="grid grid-cols-3 gap-2">
                {['USB', 'Bluetooth', 'WiFi'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPrinterType(type as any)}
                    disabled={!printerConnected}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      !printerConnected 
                        ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                        : printerType === type
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Width Specification Preset (80mm vs 58mm) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Lebar Kertas Cetak</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPrinterPaperSize('80mm')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      printerPaperSize === '80mm'
                        ? 'border-rose-500 bg-rose-500/5 text-slate-950 dark:text-white'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-850 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="font-extrabold text-xs">Standard (80mm)</span>
                    <span className="text-[10px] text-slate-400 mt-1">Sangat disarankan untuk invoice detail lengkap & logo PT</span>
                  </button>
                  <button
                    onClick={() => setPrinterPaperSize('58mm')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      printerPaperSize === '58mm'
                        ? 'border-rose-500 bg-rose-500/5 text-slate-950 dark:text-white'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-850 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="font-extrabold text-xs">Mini Slim (58mm)</span>
                    <span className="text-[10px] text-slate-400 mt-1">Hemat kertas thermal untuk struk transaksi cepat</span>
                  </button>
                </div>
              </div>

              {/* Custom Automatic Action toggler */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Cetak otomatis saat pembayaran sukses</span>
                <button 
                  onClick={() => setPrinterAutoPrint(!printerAutoPrint)}
                  className="focus:outline-none"
                >
                  {printerAutoPrint ? (
                    <ToggleRight className="w-10 h-10 text-rose-500 cursor-pointer" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-400 cursor-pointer" />
                  )}
                </button>
              </div>

              {/* simulated Calibration triggers */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-3">
                <button
                  onClick={runPrinterCalibrationWithCheck}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Uji Kalibrasi & Cetak Test Page (80mm)
                </button>
                {printerTestStatus && (
                  <p className="text-[10px] font-mono text-indigo-500 animate-pulse text-center">{printerTestStatus}</p>
                )}
              </div>

            </div>
          </div>

          {/* 2. BARCODE SCANNER HARDWARE CONFIGURATOR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${scannerConnected ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Alat Barcode Scanner</h3>
                  <p className="text-[11px] text-slate-500">Konfigurasi scan barcode kasir otomatis</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${scannerConnected ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                <span className="text-[10px] font-black uppercase text-slate-400">
                  {scannerConnected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
            </div>

            {/* Config options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Koneksi Scanner</span>
                <button 
                  onClick={() => handleToggleScanner(!scannerConnected)}
                  className="focus:outline-none"
                >
                  {scannerConnected ? (
                    <ToggleRight className="w-10 h-10 text-indigo-500 cursor-pointer" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-400 cursor-pointer" />
                  )}
                </button>
              </div>

              {/* Mode types */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mode Perangkat Scanner</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Camera', 'USB Gun', 'Bluetooth'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setScannerType(mode as any)}
                      disabled={!scannerConnected}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        !scannerConnected 
                          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                          : scannerType === mode
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Beep sound settings */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Volume Suara BEEP</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'high', label: 'Keras' },
                    { id: 'low', label: 'Pelan' },
                    { id: 'off', label: 'Sunyi' }
                  ].map((vol) => (
                    <button
                      key={vol.id}
                      onClick={() => setScannerBeepVolume(vol.id as any)}
                      disabled={!scannerConnected}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        scannerBeepVolume === vol.id
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {vol.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive test gun simulation form */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-3">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Uji Coba Tembakan Laser SKU</label>
                <form onSubmit={handleTestBarcodeScanWithCheck} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh SKU: SKU-1001, SKU-1002, dll"
                    value={scanTestInput}
                    onChange={(e) => setScanTestInput(e.target.value)}
                    disabled={!scannerConnected}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-indigo-500 focus:outline-none font-bold text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!scannerConnected}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40"
                  >
                    Simulasikan Scan
                  </button>
                </form>

                {/* Barcode Tools Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-850 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowBarcodeListModal(true)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <List className="w-4 h-4" />
                    List Barcode
                  </button>
                  <button
                    onClick={() => setShowBarcodePrintModal(true)}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print Label Barcode
                  </button>
                </div>
                {scanTestResult && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                    {scanTestResult}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 3. CASH DRAWER (LACI KASIR) HARDWARE CONFIGURATOR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${cashDrawerConnected ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Laci Kasir (Cash Drawer)</h3>
                  <p className="text-[11px] text-slate-500">Koneksi RJ11 printer thermal & sensor laci</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cashDrawerConnected ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                <span className="text-[10px] font-black uppercase text-slate-400">
                  {cashDrawerConnected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Laci Kasir</span>
                <button 
                  onClick={() => setCashDrawerConnected(!cashDrawerConnected)}
                  className="focus:outline-none"
                >
                  {cashDrawerConnected ? (
                    <ToggleRight className="w-10 h-10 text-amber-500 cursor-pointer" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-400 cursor-pointer" />
                  )}
                </button>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={runCashDrawerTest}
                  disabled={!cashDrawerConnected}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  Uji Buka Laci Kasir (ESC/POS Kick)
                </button>
                {cashDrawerTestStatus && (
                  <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold text-center animate-pulse">{cashDrawerTestStatus}</p>
                )}
              </div>
            </div>
          </div>

          {/* 4. EDC & QRIS PAYMENT GATEWAY SETUP */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${edcConnected ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Mesin EDC & QRIS Gateway</h3>
                  <p className="text-[11px] text-slate-500">Integrasi pembayaran non-tunai kasir retail</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${edcConnected ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                <span className="text-[10px] font-black uppercase text-slate-400">
                  {edcConnected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status EDC / QRIS</span>
                <button 
                  onClick={() => setEdcConnected(!edcConnected)}
                  className="focus:outline-none"
                >
                  {edcConnected ? (
                    <ToggleRight className="w-10 h-10 text-indigo-500 cursor-pointer" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-400 cursor-pointer" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Provider EDC</label>
                  <select
                    value={edcProvider}
                    onChange={(e) => setEdcProvider(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BCA">BCA EDC / QRIS</option>
                    <option value="Mandiri">Mandiri EDC</option>
                    <option value="QRIS">QRIS Universal (Midtrans/GoPay)</option>
                    <option value="EDC Android">EDC Android SmartPOS</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">ID Terminal</label>
                  <input
                    type="text"
                    value={edcTerminalId}
                    onChange={(e) => setEdcTerminalId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={runEdcTest}
                  disabled={!edcConnected}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  Test Ping Gateway EDC & QRIS
                </button>
                {edcTestStatus && (
                  <p className="text-[10px] font-mono text-indigo-500 font-bold text-center animate-pulse">{edcTestStatus}</p>
                )}
              </div>
            </div>
          </div>

          {/* 5. RECEIPT HEADER & FOOTER CUSTOMIZER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Kustomisasi Struk & Nota</h3>
                <p className="text-[11px] text-slate-500">Atur header nama toko dan pesan footer cetak</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nama Toko di Struk</label>
                <input
                  type="text"
                  value={receiptStoreTitle}
                  onChange={(e) => setReceiptStoreTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-black text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Alamat Toko / Cabang</label>
                <input
                  type="text"
                  value={receiptStoreAddress}
                  onChange={(e) => setReceiptStoreAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pesan Footer Struk</label>
                <textarea
                  value={receiptFooterMessage}
                  onChange={(e) => setReceiptFooterMessage(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* 6. SHIFT & CASHIER CLOSING RECONCILIATION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${shiftActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Manajemen Shift & Tutup Kasir</h3>
                  <p className="text-[11px] text-slate-500">Rekonsiliasi kas modal awal & tutup shift</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${shiftActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                {shiftActive ? 'Shift Aktif' : 'Shift Ditutup'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Operator / Kasir</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{shiftCashierName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Modal Awal Kas</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      value={shiftStartingCash}
                      onChange={(e) => setShiftStartingCash(Number(e.target.value) || 0)}
                      disabled={shiftActive}
                      className="w-full bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-indigo-500 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 focus:outline-none py-0 px-1 disabled:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Total Penjualan Shift Ini:</span>
                  <span className="font-mono text-slate-950 dark:text-white font-black">{formatIDR(shiftTotalSales)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Estimasi Kas di Laci (Modal + Tunai):</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">{formatIDR(shiftStartingCash + shiftTotalSales)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                {shiftActive ? (
                  showCloseShiftConfirm ? (
                    <div className="space-y-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
                      <p className="text-[11px] font-extrabold text-rose-800 dark:text-rose-400 text-center uppercase tracking-wider">Konfirmasi Tutup Shift?</p>
                      <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 text-center leading-relaxed">
                        Yakin ingin menutup shift kasir saat ini? Total penjualan akan direkonsiliasi.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setShiftActive(false);
                            setShowCloseShiftConfirm(false);
                            showHardwareToast('Shift Ditutup', 'Shift kasir berhasil ditutup. Rekonsiliasi kas tercatat.', 'info');
                          }}
                          className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] rounded-lg transition-all cursor-pointer text-center"
                        >
                          Ya, Tutup Shift
                        </button>
                        <button
                          onClick={() => setShowCloseShiftConfirm(false)}
                          className="py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-[10px] rounded-lg transition-all cursor-pointer text-center"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCloseShiftConfirm(true)}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm text-center"
                    >
                      Tutup Shift Kasir (End of Shift)
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => {
                      setShiftActive(true);
                      showHardwareToast('Shift Dibuka', `Shift kasir berhasil dibuka dengan modal awal ${formatIDR(shiftStartingCash)}.`, 'success');
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm text-center"
                  >
                    Buka Shift Kasir (Start Shift)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. PROMO CODE SETTINGS CONTROL CENTER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Promo & Voucher Kasir</h3>
                <p className="text-[11px] text-slate-500">Manajemen kode kupon aktif offline & retail</p>
              </div>
            </div>

            {/* Add Promo form */}
            <form onSubmit={handleAddPromo} className="space-y-3.5 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
              <span className="block text-[10px] font-black uppercase text-indigo-500">Buat Voucher Baru</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold block">Kode Kupon (Caps)</label>
                  <input
                    type="text"
                    placeholder="KU-10"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:border-amber-500 uppercase text-slate-900 dark:text-white font-extrabold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold block">Tipe Diskon</label>
                  <select
                    value={newPromoType}
                    onChange={(e) => setNewPromoType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="flat">Flat Rupiah (Rp)</option>
                    <option value="percentage">Persentase (%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold block">Nilai Potongan</label>
                  <input
                    type="number"
                    value={newPromoValue}
                    onChange={(e) => setNewPromoValue(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white font-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold block">Deskripsi Singkat</label>
                  <input
                    type="text"
                    placeholder="Contoh: Hemat Rp 10rb"
                    value={newPromoDesc}
                    onChange={(e) => setNewPromoDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Daftarkan Promo Baru
              </button>
            </form>

            {/* List of active promos */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Daftar Promo Kupon Aktif</label>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {promos.map((p) => (
                  <div 
                    key={p.code} 
                    className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border border-amber-500/20">{p.code}</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{p.description}</p>
                      <p className="text-[10px] text-slate-400">
                        Potongan: {p.type === 'flat' ? formatIDR(p.value) : `${p.value}%`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePromo(p.code)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Promo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3.5. CATEGORIES SETTINGS CONTROL CENTER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-4">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Manajemen Kategori POS</h3>
                <p className="text-[11px] text-slate-500">Kelola kategori produk retail untuk mempermudah pencarian</p>
              </div>
            </div>

            {/* Quick action to delete all categories */}
            <div className="flex items-center justify-between bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/20 rounded-2xl p-4">
              <div>
                <h4 className="text-xs font-black text-rose-600">Hapus Semua Kategori Bawaan</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Hapus kategori bawaan secara cepat untuk setup baju/variasi baru.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCategories([]);
                  setSelectedCategory('All Products');
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Hapus Semua
              </button>
            </div>

            {/* Add Category form */}
            <form onSubmit={handleAddCategory} className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
              <span className="block text-[10px] font-black uppercase text-indigo-500">Tambah Kategori Baru</span>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: Pakaian, Hijab, Kosmetik..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-bold"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </form>

            {/* List of active categories */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Daftar Kategori Aktif</label>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div 
                    key={cat} 
                    className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-[11px] text-slate-400 text-center py-4 font-semibold">Belum ada kategori. Silakan tambahkan kategori baru di atas.</p>
                )}
              </div>
            </div>
          </div>

          {/* 4. DYNAMIC PRODUCTS LIST & ADMIN MANAGEMENT */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Produk & Varian Aktif</h3>
                  <p className="text-[11px] text-slate-500">Total {localProducts.length} produk terdaftar dalam POS</p>
                </div>
              </div>
              <button
                onClick={() => setShowProductModal(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            {/* CSV BULK UPLOAD & TEMPLATE DOWNLOAD SECTION */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Aksi Massal Produk (CSV)</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Unggah produk dalam jumlah banyak terintegrasi barcode</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-rose-500" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-150 dark:border-slate-800/60">
                <div className="relative flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 rounded-xl p-4 transition-colors cursor-pointer bg-white dark:bg-slate-900/60">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleUploadCSV}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Unggah CSV"
                  />
                  <div className="text-center space-y-1 pointer-events-none">
                    <Upload className="w-5 h-5 mx-auto text-slate-400" />
                    <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Pilih atau Seret File CSV</p>
                    <p className="text-[10px] text-slate-400">File akan terintegrasi dengan kolom Barcode / SKU secara otomatis</p>
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-semibold">
                  ⚠️ {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-semibold">
                  ✅ {uploadSuccess}
                </div>
              )}
            </div>

            {/* List products with layout properties */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {localProducts.map((p, idx) => {
                const catalogData = getCatalogVariantData(p);
                const pSizes = catalogData.sizes;
                const pColors = catalogData.models;
                const pSleeves = sleeveOptions[p.id] || ["-"];
                const pDesigns = designOptions[p.id] || ["-"];
                const isExpanded = expandedProductId === p.id;

                return (
                  <div 
                    key={`${p.id}-${p.sku || ''}-${idx}`}
                    className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850/80 overflow-hidden transition-all duration-250 shadow-xs"
                  >
                    {/* Clickable Header Row */}
                    <div 
                      onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                      className="p-3.5 flex items-center gap-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/40 select-none transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200/40 text-[9px] font-bold text-slate-500 overflow-hidden shrink-0">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          'SKIN'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-950 dark:text-white truncate">{p.name}</h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProductClick(p);
                            }}
                            className="p-1 text-slate-300 hover:text-indigo-500 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer ml-auto"
                            title="Edit Produk"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmation({ id: p.id, name: p.name, type: 'product' });
                            }}
                            className="p-1 text-slate-300 hover:text-rose-500 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-600 rounded-md text-[8px] font-black uppercase">SKU: {p.sku}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          {p.category} • {pSizes[0] !== '-' ? `${pSizes.length} ${customVariantNames[p.id]?.[0] || 'Size'} ` : ''}{pColors[0].name !== '-' ? `• ${pColors.length} ${customVariantNames[p.id]?.[1] || 'Warna'} ` : ''}{pSleeves[0] !== '-' ? `• ${pSleeves.length} ${customVariantNames[p.id]?.[2] || 'Lengan'} ` : ''}{pDesigns[0] !== '-' ? `• ${pDesigns.length} ${customVariantNames[p.id]?.[3] || 'Desain'}` : ''}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3 shrink-0">
                        <div className="flex flex-col justify-center">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">{formatIDR(p.sellingPrice)}</span>
                          <span className="text-[9px] text-emerald-500 font-bold">Total Stok: {p.stockQuantity}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expandable Section: Variant Specific Barcodes & Stock Adjustment Controllers */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-3 bg-white dark:bg-slate-900/45 border-t border-slate-100 dark:border-slate-850/80 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                          <div>
                            <span className="text-[10px] font-black text-rose-600 block uppercase tracking-wider">Pusat Manajemen Varian & Barcode</span>
                            <p className="text-[9px] text-slate-400 mt-0.5">Kode variasi & barcode unik terintegrasi otomatis. Ubah stok varian di bawah ini.</p>
                          </div>
                        </div>

                        {/* Variants Stock & Barcode Grid list */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                          {pSizes.map((sz) => {
                            return pColors.flatMap((col) => {
                              const pSleeves = sleeveOptions[p.id] || ["-"];
                              const pDesigns = designOptions[p.id] || ["-"];
                              return pSleeves.flatMap((sl) => {
                                return pDesigns.map((ds) => {
                                  const variantBarcode = getDeterministicEAN13(p.sku, sz, col.name, sl, ds, p.id);
                                  const variantStock = getVariantStock(p.id, sz, col.name, sl, ds);

                                  return (
                                    <div 
                                      key={`${p.id}-${sz}-${col.name}-${sl}-${ds}`}
                                      className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/55 dark:border-slate-800/80 flex flex-col justify-between space-y-3"
                                    >
                                      {/* Variant title row */}
                                      <div className="flex flex-col space-y-1">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            {sz !== "-" && <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-850 text-slate-800 dark:text-slate-200 text-[9px] font-black rounded-md">{sz}</span>}
                                            {sz !== "-" && col.name !== "-" && <span className="text-slate-300 dark:text-slate-700 font-bold">|</span>}
                                            {col.name !== "-" && (
                                              <div className="flex items-center gap-1">
                                                <div className="w-2.5 h-2.5 rounded-full border border-slate-200 inline-block" style={{ backgroundColor: col.hex }} />
                                                <span className="text-[9px] text-slate-700 dark:text-slate-300 font-bold">{col.name}</span>
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-[8px] text-indigo-500 font-mono font-bold">EAN-13</span>
                                        </div>
                                        {(sl !== "-" || ds !== "-") && (
                                          <div className="text-[9px] text-slate-500 font-semibold leading-none mt-1">
                                            {sl !== "-" && <>{customVariantNames[p.id]?.[2] || 'Lengan'}: <span className="text-slate-800 dark:text-slate-200">{sl}</span></>}
                                            {sl !== "-" && ds !== "-" && " • "}
                                            {ds !== "-" && <>{customVariantNames[p.id]?.[3] || 'Desain'}: <span className="text-slate-800 dark:text-slate-200">{ds}</span></>}
                                          </div>
                                        )}
                                      </div>

                                      {/* High fidelity Barcode layout */}
                                      <div className="bg-white p-1 rounded-lg border border-slate-200/50 shadow-xs">
                                        <BarcodeVisual code={variantBarcode} />
                                      </div>

                                      {/* Stock control adjustments buttons */}
                                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/40">
                                        <span className="text-[10px] text-slate-400 font-bold">Kelola Stok:</span>
                                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                                          <button 
                                            type="button"
                                            onClick={() => adjustVariantStock(p.id, sz, col.name, sl, ds, -1)}
                                            className="w-5 h-5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer text-xs font-bold"
                                          >
                                            -
                                          </button>
                                          <span className="w-7 text-center text-xs font-black text-slate-950 dark:text-white">{variantStock}</span>
                                          <button 
                                            type="button"
                                            onClick={() => adjustVariantStock(p.id, sz, col.name, sl, ds, 1)}
                                            className="w-5 h-5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer text-xs font-bold"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              });
                            });
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: ADD / EDIT PRODUCT DIALOG (3-TAB SYSTEM) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 relative my-8">
            <button
              onClick={closeProductModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <ShoppingBag className="text-rose-600" />
                <span>{editingProductId ? 'Form Edit Produk POS Kasir' : 'Form Tambah SKU Produk Baru Ke POS'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Isi informasi utama, atur dimensi variasi dinamis (POS Kasir / Shopee style), dan tentukan stok & harga per varian.
              </p>
              {formError && (
                <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2">
                  <span>⚠️ {formError}</span>
                </div>
              )}
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
              {/* Searchable Product Catalog Picker Section (Only for new products) */}
              {!editingProductId && (
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">Pilih dari Katalog Inventaris Eksisting</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCatalogPicker(!showCatalogPicker)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {showCatalogPicker ? 'Sembunyikan Katalog' : '🔍 Buka Katalog (+)'}
                    </button>
                  </div>

                  {showCatalogPicker && (
                    <div className="space-y-3 pt-2">
                      <input
                        type="text"
                        placeholder="Cari berdasarkan nama produk atau SKU..."
                        value={catalogSearchQuery}
                        onChange={(e) => setCatalogSearchQuery(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                      />

                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {localProducts
                          .filter(p => 
                            p.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                            p.sku.toLowerCase().includes(catalogSearchQuery.toLowerCase())
                          )
                          .map((p, idx) => (
                            <div
                              key={`${p.id}-${p.sku || ''}-${idx}`}
                              onClick={() => handleSelectCatalogProduct(p)}
                              className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 cursor-pointer transition-all shadow-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                <div>
                                  <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{p.name}</h5>
                                  <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} • Stok: {p.stockQuantity}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-black text-rose-600 dark:text-rose-400 block">{formatIDR(p.sellingPrice)}</span>
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md inline-block mt-0.5">Pilih & Isi Otomatis</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: BASIC INFORMATION */}
              {editModalTab === 'basic' && (
                <div className="space-y-4 text-xs">
                  {/* Photo & Preset Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">Foto Produk</label>
                      <div className="relative border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-3 h-24 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 overflow-hidden">
                        {prodPhoto ? (
                          <img src={prodPhoto} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                        ) : (
                          <div className="space-y-1">
                            <Image className="w-5 h-5 text-slate-400 mx-auto" />
                            <span className="text-[9px] text-slate-500 font-bold block">Upload Gambar</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">Atau Pilih Preset Gambar Vector</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'PROD-101', name: 'Serum Orange', hex: 'bg-amber-400' },
                          { id: 'PROD-102', name: 'Sunscreen Blue', hex: 'bg-sky-400' },
                          { id: 'PROD-103', name: 'Cream Pink', hex: 'bg-rose-400' }
                        ].map((pre) => (
                          <button
                            key={pre.id}
                            type="button"
                            onClick={() => { setProdPhotoPreset(pre.id); setProdPhoto(''); }}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                              !prodPhoto && prodPhotoPreset === pre.id
                                ? 'border-indigo-500 bg-indigo-50/30 text-indigo-600'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full ${pre.hex}`}></span>
                            <span className="text-[9px] font-bold block leading-none">{pre.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Kode SKU Induk *</label>
                      <input
                        type="text"
                        required
                        value={prodSku}
                        onChange={(e) => setProdSku(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                        placeholder="Contoh: SKU-POS-105"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Nama Produk *</label>
                      <input
                        type="text"
                        required
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                        placeholder="Nama produk lengkap..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Category Selector with Manual Option */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">
                          Kategori Katalog
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCategoryInput(!isCustomCategoryInput);
                            setNewCategoryInputValue('');
                          }}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 cursor-pointer"
                        >
                          {isCustomCategoryInput ? '← Pilih dari List' : '+ Tambah Kategori Baru'}
                        </button>
                      </div>

                      {isCustomCategoryInput ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Ketik nama kategori baru..."
                            value={newCategoryInputValue}
                            onChange={(e) => {
                              setNewCategoryInputValue(e.target.value);
                              setProdCategory(e.target.value);
                            }}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newCategoryInputValue.trim()) {
                                const val = newCategoryInputValue.trim();
                                if (!customCategories.includes(val)) {
                                  setCustomCategories(prev => [...prev, val]);
                                }
                                setProdCategory(val);
                                setIsCustomCategoryInput(false);
                              }
                            }}
                            className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shrink-0 hover:bg-indigo-700 cursor-pointer"
                          >
                            Simpan
                          </button>
                        </div>
                      ) : (
                        <select
                          value={prodCategory}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomCategoryInput(true);
                              setNewCategoryInputValue('');
                            } else {
                              setProdCategory(e.target.value);
                            }
                          }}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        >
                          {Array.from(new Set([...categories, ...customCategories])).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="__ADD_NEW__" className="text-indigo-600 font-bold">+ Tambah Kategori Baru Manual...</option>
                        </select>
                      )}
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
                              setProdWarehouse(e.target.value);
                            }}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newWarehouseInputValue.trim()) {
                                const val = newWarehouseInputValue.trim();
                                if (!customWarehouses.includes(val)) {
                                  setCustomWarehouses(prev => [...prev, val]);
                                }
                                setProdWarehouse(val);
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
                          value={prodWarehouse}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomWarehouseInput(true);
                              setNewWarehouseInputValue('');
                            } else {
                              setProdWarehouse(e.target.value);
                            }
                          }}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        >
                          {['Gudang Utama Cikarang', 'Gudang Cabang Jakarta', 'Gudang Surabaya', ...customWarehouses].map(wh => (
                            <option key={wh} value={wh}>{wh}</option>
                          ))}
                          <option value="__ADD_NEW__" className="text-indigo-600 font-bold">+ Tambah Gudang Baru Manual...</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Safety Stock</label>
                      <input
                        type="number"
                        value={prodSafetyStock}
                        onChange={(e) => setProdSafetyStock(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Batas Minimal</label>
                      <input
                        type="number"
                        value={prodMinimumStock}
                        onChange={(e) => setProdMinimumStock(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Satuan Unit</label>
                      <select
                        value={prodUnit}
                        onChange={(e) => setProdUnit(e.target.value as any)}
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

                  {/* Pricing Base */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">HPP Unit (Rp)</label>
                      <input
                        type="number"
                        value={prodUnitCostPrice}
                        onChange={(e) => setProdUnitCostPrice(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Harga Jual Utama (Rp) *</label>
                      <input
                        type="number"
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-rose-600"
                      />
                    </div>
                  </div>

                  {/* Dynamic Variant Banner */}
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs text-indigo-900 dark:text-indigo-200 font-semibold">
                        Konfigurasi Varian: <strong className="font-mono text-indigo-700 dark:text-indigo-300">{editVariants.length} Kombinasi Varian</strong> akan dibuat.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditModalTab('dimensions')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      Lanjut Atur Dimensi ➔
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: DYNAMIC VARIANT DIMENSIONS */}
              {editModalTab === 'dimensions' && (
                <div className="space-y-4 text-xs">
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
                        onClick={() => handleApplyPresetTemplate('clear')}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 rounded-xl font-bold hover:bg-rose-100 cursor-pointer"
                      >
                        Kosongkan Atribut
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
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
                              onChange={(e) => handleUpdateDimensionGroupName(group.id, e.target.value)}
                              placeholder="Nama Dimensi (misal: Ukuran, Warna)..."
                              className="font-extrabold text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl w-full focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDimensionGroup(group.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

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
                                Belum ada opsi dimasukkan. Ketik nilai di atas lalu tekan Tambah.
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
                          <p className="text-xs text-slate-400">Produk ini saat ini dianggap sebagai produk tunggal.</p>
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

                  <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs text-blue-900 dark:text-blue-200 font-semibold">
                        Kombinasi Otomatis: <strong className="font-mono text-blue-700 dark:text-blue-300">{editVariants.length} Varian</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditModalTab('variants')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      Lanjut ke Atur Stok & Harga ➔
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: VARIANT GRID & BULK EDIT */}
              {editModalTab === 'variants' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Varian</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-base">{editVariants.length}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Stok</span>
                      <span className="font-mono font-black text-blue-600 text-base">
                        {editVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)} {prodUnit}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Potensi Nilai Jual</span>
                      <span className="font-mono font-black text-emerald-600 text-xs">
                        {formatIDR(editVariants.reduce((sum, v) => sum + ((Number(v.stock) || 0) * (Number(v.price) || 0)), 0))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 p-3.5 rounded-2xl border border-blue-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-900 dark:text-blue-300 text-xs">
                        Ubah Massal ({selectedVariantKeys.length > 0 ? `${selectedVariantKeys.length} Terpilih` : `Semua ${editVariants.length} Varian`})
                      </span>
                      {selectedVariantKeys.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedVariantKeys([])}
                          className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 cursor-pointer"
                        >
                          Batal Pilih
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-500 pl-1">HPP:</span>
                        <input
                          type="number"
                          placeholder="Rp..."
                          value={bulkCostVal}
                          onChange={(e) => setBulkCostVal(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleBulkApplyCost}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded-lg text-xs cursor-pointer"
                        >
                          Set
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-500 pl-1">Harga:</span>
                        <input
                          type="number"
                          placeholder="Rp..."
                          value={bulkPriceVal}
                          onChange={(e) => setBulkPriceVal(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleBulkApplyPrice}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg text-xs cursor-pointer"
                        >
                          Set
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-500 pl-1">Stok:</span>
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
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded-lg text-xs cursor-pointer"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari varian spesifik..."
                      value={variantSearchQuery}
                      onChange={(e) => setVariantSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10 text-slate-600 font-extrabold uppercase text-[10px] border-b">
                        <tr>
                          <th className="p-2.5 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={isAllVariantsSelected}
                              onChange={toggleSelectAllVariants}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer accent-blue-600"
                            />
                          </th>
                          <th className="p-2.5">Kombinasi & SKU</th>
                          <th className="p-2.5 w-28">HPP (Rp)</th>
                          <th className="p-2.5 w-28">Harga (Rp)</th>
                          <th className="p-2.5 w-24">Stok</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {filteredEditVariants.map((variant) => {
                          const realIdx = editVariants.findIndex(orig => orig.key === variant.key);
                          const isSelected = selectedVariantKeys.includes(variant.key);
                          return (
                            <tr key={variant.key} className={isSelected ? 'bg-blue-50/80 dark:bg-blue-900/30' : ''}>
                              <td className="p-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectVariant(variant.key)}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer accent-blue-600"
                                />
                              </td>
                              <td className="p-2.5">
                                <span className="font-bold text-slate-900 dark:text-white block text-xs">{variant.label}</span>
                                <span className="font-mono text-[10px] text-slate-400">{variant.sku}</span>
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  value={variant.cost}
                                  onChange={(e) => handleUpdateEditVariantRow(realIdx, 'cost', Number(e.target.value))}
                                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono font-bold"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => handleUpdateEditVariantRow(realIdx, 'price', Number(e.target.value))}
                                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono font-bold text-rose-600"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  value={variant.stock}
                                  onChange={(e) => handleUpdateEditVariantRow(realIdx, 'stock', Number(e.target.value))}
                                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono font-bold text-blue-600"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingProductId ? 'Simpan Perubahan Produk POS' : 'Simpan Produk Baru ke POS'}
                </button>
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: SALES REPORTS (CRUD) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Laporan Penjualan POS Retail</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Data transaksi yang dilakukan melalui Kasir Retail POS</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari transaksi..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-850">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-850">
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider">No. Order</th>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider">Pelanggan</th>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider">Produk</th>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-center">Qty</th>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-right">Total</th>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {marketplaceOrders
                    .filter(o => o.channel === 'POS Retail')
                    .filter(o => 
                      reportSearch === '' || 
                      o.orderNumber.toLowerCase().includes(reportSearch.toLowerCase()) ||
                      o.customerName.toLowerCase().includes(reportSearch.toLowerCase()) ||
                      o.productName.toLowerCase().includes(reportSearch.toLowerCase())
                    )
                    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
                    .map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-950 dark:text-white">{order.orderNumber}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{order.orderDate}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700 dark:text-slate-300">{order.customerName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{order.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{order.productName}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600">
                          {formatIDR(order.grossAmount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                            order.status === 'Selesai' 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleOpenEditOrder(order)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteConfirmation({ id: order.id, name: order.orderNumber, type: 'order' });
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all cursor-pointer"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {marketplaceOrders.filter(o => o.channel === 'POS Retail').length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                        Belum ada data transaksi POS Retail.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none">
                  <Edit className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Edit Transaksi</h2>
                  <p className="text-xs text-slate-500 font-bold">{editOrderData.orderNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditOrderModal(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Pelanggan</label>
                  <input
                    type="text"
                    value={editOrderData.customerName || ''}
                    onChange={(e) => setEditOrderData({ ...editOrderData, customerName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Metode Bayar</label>
                  <select
                    value={editOrderData.paymentMethod || ''}
                    onChange={(e) => setEditOrderData({ ...editOrderData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Produk</label>
                <input
                  type="text"
                  value={editOrderData.productName || ''}
                  onChange={(e) => setEditOrderData({ ...editOrderData, productName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Qty</label>
                  <input
                    type="number"
                    value={editOrderData.quantity || 0}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      const gross = qty * (editOrderData.unitPrice || 0);
                      setEditOrderData({ ...editOrderData, quantity: qty, grossAmount: gross });
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Total (Rp)</label>
                  <input
                    type="number"
                    value={editOrderData.grossAmount || 0}
                    onChange={(e) => setEditOrderData({ ...editOrderData, grossAmount: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-100 transition-all active:scale-95"
                >
                  Simpan Perubahan
                </button>
                <button 
                  type="button"
                  onClick={() => setShowEditOrderModal(false)}
                  className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* 1. BARCODE LIST MODAL */}
      {showBarcodeListModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 print-hide">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <List className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Daftar Barcode Varian Produk</h3>
                  <p className="text-xs text-slate-500">Data semua varian yang siap di-scan (EAN-13)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBarcodeListModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">

              {getAllVariantsList().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Belum ada barcode</h4>
                  <p className="text-xs text-slate-500 text-center max-w-sm">Anda belum menambahkan produk apapun, atau produk belum disinkronkan ke dalam sistem POS.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAllVariantsList().map((v, i) => (
                    <div key={`${v.product.id}-${v.modelName}-${v.size}-${v.barcode || v.skuVariasi || i}`} className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 flex flex-col space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{v.product.name}</h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{v.product.sku}</p>
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-1 rounded-md">
                          {v.stock} Stok
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium space-y-1 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-150 dark:border-slate-800">
                        {v.size !== "-" && <div><span className="text-slate-400">Size:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{v.size}</span></div>}
                        {v.color.name !== "-" && <div><span className="text-slate-400">Color:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{v.color.name}</span></div>}
                        {v.sleeve !== "-" && <div><span className="text-slate-400">Lengan:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{v.sleeve}</span></div>}
                        {v.design !== "-" && <div><span className="text-slate-400">Desain:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{v.design}</span></div>}
                        {(v.size === "-" && v.color.name === "-" && v.sleeve === "-" && v.design === "-") && <div><span className="text-slate-400">Variasi:</span> <span className="font-bold text-slate-800 dark:text-slate-200">Tidak ada variasi</span></div>}
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">EAN-13 Barcode</span>
                          <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">{v.barcode}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setScannerActive(true);
                            setScanMessage(`Mensimulasikan scan barcode ${v.barcode}...`);
                            setTimeout(() => {
                              setScannerActive(false);
                              setScanMessage('');
                              triggerLaserScanCode(v.barcode);
                              setShowBarcodeListModal(false);
                            }, 1000);
                          }}
                          className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Simulasikan Scan"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRINT HANGTAG MODAL */}
      {showBarcodePrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-5xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 print-hide">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Cetak Label Barcode Varian</h3>
                  <p className="text-xs text-slate-500">Preview label untuk ditempel pada produk</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDownloadVariantBarcodesAsPDF}
                  disabled={isDownloadingPDF}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {isDownloadingPDF ? 'Sedang Mengunduh PDF...' : 'Download PDF (A4)'}
                </button>
                <button 
                  onClick={() => setShowBarcodePrintModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* The Print Area */}
            <style type="text/css">
              {`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .print-area, .print-area * {
                    visibility: visible;
                  }
                  .print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    overflow: visible !important;
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .print-hide {
                    display: none !important;
                  }
                }
              `}
            </style>
            <div id="barcode-scroll-container" className="flex-1 overflow-y-auto pr-2 bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl print:bg-white print:p-0 print-area">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
                {getAllVariantsList().map((v, i) => {
                  const variantText = v.variantText || v.skuVariasi || v.modelName || (v.color?.name && v.color.name !== '-' ? v.color.name : 'Model Standard');

                  return (
                    <div key={`${v.product.id}-${v.modelName}-${v.size}-${v.barcode || v.skuVariasi || i}`} className="flex flex-col space-y-2">
                      {/* Printable card tag */}
                      <div 
                        className="border rounded-2xl flex flex-col items-center text-center barcode-card-item shadow-sm flex-1"
                        style={{ 
                          backgroundColor: '#ffffff', 
                          borderColor: '#cbd5e1',
                          color: '#0f172a',
                          padding: '22px 14px 18px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* 1. Nama Produk (paling atas) */}
                        <h4 
                          style={{ 
                            color: '#0f172a', 
                            fontSize: '12px', 
                            fontWeight: '800',
                            margin: '0 0 4px 0',
                            lineHeight: '1.3',
                            textAlign: 'center',
                            width: '100%',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            display: 'block'
                          }}
                        >
                          {v.product.name}
                        </h4>
                        
                        {/* 2. Varian (Model / Warna / Design dibawah nama produk) */}
                        <div 
                          style={{ 
                            color: '#475569',
                            fontSize: '9.5px',
                            fontWeight: '600',
                            margin: '0 0 6px 0',
                            lineHeight: '1.2',
                            textAlign: 'center',
                            width: '100%'
                          }}
                        >
                          {variantText}
                        </div>

                        {/* 3. Harga (dibawah Varian Model / Warna / Design) */}
                        <div 
                          style={{ 
                            color: '#0f172a',
                            fontSize: '14px',
                            fontWeight: '900',
                            margin: '0 0 8px 0',
                            lineHeight: '1.2',
                            textAlign: 'center'
                          }}
                        >
                          {formatIDR(v.price)}
                        </div>

                        {/* 4. Barcode Generator (penggabungan antara Kode Produk + Varian Size / Ukuran) */}
                        <div 
                          style={{ 
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '4px 0',
                            width: '100%',
                            margin: '0 0 2px 0'
                          }}
                        >
                           <BarcodeVisual code={v.barcode} />
                        </div>
                        
                        <span 
                          style={{ 
                            color: '#334155',
                            fontSize: '10.5px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            letterSpacing: '0.08em',
                            margin: '0',
                            lineHeight: '1.2',
                            textAlign: 'center'
                          }}
                        >
                          {v.barcode}
                        </span>
                      </div>

                      {/* Single Download button (hidden when printing) */}
                      <button
                        onClick={() => handleDownloadSingleBarcodeAsPNG(i)}
                        className="print-hide w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm hover:shadow"
                        title="Download PNG Varian Ini"
                      >
                        <Download className="w-3 h-3" />
                        Download PNG
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 text-[10px] text-slate-400 text-center print-hide">
              Pastikan pengaturan margin printer diset ke "Minimum" atau "None" untuk hasil terbaik.
            </div>
          </div>
        </div>
      )}


      {/* HARDWARE SETTINGS MODAL */}
      {showHardwareSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Pengaturan Alat Kasir</h3>
                  <p className="text-xs text-slate-500">Konfigurasi Printer Thermal & Barcode Scanner</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHardwareSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. THERMAL PRINTER HARDWARE CONFIGURATOR */}
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${printerConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                        <Printer className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Printer Thermal</h3>
                        <p className="text-[11px] text-slate-500">Cetak struk kasir retail</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${printerConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        {printerConnected ? 'Terhubung' : 'Terputus'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Koneksi Driver</span>
                      <button 
                        onClick={() => setPrinterConnected(!printerConnected)}
                        className="focus:outline-none cursor-pointer"
                      >
                        {printerConnected ? (
                          <ToggleRight className="w-10 h-10 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Interface Koneksi Printer</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['USB', 'Bluetooth', 'WiFi'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setPrinterType(type as any)}
                            disabled={!printerConnected}
                            className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              !printerConnected 
                                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600 dark:border-slate-700'
                                : printerType === type
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Lebar Kertas Cetak</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPrinterPaperSize('80mm')}
                          className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            printerPaperSize === '80mm'
                              ? 'border-rose-500 bg-rose-500/5 text-slate-950 dark:text-white'
                              : 'border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="font-extrabold text-xs">Standard (80mm)</span>
                          <span className="text-[10px] text-slate-400 mt-1">Sangat disarankan untuk invoice detail lengkap</span>
                        </button>
                        <button
                          onClick={() => setPrinterPaperSize('58mm')}
                          className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            printerPaperSize === '58mm'
                              ? 'border-rose-500 bg-rose-500/5 text-slate-950 dark:text-white'
                              : 'border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="font-extrabold text-xs">Mini Slim (58mm)</span>
                          <span className="text-[10px] text-slate-400 mt-1">Hemat kertas thermal untuk transaksi cepat</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Cetak otomatis saat bayar</span>
                      <button 
                        onClick={() => setPrinterAutoPrint(!printerAutoPrint)}
                        className="focus:outline-none cursor-pointer"
                      >
                        {printerAutoPrint ? (
                          <ToggleRight className="w-10 h-10 text-rose-500" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. BARCODE SCANNER HARDWARE CONFIGURATOR */}
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${scannerConnected ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Alat Barcode Scanner</h3>
                        <p className="text-[11px] text-slate-500">Konfigurasi scan otomatis</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${scannerConnected ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        {scannerConnected ? 'Terhubung' : 'Terputus'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Koneksi Scanner</span>
                      <button 
                        onClick={() => setScannerConnected(!scannerConnected)}
                        className="focus:outline-none cursor-pointer"
                      >
                        {scannerConnected ? (
                          <ToggleRight className="w-10 h-10 text-indigo-500" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mode Perangkat Scanner</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Camera', 'USB Gun', 'Bluetooth'].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setScannerType(mode as any)}
                            disabled={!scannerConnected}
                            className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              !scannerConnected 
                                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600 dark:border-slate-700'
                                : scannerType === mode
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Volume Suara BEEP</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'high', label: 'Keras' },
                          { id: 'low', label: 'Pelan' },
                          { id: 'off', label: 'Sunyi' }
                        ].map((vol) => (
                          <button
                            key={vol.id}
                            onClick={() => setScannerBeepVolume(vol.id as any)}
                            disabled={!scannerConnected}
                            className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              scannerBeepVolume === vol.id
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {vol.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS Laser Scanning Simulator Frame */}
      {scannerActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-rose-500 animate-pulse"></div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-white">Laser Barcode Hardware Gun</h4>
              <p className="text-xs text-slate-400">Sedang menyinari sensor barcode...</p>
            </div>

            <div className="h-44 bg-slate-950 rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden">
              {/* Simulated laser horizontal bounce bar */}
              <div className="absolute inset-x-0 h-1 bg-red-600 shadow-[0_0_12px_#ef4444] animate-bounce top-1/4"></div>
              
              <QrCode size={64} className="text-slate-800 animate-pulse" />
            </div>

            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
              <p className="text-[11px] font-mono text-emerald-400 animate-pulse">{scanMessage || 'Menunggu deteksi label sensor...'}</p>
            </div>

            <button
              onClick={() => setScannerActive(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: RECEIPT MODAL (Cetak Struk) WITH 80mm THERMAL PRESET */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 font-mono text-xs">
            
            {/* Header info matching thermal specs */}
            <div className="text-center border-b border-slate-300 pb-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-900 font-bold border border-slate-300 mb-1.5">J</div>
              <h3 className="font-black text-xs uppercase leading-none">PT JERJHON ENTERPRISE</h3>
              <p className="text-[9px] text-slate-500 mt-1">Graha Jerjhon Store JKT-01</p>
              <p className="text-[9px] text-slate-500">{new Date().toLocaleString('id-ID')}</p>
              <p className="text-[9px] text-slate-500">Kertas Format: <span className="font-bold text-slate-900">{printerPaperSize} Thermal</span></p>
            </div>

            <div className="space-y-1 border-b border-slate-300 pb-3 text-slate-700 text-[10px]">
              <p>Struk No : <span className="font-bold text-slate-950">{receiptModal.orderNo}</span></p>
              <p>Kasir    : Operator Retail POS Terminal</p>
              <p>Antrean  : <span className="font-bold text-slate-950">{receiptModal.customerName}</span></p>
            </div>

            {/* Shopping detailed breakdown */}
            <div className="space-y-2 border-b border-slate-300 pb-3">
              {(receiptModal.items || []).map((i: any) => (
                <div key={i.cartId} className="flex justify-between text-[11px] text-slate-900">
                  <div className="max-w-[200px]">
                    <span className="block font-bold">{i.name}</span>
                    <span className="text-[9px] text-slate-500">Varian: {i.size} • {i.color} ({i.quantity} pcs)</span>
                  </div>
                  <span className="font-bold text-right ml-2">{formatIDR(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Calculations breakdown matching 80mm layout */}
            <div className="space-y-1.5 border-b border-slate-300 pb-3 text-slate-700 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal            :</span>
                <span>{formatIDR(receiptModal.subtotal)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Potongan Promo ({discountCode}) :</span>
                <span>-{formatIDR(receiptModal.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>PPN Pajak (11%)      :</span>
                <span>{formatIDR(receiptModal.taxAmount)}</span>
              </div>
            </div>

            {/* Grand Total representation */}
            <div className="text-right font-black text-sm text-slate-950 flex justify-between items-center py-1">
              <span>TOTAL BAYAR</span>
              <span className="text-base">{formatIDR(receiptModal.grandTotal)}</span>
            </div>
            
            {receiptModal.paymentMethod === 'Cash' && (
              <div className="space-y-1 text-[10px] text-slate-700 pb-2">
                <div className="flex justify-between">
                  <span>Tunai (Diterima) :</span>
                  <span>{formatIDR(receiptModal.amountReceived)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembalian        :</span>
                  <span>{formatIDR(receiptModal.change)}</span>
                </div>
              </div>
            )}
            
            <div className="text-slate-600 text-[9px] text-right">
              <span>Metode: <strong className="text-slate-900">{receiptModal.paymentMethod}</strong></span>
            </div>

            {/* Simulated barcode for ticket verification */}
            <div className="py-2.5 flex flex-col items-center justify-center space-y-1 border-t border-dashed border-slate-300">
              <div className="flex gap-0.5 h-6 items-center">
                {[1,3,2,1,4,1,3,2,1,4,1,2,3,1,4,1,2].map((w, idx) => (
                  <span key={idx} className="bg-slate-900 h-full inline-block" style={{ width: `${w}px` }}></span>
                ))}
              </div>
              <span className="text-[8px] text-slate-400 tracking-widest">{receiptModal.orderNo}</span>
            </div>

            <div className="text-center text-[9px] text-slate-400 pt-1">
              Terima Kasih Telah Berbelanja di Jerjhon Retail!
              <p className="mt-1 font-sans">© PT JERJHON ENTERPRISE INDONESIA</p>
            </div>

            {/* Native action triggers */}
            <div className="pt-2 flex items-center justify-between gap-3 font-sans border-t border-slate-200">
              <button 
                onClick={() => window.print()} 
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Cetak (80mm)
              </button>
              <button 
                onClick={() => setReceiptModal(null)} 
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 text-center">
            <div className="p-8 pb-4">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Konfirmasi Hapus</h3>
              <p className="text-xs text-slate-500 font-bold mt-2">
                Apakah Anda yakin ingin menghapus {deleteConfirmation.type === 'product' ? 'produk' : 'transaksi'} <span className="text-rose-600">"{deleteConfirmation.name}"</span>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="p-8 pt-4 flex gap-3">
              <button 
                onClick={() => {
                  if (deleteConfirmation.type === 'product') {
                    setLocalProducts(prev => prev.filter(p => p.id !== deleteConfirmation.id));
                    deleteProduct(deleteConfirmation.id);
                  } else {
                    deleteMarketplaceOrder(deleteConfirmation.id);
                  }
                  setDeleteConfirmation(null);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-100 dark:shadow-none transition-all active:scale-95"
              >
                Ya, Hapus
              </button>
              <button 
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <SyncDiagnosticsDashboard />
      </div>

    </div>
  );
};
