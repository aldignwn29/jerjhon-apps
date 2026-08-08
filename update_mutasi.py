import re

with open('src/components/modules/inventory_purchasing/StockOpnameView.tsx', 'r') as f:
    content = f.read()

# 1. Update handleAddToCart to support ALL_VARIANTS
handle_add_to_cart_old = r"const handleAddToCart = \(\) => \{.*?\n  \};\n"
handle_add_to_cart_new = """const handleAddToCart = () => {
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
  };"""
content = re.sub(r"const handleAddToCart = \(\) => \{.*?\n  \};\n", handle_add_to_cart_new, content, flags=re.DOTALL)


# 2. Update Select Option for ALL_VARIANTS
select_variant_old = """<option value="">-- Tanpa Varian / Default --</option>
                      {mutationCombos.map(c => ("""
select_variant_new = """<option value="">-- Tanpa Varian / Default --</option>
                      {mutationCombos.length > 1 && <option value="ALL_VARIANTS" className="font-bold text-blue-600">-- Pilih Semua Varian Sekaligus --</option>}
                      {mutationCombos.map(c => ("""
content = content.replace(select_variant_old, select_variant_new)


# 3. Fix input max stock logic
input_qty_old = """<input
                           type="number"
                           min={1}
                           max={sourceStockVal}
                           value={mutationQty}
                           onChange={(e) => setMutationQty(e.target.value === '' ? '' : Number(e.target.value))}
                           disabled={!mutationProduct}
                           placeholder="Jml"
                           className="w-32 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl font-mono text-base font-bold disabled:opacity-50"
                         />"""
input_qty_new = """<input
                           type="number"
                           min={1}
                           max={mutationVariant === 'ALL_VARIANTS' ? undefined : sourceStockVal}
                           value={mutationQty}
                           onChange={(e) => setMutationQty(e.target.value === '' ? '' : Number(e.target.value))}
                           disabled={!mutationProduct || !mutationVariant}
                           placeholder="Jml"
                           className="w-32 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl font-mono text-base font-bold disabled:opacity-50"
                         />"""
content = content.replace(input_qty_old, input_qty_new)

# 4. Fix Add button disabled condition
add_btn_old = """<button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!mutationProduct || mutationQty === '' || Number(mutationQty) > sourceStockVal || Number(mutationQty) <= 0}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >"""
add_btn_new = """<button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!mutationProduct || mutationQty === '' || (mutationVariant !== 'ALL_VARIANTS' && Number(mutationQty) > sourceStockVal) || Number(mutationQty) <= 0}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >"""
content = content.replace(add_btn_old, add_btn_new)


# 5. Fix text displaying stock based on variant
stock_display_old = """<span className="text-slate-500 text-[10px]">Tersedia: <strong>{sourceStockVal} Pcs</strong></span>"""
stock_display_new = """<span className="text-slate-500 text-[10px]">Tersedia: <strong>{mutationVariant === 'ALL_VARIANTS' ? 'Cek per varian' : `${sourceStockVal} Pcs`}</strong></span>"""
content = content.replace(stock_display_old, stock_display_new)


with open('src/components/modules/inventory_purchasing/StockOpnameView.tsx', 'w') as f:
    f.write(content)

