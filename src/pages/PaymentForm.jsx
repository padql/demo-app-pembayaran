import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useToast } from '../components/ToastProvider.jsx';

export default function PaymentForm({ onSuccess }){
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nama:'', jumlah:'', keterangan:'', tanggal:'', metode:'' });

  const change = (e)=> setForm({...form, [e.target.name]: e.target.value });

  const submit = async (e)=>{
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, jumlah: Number(form.jumlah || 0) };
      const { error } = await supabase.from('pembayaran').insert([payload]);
      if (error) { toast.push('Gagal menyimpan: '+error.message, { duration:4000 }); }
      else { toast.push('Berhasil disimpan ✅'); onSuccess?.(); setForm({ nama:'', jumlah:'', keterangan:'', tanggal:'', metode:'' }); }
    } catch(err){ toast.push('Error: '+err.message); }
    setLoading(false);
  };

  return (
    <>
    <h1 className="text-lg font-bold mt-16 text-left text-black">Masukkan Data Pembayaran</h1>
    <p className="mb-6">Memudahkan laporan pendapatanmu.</p>
    <form onSubmit={submit} className="bg-glass rounded-3xl p-6 shadow-lg w-full">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Nama Pelanggan</label>
          <input name="nama" value={form.nama} onChange={change} className="w-full border px-3 py-2 rounded-xl" placeholder="Contoh: Budi" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jumlah (Rp)</label>
          <input name="jumlah" value={form.jumlah} onChange={change} type="number" className="w-full border px-3 py-2 rounded-xl" placeholder="100000" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Metode</label>
          <select name="metode" value={form.metode} onChange={change} className="w-full border px-3 py-2 rounded-xl" required>
            <option value="">Pilih metode</option>
            <option value="Cash">Cash</option>
            <option value="Transfer">Transfer</option>
            <option value="QRIS">QRIS</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tanggal</label>
          <input name="tanggal" value={form.tanggal} onChange={change} type="date" className="w-full border px-3 py-2 rounded-xl" required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Keterangan</label>
          <textarea name="keterangan" value={form.keterangan} onChange={change} className="w-full border px-3 py-2 rounded-xl" placeholder="opsional" />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading? 'Menyimpan...' : 'Simpan Pembayaran'}
          </button>
        </div>
      </div>
    </form>
    </>
  );
}
