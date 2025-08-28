  import { useEffect, useState } from "react"
  import { supabase } from "@/lib/supabase"
  import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

  export default function Dashboard() {
    const [data, setData] = useState([])
    const [total, setTotal] = useState(0)
    const [count, setCount] = useState(0)
    const [latest, setLatest] = useState([])
    const [index, setIndex] = useState(0)

    useEffect(() => {
      const fetchData = async () => {
        const { data: pembayaran, error } = await supabase
          .from("pembayaran")
          .select("jumlah, tanggal, metode, nama")
          .order("tanggal", { ascending: false })

        if (error) {
          console.error(error)
          return
        }

        const totalSemua = pembayaran.reduce((sum, p) => sum + p.jumlah, 0)
        setTotal(totalSemua)
        setCount(pembayaran.length)

        setLatest(pembayaran.slice(0, 3))

        const grouped = {}
        pembayaran.forEach((item) => {
          const bulan = new Date(item.tanggal).toLocaleString("id-ID", { month: "short" })
          if (!grouped[bulan]) grouped[bulan] = 0
          grouped[bulan] += item.jumlah
        })

        const chartData = Object.entries(grouped).map(([bulan, total]) => ({
          name: bulan,
          total,
        }))

        setData(chartData)
      }

      fetchData()
    }, [])

    function fmtRupiah(number) {
      return "Rp " + number.toLocaleString("id-ID");
    }

    // Auto slide index tiap 3 detik
    useEffect(() => {
      if (latest.length === 0) return
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % latest.length)
      }, 3000)
      return () => clearInterval(interval)
    }, [latest])

    function fmtDate(d) {
      try {
        return new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        });
      } catch {
        return d;
      }
    }

    return (
      <div className="p-6 space-y-8">
        <h1 className="text-2xl font-bold mt-16 mb-6 text-left">Selamat Datang!</h1>

        {/* Statistik ringkas + auto-slide */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {/* Total Pembayaran */}
          <div className="bg-orange-500 text-white rounded-2xl p-4 h-[100px] flex flex-col justify-center shadow">
              <h3 className="text-xs">Total Pembayaran</h3>
              <p className="text-md font-bold mt-1">
              Rp {total.toLocaleString("id-ID")}
              </p>
          </div>

          {/* Jumlah Transaksi */}
          <div className="bg-green-500 text-white rounded-2xl p-4 h-[100px] flex flex-col justify-center shadow">
              <h3 className="text-xs">Jumlah Transaksi</h3>
              <p className="text-md font-bold mt-1">{count}</p>
          </div>

          {/* Slider Transaksi Terakhir */}
          <div className="bg-violet-500 rounded-2xl p-4 h-[100px] flex flex-col justify-center shadow overflow-hidden relative col-span-2 md:col-span-1">
              <h3 className="text-xs text-white mt-2">Riwayat</h3>
              <div className="flex-1 overflow-hidden">
              <div
                  className="flex transition-transform duration-700 ease-in-out h-full"
                  style={{
                  transform: `translateX(-${index * 100}%)`,
                  width: `${latest.length * 100}%`,
                  }}
              >
                  {latest.map((item, i) => (
                  <div key={i} className="w-full flex-shrink-0 pr-2">
                      <div className="text-white py-1 h-[30px] flex items-center text-sm sm:text-sm">
                      <span className="text-white font-semibold">{item.nama}</span>
                      <span className="px-1">•</span>
                      <span className="text-white font-semibold">{item.metode}</span>
                      <span className="px-1">•</span>
                      <span className="font-semibold">Rp {item.jumlah.toLocaleString("id-ID")}</span>
                      <span className="px-1">•</span>
                      <span className="text-white font-semibold">
                          {fmtDate(item.tanggal)}
                      </span>
                      </div>
                  </div>
                  ))}
              </div>
              </div>

              {/* indikator dot */}
              <div className="absolute bottom-1 left-0 right-0 flex justify-center space-x-1">
              {latest.map((_, i) => (
                  <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                      index === i ? "bg-white scale-75" : "bg-white/50 scale-50"
                  }`}
                  />
              ))}
              </div>
          </div>
          </div>

          {/* Grafik */}
          <div className="w-full h-[240px] bg-white rounded-2xl shadow p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Total Pembayaran per Bulan</h2>
          <div className="flex-1"> {/* container flex-1 biar chart expand */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => fmtRupiah(value)} /> {/* format tooltip */}
                <Bar dataKey="total" fill="#30967b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }
