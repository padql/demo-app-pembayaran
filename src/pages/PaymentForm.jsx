import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { useToast } from "../components/ToastProvider.jsx";

/* ---------- SLIDER: Slide to Submit ---------- */
function SlideToSubmit({
  onTrigger,
  disabled = false,
  loading = false,
  label = "Geser untuk Simpan",
  successLabel = "Terkirim",
  width = 280,   // px
  height = 48,   // px
}) {
  const KNOB = 44; // diameter knob
  const MAX = Math.max(0, width - KNOB);

  const trackRef = useRef(null);
  const knobRef = useRef(null);

  const [x, setX] = useState(0);            // posisi knob (px)
  const [dragging, setDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const firedRef = useRef(false);           // cegah onTrigger kepanggil 2x

  // reset saat loading selesai
  useEffect(() => {
    if (!loading && completed) {
      // kasih delay dikit biar user lihat statusnya
      const t = setTimeout(() => {
        firedRef.current = false;
        setCompleted(false);
        setX(0);
      }, 450);
      return () => clearTimeout(t);
    }
  }, [loading, completed]);

  const clamp = (v) => Math.min(MAX, Math.max(0, v));

  const pointerDown = (e) => {
    if (disabled || loading || completed) return;
    e.preventDefault();
    setDragging(true);
    // ambil kontrol pointer biar gerakan tetap ke-capture walau keluar area
    knobRef.current?.setPointerCapture?.(e.pointerId);
  };

  const pointerMove = (e) => {
    if (!dragging) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    if (clientX == null) return;

    // hitung posisi knob berdasar posisi pointer relatif ke track
    const newX = clamp(clientX - rect.left - KNOB / 2);
    setX(newX);

    // kalau udah nyentuh ujung → kunci di ujung + trigger sekali
    if (newX >= MAX - 1 && !firedRef.current) {
      setX(MAX);
      setCompleted(true);
      setDragging(false);
      firedRef.current = true;
      onTrigger?.(); // 🚀 submit langsung tanpa perlu lepas
    }
  };

  const pointerUpOrLeave = () => {
    if (!dragging) return;
    setDragging(false);
    if (!completed) {
      // belum sampai kanan → balik kiri (smooth)
      setX(0);
    }
  };

  // progress fill
  const progressPct = Math.round((x / MAX) * 100);

  return (
    <div
      ref={trackRef}
      className={`relative select-none overflow-hidden rounded-full`}
      style={{ width, height, background: disabled ? "#e5e7eb" : "#f3f4f6" }}
      onPointerMove={pointerMove}
      onPointerUp={pointerUpOrLeave}
      onPointerCancel={pointerUpOrLeave}
      onPointerLeave={pointerUpOrLeave}
    >
      {/* progress fill */}
      <div
        className="absolute left-0 top-0 h-full transition-[width] duration-150 ease-out"
        style={{
          width: `${progressPct}%`,
          background: disabled ? "#c7cdd6" : "#dbeafe",
        }}
      />

      {/* label tengah */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={`text-sm font-medium transition-colors ${
            completed ? "text-green-700"
            : disabled ? "text-gray-400"
            : "text-gray-700"
          }`}
        >
          {loading ? "Menyimpan..." : completed ? successLabel : label}
        </span>
      </div>

      {/* knob */}
      <div
        ref={knobRef}
        role="button"
        aria-label="Geser untuk submit"
        className={`absolute top-1 flex items-center justify-center rounded-full shadow
          ${disabled ? "bg-gray-300" : "bg-indigo-500"}
          ${dragging ? "transition-none" : "transition-transform duration-300 ease-out"}
          text-white`}
        style={{
          width: KNOB - 2,
          height: KNOB - 2,
          transform: `translateX(${x}px)`,
          left: 2,
        }}
        onPointerDown={pointerDown}
      >
        {completed ? "✓" : "➜"}
      </div>

      {/* cover transparan saat loading/disabled biar gak bisa interaksi */}
      {(disabled || loading) && (
        <div className="absolute inset-0 cursor-not-allowed" />
      )}
    </div>
  );
}

/* ---------- FORM ---------- */
export default function PaymentForm({ onSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    jumlah: "",
    keterangan: "",
    tanggal: "",
    metode: "",
  });

  const change = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const canSubmit =
    form.nama && form.jumlah && form.tanggal && form.metode && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const payload = { ...form, jumlah: Number(form.jumlah || 0) };
      const { error } = await supabase.from("pembayaran").insert([payload]);
      if (error) {
        toast.push("Gagal menyimpan: " + error.message, { duration: 4000 });
      } else {
        toast.push("Berhasil disimpan ✅");
        onSuccess?.();
        setForm({
          nama: "",
          jumlah: "",
          keterangan: "",
          tanggal: "",
          metode: "",
        });
      }
    } catch (err) {
      toast.push("Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <h1 className="text-lg font-bold mt-16 text-left text-black">
        Masukkan Data Pembayaran
      </h1>
      <p className="mb-6">Memudahkan laporan pendapatanmu.</p>

      {/* pakai preventDefault supaya Enter tidak submit default */}
      <form onSubmit={(e) => e.preventDefault()} className="bg-glass rounded-3xl p-6 shadow-lg w-full">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Nama Pelanggan</label>
            <input
              name="nama"
              value={form.nama}
              onChange={change}
              className="w-full border px-3 py-2 rounded-xl"
              placeholder="Contoh: Budi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Jumlah (Rp)</label>
            <input
              name="jumlah"
              value={form.jumlah}
              onChange={change}
              type="number"
              className="w-full border px-3 py-2 rounded-xl"
              placeholder="100000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Metode</label>
            <select
              name="metode"
              value={form.metode}
              onChange={change}
              className="w-full border px-3 py-2 rounded-xl"
              required
            >
              <option value="">Pilih metode</option>
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tanggal</label>
            <input
              name="tanggal"
              value={form.tanggal}
              onChange={change}
              type="date"
              className="w-full border px-3 py-2 rounded-xl"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Keterangan</label>
            <textarea
              name="keterangan"
              value={form.keterangan}
              onChange={change}
              className="w-full border px-3 py-2 rounded-xl"
              placeholder="opsional"
            />
          </div>

          {/* Ganti tombol dengan slider */}
          <div className="md:col-span-2 flex justify-end">
            <SlideToSubmit
              onTrigger={submit}
              disabled={!canSubmit}
              loading={loading}
              label="Geser untuk Simpan"
              successLabel="Terkirim"
              width={280}
              height={48}
            />
          </div>
        </div>
      </form>
    </>
  );
}
