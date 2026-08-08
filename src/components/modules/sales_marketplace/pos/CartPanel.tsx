import React from 'react';
import { ShoppingBag, Trash, Trash2, Plus, Minus, Banknote, QrCode, CheckCircle2 } from 'lucide-react';

interface CartItem {
  cartId: string;
  productId: string;
  name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
}

interface CartPanelProps {
  cart: CartItem[];
  customerName: string;
  setCustomerName: (name: string) => void;
  paymentMethod: 'Cash' | 'QRIS';
  setPaymentMethod: (method: 'Cash' | 'QRIS') => void;
  amountReceived: number | string;
  setAmountReceived: (amount: number | string) => void;
  clearCart: () => void;
  updateQuantity: (cartId: string, delta: number) => void;
  removeFromCart: (cartId: string) => void;
  formatIDR: (price: number) => string;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  change: number;
  handleCheckout: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  customerName,
  setCustomerName,
  paymentMethod,
  setPaymentMethod,
  amountReceived,
  setAmountReceived,
  clearCart,
  updateQuantity,
  removeFromCart,
  formatIDR,
  discountAmount,
  taxAmount,
  grandTotal,
  change,
  handleCheckout
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4 shadow-md flex flex-col gap-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
          <div>
            <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Detail Keranjang</h3>
            <p className="text-[10px] text-slate-500">List belanja aktif kasir retail</p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors px-1.5 py-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
            >
              <Trash className="w-3 h-3" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 px-1">
          <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} Item Terpilih</span>
          <span className="text-slate-400 font-normal">Antrean: {customerName}</span>
        </div>

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
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 flex-shrink-0 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                  {item.productId.includes('NEW') ? 'CUSTOM' : item.productId.substring(0, 8)}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-xs text-slate-950 dark:text-white truncate leading-tight">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span>Varian: <strong className="text-slate-600 dark:text-slate-300">{item.size} • {item.color}</strong></span>
                  </p>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block mt-1">{formatIDR(item.price)}</span>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-800">
                  <button 
                    onClick={() => updateQuantity(item.cartId, -1)} 
                    className="p-1 text-slate-500 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-xs font-bold font-mono px-1.5 text-slate-950 dark:text-white">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.cartId, 1)} 
                    className="p-1 text-slate-500 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                <button 
                  onClick={() => removeFromCart(item.cartId)} 
                  className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                  title="Hapus item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-3">
        <div className="space-y-1">
          <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Nama Pelanggan / Antrean</label>
          <input
            type="text"
            placeholder="Walk-in Customer"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-lg focus:border-rose-500 text-slate-900 dark:text-white font-bold focus:outline-none placeholder-slate-400 shadow-inner"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Metode Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod('Cash')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border transition-all ${
                paymentMethod === 'Cash' 
                  ? 'bg-rose-500 border-rose-500 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-950 border-slate-200/50 dark:border-slate-850 text-slate-500 hover:border-rose-200'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span className="text-xs font-black">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('QRIS')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border transition-all ${
                paymentMethod === 'QRIS' 
                  ? 'bg-rose-500 border-rose-500 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-950 border-slate-200/50 dark:border-slate-850 text-slate-500 hover:border-rose-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="text-xs font-black">QRIS</span>
            </button>
          </div>
        </div>

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
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-lg focus:border-rose-500 text-slate-900 dark:text-white font-bold focus:outline-none placeholder-slate-400 shadow-inner"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850">
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
      
      <button
        onClick={handleCheckout}
        disabled={cart.length === 0}
        className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-950 hover:from-slate-850 hover:to-slate-900 dark:from-slate-100 dark:to-white dark:text-slate-950 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-98 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <CheckCircle2 className="w-5 h-5" />
        <span>Bayar Transaksi Sekarang</span>
      </button>
    </div>
  );
};
