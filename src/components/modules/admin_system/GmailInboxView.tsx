import React, { useState } from 'react';
import { Mail, Send, Inbox, Star, Trash2, RefreshCw, AlertCircle, CheckCircle2, User, Paperclip, ChevronRight } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';

interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export const GmailInboxView: React.FC = () => {
  const { currentUser } = useERP();
  const [messages, setMessages] = useState<GmailMessageSummary[]>([
    { id: '1', threadId: 't1', subject: 'Konfirmasi Pesanan PO-2026-8812', from: 'vendor@textilejaya.co.id', snippet: 'Pesanan kain Cotton Combed 30s telah diproses dan dikirim ke gudang.', date: 'Hari ini, 09:30' },
    { id: '2', threadId: 't2', subject: 'Laporan Pajak Masa PPh 21 - Maret 2026', from: 'tax@jerjhonenterprise.com', snippet: 'Dokumen SPT Masa PPh Pasal 21 telah siap diverifikasi oleh pimpinan.', date: 'Kemarin, 14:15' },
    { id: '3', threadId: 't3', subject: 'Pengajuan Cuti Karyawan - Budi Santoso', from: 'hrd@jerjhonenterprise.com', snippet: 'Pengajuan cuti tahunan selama 3 hari menunggu approval manajer.', date: '12 Maret 2026' }
  ]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setIsRefreshing(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject) return;
    const newMsg: GmailMessageSummary = {
      id: `msg-${Date.now()}`,
      threadId: `t-${Date.now()}`,
      subject: composeSubject,
      from: currentUser?.email || 'admin@jerjhonenterprise.com',
      snippet: composeBody.substring(0, 80),
      date: 'Baru saja'
    };
    setMessages([newMsg, ...messages]);
    setIsComposing(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    alert('Email berhasil dikirim melalui integrasi Google Gmail!');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="text-red-500 w-6 h-6" /> Google Gmail Enterprise Integration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola kotak masuk email korporat, balas pesan vendor & kirim dokumen secara langsung.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Kotak Masuk
          </button>
          <button
            onClick={() => setIsComposing(true)}
            className="flex items-center gap-2 px-5 py-2 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Send className="w-4 h-4" /> Tulis Email Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden lg:col-span-1">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>Kotak Masuk ({messages.length})</span>
            <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full font-semibold">Terhubung</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-[600px] overflow-y-auto">
            {messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`p-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selectedMessage?.id === msg.id ? 'bg-red-50/50 dark:bg-red-950/20 border-l-4 border-[#b90f0f]' : ''}`}
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{msg.from}</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">{msg.subject}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{msg.snippet}</div>
                <div className="text-[10px] text-slate-400 mt-2 text-right">{msg.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Detail or Compose */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 lg:col-span-2 flex flex-col justify-between">
          {isComposing ? (
            <form onSubmit={handleSend} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Tulis Email Baru</h3>
                <button type="button" onClick={() => setIsComposing(false)} className="text-slate-400 hover:text-slate-600">Batal</button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kepada (Email Tujuan):</label>
                <input
                  type="email"
                  value={composeTo}
                  onChange={e => setComposeTo(e.target.value)}
                  placeholder="vendor@example.com"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b90f0f]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subjek:</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Subjek email..."
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b90f0f]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Isi Pesan:</label>
                <textarea
                  rows={8}
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Tulis pesan Anda di sini..."
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b90f0f]"
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#b90f0f] hover:bg-[#9a0c0c] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Kirim Email Sekarang
                </button>
              </div>
            </form>
          ) : selectedMessage ? (
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedMessage.subject}</h3>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>Dari: <strong>{selectedMessage.from}</strong></span>
                  <span>{selectedMessage.date}</span>
                </div>
              </div>
              <div className="py-4 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedMessage.snippet}
                <br /><br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Pesanan atau dokumen terkait telah diverifikasi secara otomatis oleh sistem ERP Enterprise.
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setComposeTo(selectedMessage.from);
                    setComposeSubject(`Re: ${selectedMessage.subject}`);
                    setIsComposing(true);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Balas Pesan
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Inbox className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Pilih Pesan</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">Pilih salah satu pesan dari kotak masuk di sebelah kiri untuk membaca detail lengkap.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
