import re

with open('src/components/modules/inventory_purchasing/StockOpnameView.tsx', 'r') as f:
    content = f.read()

# 1. Update activeTab type
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'audit' | 'opname' | 'mutation'>('audit');",
    "const [activeTab, setActiveTab] = useState<'audit' | 'opname' | 'mutation' | 'mutation-history'>('audit');"
)

# 2. Add mutationCart state
cart_state = """
  const [mutationCart, setMutationCart] = useState<any[]>([]);
  const [printSuratJalan, setPrintSuratJalan] = useState<any | null>(null);
"""
content = content.replace(
    "const [isSubmittingMutation, setIsSubmittingMutation] = useState(false);",
    "const [isSubmittingMutation, setIsSubmittingMutation] = useState(false);\n" + cart_state
)

# 3. Add print handling
print_func = """
  const handlePrintSJ = (mov: any) => {
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    document.body.appendChild(frame);
    const frameDoc = frame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.write(`
        <html>
          <head>
            <title>Surat Jalan Mutasi - ${mov.referenceNumber}</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              h2 { text-align: center; }
              .details { margin-top: 20px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #333; padding: 8px; text-align: left; }
            </style>
          </head>
          <body>
            <h2>SURAT JALAN MUTASI STOK</h2>
            <div class="details">
              <p><strong>No. Referensi:</strong> ${mov.referenceNumber}</p>
              <p><strong>Tanggal:</strong> ${mov.date}</p>
              <p><strong>Gudang Asal:</strong> ${mov.sourceLocation}</p>
              <p><strong>Gudang Tujuan:</strong> ${mov.destinationLocation}</p>
              <p><strong>PIC:</strong> ${mov.operator}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Produk & Varian</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${mov.productSku}</td>
                  <td>${mov.productName}</td>
                  <td>${mov.quantity} Pcs</td>
                </tr>
              </tbody>
            </table>
            <br/><br/>
            <div style="display:flex; justify-content:space-between; margin-top:50px;">
              <div>Pihak Pengirim (Asal)<br/><br/><br/>(________________)</div>
              <div>Pihak Penerima (Tujuan)<br/><br/><br/>(________________)</div>
            </div>
            <script>
              window.onload = () => { window.print(); }
            </script>
          </body>
        </html>
      `);
      frameDoc.close();
    }
  };
"""

content = content.replace(
    "// Derived data for Mutation selected product",
    print_func + "\n  // Derived data for Mutation selected product"
)

# 4. Modify handleSubmitMutation
submit_mutation_old = r"const handleSubmitMutation = async \(e: React\.FormEvent\) => \{.*?\n  \};\n"
submit_mutation_new = """
  const handleAddToCart = () => {
    if (!mutationProduct || !mutationSourceWh || mutationQty === '') return;
    const qtyVal = Number(mutationQty);
    if (qtyVal > sourceStockVal) {
      triggerNotification('error', 'Stok di Gudang Asal tidak mencukupi!');
      return;
    }
    const sourceProd = selectedMutationProductObj!;
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
      for (const item of mutationCart) {
        // Find if destination product exists
        let destProd = products.find(p => p.sku === item.sku && p.warehouse === mutationDestWh);
        
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
        }

        const sourceProdId = item.id;
        const destProdId = destProd.id;
        const qtyVal = item.qty;

        if (item.variantKey) {
          // Handle variant stocks
          const sourceGlobalKey = item.globalKey;
          const destGlobalKey = `${destProdId}-${item.variantKey}`;
          
          const currentSourceVarStock = variantStocks[sourceGlobalKey] || 0;
          const currentDestVarStock = variantStocks[destGlobalKey] || 0;
          
          const nextVariantStocks = { ...variantStocks };
          nextVariantStocks[sourceGlobalKey] = Math.max(0, currentSourceVarStock - qtyVal);
          nextVariantStocks[destGlobalKey] = currentDestVarStock + qtyVal;
          
          setVariantStocks(nextVariantStocks);
        } else {
          // Handle default product stocks
          const sourceProd = products.find(p => p.id === sourceProdId);
          if (sourceProd) {
             await updateProduct(sourceProdId, {
               stockQuantity: Math.max(0, sourceProd.stockQuantity - qtyVal)
             });
          }
          await updateProduct(destProdId, {
            stockQuantity: destProd.stockQuantity + qtyVal
          });
        }
        
        // Add log for this item
        addAuditLog({
          id: `MOV-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          productSku: item.variantKey ? `${item.sku}-${item.variantKey}` : item.sku,
          productName: `${item.name} ${item.variantLabel !== 'Default Varian' ? `(${item.variantLabel})` : ''}`,
          type: 'Warehouse Transfer',
          quantity: qtyVal,
          sourceLocation: mutationSourceWh,
          destinationLocation: mutationDestWh,
          date: new Date().toISOString().substring(0, 10),
          operator: currentUser?.name || 'Unknown User',
          referenceNumber: mutationNotes || `TRF-${Date.now()}`
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
"""
content = re.sub(r"const handleSubmitMutation = async \(e: React\.FormEvent\) => \{.*?\n  \};\n", submit_mutation_new, content, flags=re.DOTALL)


# 5. Add tabs UI
tabs_ui_old = """
            <button 
              onClick={() => setActiveTab('mutation')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'mutation' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              Mutasi Gudang
            </button>
"""
tabs_ui_new = """
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
"""
content = content.replace(tabs_ui_old, tabs_ui_new)

# 6. Replace mutation tab UI
mutation_ui_old = r"\{activeTab === 'mutation' && \(\n        <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">.*?\n        </div>\n      \)\}"
mutation_ui_new = """{activeTab === 'mutation' && (
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
                      }}
                      disabled={!mutationSourceWh}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl disabled:opacity-50"
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.filter(p => p.warehouse === mutationSourceWh).map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.sku}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Varian (Kombinasi)</label>
                    <select
                      value={mutationVariant}
                      onChange={(e) => {
                        setMutationVariant(e.target.value);
                        setMutationQty('');
                      }}
                      disabled={!mutationProduct || mutationCombos.length === 0}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl disabled:opacity-50"
                    >
                      <option value="">-- Tanpa Varian / Default --</option>
                      {mutationCombos.map(c => (
                        <option key={c.key} value={c.key}>
                          {c.label} (Tersedia: {c.stock} Pcs)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {mutationProduct && (
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
                         <span className="text-slate-500 text-[10px]">Tersedia: <strong>{sourceStockVal} Pcs</strong></span>
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
                )}
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
      )}"""
content = re.sub(r"\{activeTab === 'mutation' && \(\n        <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">.*?\n        </div>\n      \)\}", mutation_ui_new, content, flags=re.DOTALL)


# 7. Add History Mutasi tab content
history_ui = """
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
                {stockMovements.filter(m => m.type === 'Warehouse Transfer').length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada riwayat mutasi.
                    </td>
                  </tr>
                ) : (
                  stockMovements.filter(m => m.type === 'Warehouse Transfer').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                      <td className="p-3 font-mono font-extrabold text-slate-950 dark:text-slate-100">
                        {mov.referenceNumber}
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
                        <button
                          onClick={() => handlePrintSJ(mov)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 mx-auto"
                        >
                          <FileText className="w-3.5 h-3.5" /> Cetak SJ
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
"""
content = content.replace("    </div>\n  );\n};\n", history_ui + "\n    </div>\n  );\n};\n")


with open('src/components/modules/inventory_purchasing/StockOpnameView.tsx', 'w') as f:
    f.write(content)
