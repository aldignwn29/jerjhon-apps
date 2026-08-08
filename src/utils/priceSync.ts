/**
 * Utility functions for automatic variant price synchronization between Inventory and POS modules.
 */

export function getGlobalVariantKey(prodId: string, size: string, color: string, sleeve: string = '-', design: string = '-'): string {
  return `${prodId}_${size || '-'}_${color || '-'}_${sleeve || '-'}_${design || '-'}`;
}

export function calculateVariantPrice(
  prod: { id: string; sellingPrice?: number; unitCostPrice?: number },
  size: string,
  color: string,
  sleeve: string = '-',
  design: string = '-',
  variantPrices: Record<string, number> = {},
  sizeExtraPrices: Record<string, Record<string, number>> = {},
  colorExtraPrices: Record<string, Record<string, number>> = {}
): number {
  const globalKey = getGlobalVariantKey(prod.id, size, color, sleeve, design);

  // 1. Check exact variant price override in shared state
  if (variantPrices[globalKey] !== undefined && variantPrices[globalKey] > 0) {
    return variantPrices[globalKey];
  }

  // 2. Fuzzy lookup in variantPrices across shared state
  const colorNorm = (color || '').toLowerCase().replace(/\s+/g, ' ').trim();
  for (const [k, pVal] of Object.entries(variantPrices)) {
    const numVal = Number(pVal);
    if (k.startsWith(prod.id) && numVal > 0) {
      const kNorm = k.toLowerCase().replace(/\s+/g, ' ');
      if (colorNorm !== '-' && kNorm.includes(colorNorm)) {
        return numVal;
      }
    }
  }

  // 3. Model-specific fallback rules (Jerjhon Rok & Legging variants)
  if (colorNorm.includes('2in1 rok pendek')) return 205000;
  if (colorNorm.includes('3in1 legging pendek') || colorNorm.includes('3in1legging pendek')) return 299000;
  if (colorNorm.includes('2in1 rok panjang')) return 329000;
  if (colorNorm.includes('3in1 legging panjang') || colorNorm.includes('3in1legging panjang') || colorNorm.includes('3in1 rok legging panjang')) return 329000;

  // 4. Base price + extra modifiers
  const base = prod.sellingPrice || 175000;
  const extraSize = sizeExtraPrices[prod.id]?.[size] || 0;
  const extraColor = colorExtraPrices[prod.id]?.[color] || 0;

  return base + extraSize + extraColor;
}
