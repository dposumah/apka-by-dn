"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import {
  Calculator,
  Download,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Percent,
  Coins,
  Wrench,
} from "lucide-react";
import {
  IYRC_PNL_ASSUMPTIONS,
  IYRC_PNL_VERSION,
  IYRC_REVENUE_ITEMS,
  IYRC_UNBUDGETED_NOTES,
  calculateIyrcUpNov26Scenario,
} from "@/lib/iyrc-utils";

export default function IyrcRabTab() {
  const [usdRate, setUsdRate] = useState<number>(IYRC_PNL_ASSUMPTIONS.usdToIdr);
  const [equipmentEstimate, setEquipmentEstimate] = useState<number>(0);

  const isSimulated =
    usdRate !== IYRC_PNL_ASSUMPTIONS.usdToIdr || equipmentEstimate !== 0;

  const scenario = useMemo(
    () =>
      calculateIyrcUpNov26Scenario({
        usdToIdr: usdRate,
        equipmentPurchaseEstimate: equipmentEstimate,
      }),
    [usdRate, equipmentEstimate]
  );

  const handleExportRabCsv = () => {
    const rows: Array<Array<string | number>> = [
      ["Bagian", "Uraian", "Qty / Basis", "Nominal Asli / Satuan", "Alokasi Program", "Total (IDR)", "Keterangan"],
    ];

    IYRC_REVENUE_ITEMS.forEach((r) => {
      rows.push([
        "1. Pendapatan",
        r.description,
        r.qty,
        r.unitPrice,
        r.programLabel,
        r.amount,
        r.sourceNote,
      ]);
    });

    scenario.myRobotRows.forEach((m) => {
      rows.push([
        "2. Invoice MY-ROBOT (USD)",
        m.description,
        m.qty,
        `USD ${m.unitUsd} (Total USD ${m.totalUsd})`,
        m.program,
        m.totalIdr,
        m.participants,
      ]);
    });

    rows.push(
      [
        "3. Robot Kit & Creative Kit",
        "Siswa SNT (penawaran pengadaan)",
        IYRC_PNL_ASSUMPTIONS.kitCountSnt,
        scenario.kitModalPerChild,
        "KIT_SNT",
        scenario.kitSntCost,
        `$${IYRC_PNL_ASSUMPTIONS.kitModalUsdPerChild} × kurs ${scenario.usdToIdr} + Rp2.000.000`,
      ],
      [
        "3. Robot Kit & Creative Kit",
        "Gretha",
        IYRC_PNL_ASSUMPTIONS.kitCountGretha,
        scenario.kitModalPerChild,
        "GRETHA",
        scenario.kitGrethaCost,
        `$${IYRC_PNL_ASSUMPTIONS.kitModalUsdPerChild} × kurs ${scenario.usdToIdr} + Rp2.000.000`,
      ],
      [
        "3. Robot Kit & Creative Kit",
        "Tunas Bangsa",
        IYRC_PNL_ASSUMPTIONS.kitCountTunasBangsa,
        scenario.kitModalPerChild,
        "TUNAS_BANGSA",
        scenario.kitTbCost,
        `$${IYRC_PNL_ASSUMPTIONS.kitModalUsdPerChild} × kurs ${scenario.usdToIdr} + Rp2.000.000`,
      ],
      [
        "3. Robot Kit & Creative Kit",
        "PPN keluaran disetor atas penjualan kit SNT (11/111 × harga)",
        1,
        scenario.ppnKitSnt,
        "KIT_SNT",
        scenario.ppnKitSnt,
        "Harga penawaran sudah termasuk PPN 12% × DPP Nilai Lain",
      ]
    );

    scenario.hotelRows.forEach((h) => {
      rows.push([
        "4. Hotel 88 Kedoya (Jakarta)",
        h.description,
        `${h.qty} × ${h.nightsOrDays}`,
        h.unitPrice,
        h.sharedWithGretha ? "SNT (4/5) & Gretha (1/5)" : "SNT",
        h.totalIdr,
        h.period,
      ]);
    });

    scenario.travelRows.forEach((t) => {
      rows.push([
        "5. Tiket Visa & Asuransi",
        t.label,
        t.count,
        t.perPerson,
        t.program,
        t.totalIdr,
        "Tiket Rp6,5jt + Visa Rp1,5jt + Asuransi Rp300rb",
      ]);
    });

    scenario.additionalRows.forEach((a) => {
      rows.push([
        "8. Biaya Tambahan (upNov26)",
        a.description,
        a.date,
        a.currency === "USD" ? `USD ${a.originalAmount}` : a.originalAmount,
        a.allocationLabel,
        a.computedIdr,
        a.proofNote,
      ]);
    });

    rows.push([
      "8. Biaya Tambahan (upNov26)",
      "Pembelian alat-alat (estimasi / belum ada nota)",
      "-",
      equipmentEstimate,
      "Bersama",
      equipmentEstimate,
      equipmentEstimate > 0 ? "Simulasi estimasi" : "BELUM ADA NOTA",
    ]);

    rows.push(
      ["6. Hasil Gabungan", "Total Pendapatan", "", "", "", scenario.totalRevenue, ""],
      ["6. Hasil Gabungan", "Total Biaya", "", "", "", scenario.totalExpense, ""],
      [
        "6. Hasil Gabungan",
        "Laba / (Rugi) Bersih",
        "",
        "",
        "",
        scenario.netProfit,
        `Margin ${scenario.marginPct.toFixed(2)}%`,
      ]
    );

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvString = "\uFEFF" + rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RAB_IYRC_China_2026_upNov26_kurs${scenario.usdToIdr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* PANEL SIMULATOR KURS USD & ESTIMASI ALAT-ALAT */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                <Calculator size={12} /> RAB &amp; Asumsi Proyek: {IYRC_PNL_VERSION}
              </span>
              {isSimulated && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Mode Simulasi Aktif
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Rincian Anggaran Biaya (RAB) Lengkap &amp; Simulator Sensitivitas
            </h2>
            <p className="text-xs text-slate-500">
              Selaras 100% dengan Excel <strong>IYRC_China_2026_upNov26.xlsx</strong>. Ubah kurs USD atau masukkan estimasi <em>Pembelian alat-alat</em> (baris kuning) untuk melihat dampaknya ke Laba Bersih secara instan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isSimulated && (
              <button
                type="button"
                onClick={() => {
                  setUsdRate(IYRC_PNL_ASSUMPTIONS.usdToIdr);
                  setEquipmentEstimate(0);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 cursor-pointer"
              >
                <RotateCcw size={13} /> Reset Asumsi Excel
              </button>
            )}
            <button
              type="button"
              onClick={handleExportRabCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              <Download size={14} /> Export CSV RAB
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          {/* Simulator Kurs USD */}
          <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 space-y-2">
            <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Coins size={14} className="text-amber-600" />
              Asumsi Kurs USD → IDR (Sel C5)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Rp</span>
              <input
                type="number"
                step={100}
                min={10000}
                max={30000}
                value={usdRate}
                onChange={(e) => setUsdRate(Number(e.target.value) || IYRC_PNL_ASSUMPTIONS.usdToIdr)}
                className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="text-[11px] text-amber-900/80">
              Mempengaruhi MY-ROBOT ($7.070), Modal Kit ($190 × 7 anak), &amp; Trainer MRT ($1.166). Total eksposur: <strong>$9.566</strong>.
            </p>
          </div>

          {/* Simulator Pembelian Alat-Alat */}
          <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 space-y-2">
            <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Wrench size={14} className="text-amber-600" />
              Estimasi Pembelian Alat-Alat (Baris 89)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Rp</span>
              <input
                type="number"
                step={100000}
                min={0}
                value={equipmentEstimate}
                onChange={(e) => setEquipmentEstimate(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="text-[11px] text-amber-900/80">
              Default Excel: <strong>Rp 0 (belum ada nota)</strong>. Dialokasikan ke pos <em>Staf RE &amp; Biaya Bersama</em>.
            </p>
          </div>

          {/* Ringkasan Asumsi Tarif Tetap */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5 text-xs">
            <div className="font-bold text-slate-800">Parameter Tetap Excel (upNov26)</div>
            <div className="flex justify-between text-slate-600">
              <span>Tiket + Visa + Asuransi / org:</span>
              <strong className="font-mono text-slate-900">{formatCurrency(IYRC_PNL_ASSUMPTIONS.ticketVisaInsurancePerPerson)}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Peserta Dibiayai RE:</span>
              <strong className="text-slate-900">10 org (6 SNT · 1 Gretha · 3 Staf RE)</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Modal Kit / anak:</span>
              <strong className="font-mono text-slate-900">{formatCurrency(scenario.kitModalPerChild)}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Jumlah Kit Disediakan RE:</span>
              <strong className="text-slate-900">7 anak (4 SNT · 1 Gretha · 2 TB)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 bg-white shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
              <span>Total Pendapatan (Bag. 1)</span>
              <TrendingUp size={15} className="text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">
              {formatCurrency(scenario.totalRevenue)}
            </div>
            <p className="text-[11px] text-slate-500">6 sumber pendapatan (SNT, Gretha, TB, Kit)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 bg-white shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
              <span>Total Pagu Biaya</span>
              <TrendingDown size={15} className="text-rose-600" />
            </div>
            <div className="text-xl font-extrabold text-rose-700 font-mono">
              {formatCurrency(scenario.totalExpense)}
            </div>
            <p className="text-[11px] text-slate-500">MY-ROBOT + Kit/PPN + Hotel + Tiket + Bag. 8</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600 bg-white shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
              <span>Laba / (Rugi) Bersih</span>
              <Calculator size={15} className="text-indigo-600" />
            </div>
            <div
              className={`text-xl font-extrabold font-mono ${
                scenario.netProfit >= 0 ? "text-indigo-700" : "text-rose-700"
              }`}
            >
              {formatCurrency(scenario.netProfit)}
            </div>
            <p className="text-[11px] text-slate-500">
              {isSimulated ? "Hasil simulasi kurs/alat-alat" : "Sesuai Bagian 6 Excel upNov26"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-white shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
              <span>Margin Bersih</span>
              <Percent size={15} className="text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {scenario.marginPct.toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-500">Turun dari 21,0% (upNov10) pasca Bag. 8</p>
          </CardContent>
        </Card>
      </div>

      {/* BAGIAN 1: PENDAPATAN */}
      <Card className="shadow-xs overflow-hidden border border-slate-200">
        <CardHeader className="py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900">
            Bagian 1 · Rincian Pendapatan (6 Sumber)
          </CardTitle>
          <span className="font-mono font-extrabold text-sm text-emerald-700">
            {formatCurrency(scenario.totalRevenue)}
          </span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-4 py-2.5 text-left">Uraian Pendapatan</th>
                <th className="px-4 py-2.5 text-center">Qty</th>
                <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                <th className="px-4 py-2.5 text-right">Total (IDR)</th>
                <th className="px-4 py-2.5 text-left">Sumber / Referensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {IYRC_REVENUE_ITEMS.map((item) => (
                <tr key={item.budgetPos} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-semibold text-slate-900">{item.description}</td>
                  <td className="px-4 py-2.5 text-center font-mono">{item.qty}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{item.sourceNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* BAGIAN 2: INVOICE MY-ROBOT (USD) */}
      <Card className="shadow-xs overflow-hidden border border-slate-200">
        <CardHeader className="py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900">
            Bagian 2 · Invoice MY-ROBOT WW2611-00002 (USD {scenario.totalMyRobotUsd.toLocaleString("id-ID")} @ Rp {scenario.usdToIdr.toLocaleString("id-ID")})
          </CardTitle>
          <span className="font-mono font-extrabold text-sm text-rose-700">
            {formatCurrency(scenario.totalMyRobotIdr)}
          </span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-4 py-2.5 text-left">Paket Registrasi</th>
                <th className="px-4 py-2.5 text-center">Qty</th>
                <th className="px-4 py-2.5 text-right">Harga (USD)</th>
                <th className="px-4 py-2.5 text-right">Total (USD)</th>
                <th className="px-4 py-2.5 text-right">Total (IDR)</th>
                <th className="px-4 py-2.5 text-left">Peserta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {scenario.myRobotRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-semibold text-slate-900">{row.description}</td>
                  <td className="px-4 py-2.5 text-center font-mono">{row.qty}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                    ${row.unitUsd.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-indigo-700">
                    ${row.totalUsd.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-700">
                    {formatCurrency(row.totalIdr)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{row.participants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* BAGIAN 3 & BAGIAN 5 (SIDE BY SIDE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bagian 3: Robot Kit & PPN */}
        <Card className="shadow-xs overflow-hidden border border-slate-200">
          <CardHeader className="py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">
              Bagian 3 · Robot Kit, Creative Kit &amp; PPN
            </CardTitle>
            <span className="font-mono font-extrabold text-sm text-rose-700">
              {formatCurrency(scenario.totalKitPpn)}
            </span>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Komponen</th>
                  <th className="px-4 py-2.5 text-center">Anak</th>
                  <th className="px-4 py-2.5 text-right">Modal / Anak</th>
                  <th className="px-4 py-2.5 text-right">Total (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="px-4 py-2.5 font-semibold text-slate-900">Siswa SNT (Penawaran 001)</td>
                  <td className="px-4 py-2.5 text-center font-mono">{IYRC_PNL_ASSUMPTIONS.kitCountSnt}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(scenario.kitModalPerChild)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-700">
                    {formatCurrency(scenario.kitSntCost)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-semibold text-slate-900">Gretha (Paket Pemda)</td>
                  <td className="px-4 py-2.5 text-center font-mono">{IYRC_PNL_ASSUMPTIONS.kitCountGretha}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(scenario.kitModalPerChild)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-700">
                    {formatCurrency(scenario.kitGrethaCost)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-semibold text-slate-900">Tunas Bangsa</td>
                  <td className="px-4 py-2.5 text-center font-mono">{IYRC_PNL_ASSUMPTIONS.kitCountTunasBangsa}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(scenario.kitModalPerChild)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-700">
                    {formatCurrency(scenario.kitTbCost)}
                  </td>
                </tr>
                <tr className="bg-slate-50/70">
                  <td className="px-4 py-2.5 font-semibold text-slate-900" colSpan={3}>
                    PPN Keluaran Disetor atas Kit SNT (11/111 × Rp 42,4 jt)
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-700">
                    {formatCurrency(scenario.ppnKitSnt)}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Bagian 5: Tiket, Visa & Asuransi */}
        <Card className="shadow-xs overflow-hidden border border-slate-200">
          <CardHeader className="py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">
              Bagian 5 · Tiket, Visa &amp; Asuransi (10 Orang)
            </CardTitle>
            <span className="font-mono font-extrabold text-sm text-rose-700">
              {formatCurrency(scenario.totalTravel)}
            </span>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Kelompok</th>
                  <th className="px-4 py-2.5 text-center">Orang</th>
                  <th className="px-4 py-2.5 text-right">Per Orang</th>
                  <th className="px-4 py-2.5 text-right">Total (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {scenario.travelRows.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{t.label}</td>
                    <td className="px-4 py-2.5 text-center font-mono">{t.count}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(t.perPerson)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-700">
                      {t.totalIdr > 0 ? formatCurrency(t.totalIdr) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 bg-indigo-50/60 border-t border-indigo-100 text-[11px] text-indigo-900">
              Staf RE turun dari 4 → <strong>3 orang</strong> (Wisnu, Agung, Jully); tiket Lauw Mei Hoa (Rp 7.361.300) dicatat aktual di Bagian 8.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BAGIAN 4: HOTEL 88 KEDOYA */}
      <Card className="shadow-xs overflow-hidden border border-slate-200">
        <CardHeader className="py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900">
            Bagian 4 · Hotel 88 Kedoya (Jakarta) — Porsi SNT {formatCurrency(scenario.sntHotelShare)} · Porsi Gretha (1/5 siswa) {formatCurrency(scenario.grethaHotelShare)}
          </CardTitle>
          <span className="font-mono font-extrabold text-sm text-rose-700">
            {formatCurrency(scenario.totalHotel)}
          </span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-4 py-2.5 text-left">Kamar / Fasilitas</th>
                <th className="px-4 py-2.5 text-center">Kamar/Pax</th>
                <th className="px-4 py-2.5 text-center">Malam/Hari</th>
                <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                <th className="px-4 py-2.5 text-right">Total (IDR)</th>
                <th className="px-4 py-2.5 text-left">Periode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {scenario.hotelRows.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-semibold text-slate-900">{h.description}</td>
                  <td className="px-4 py-2.5 text-center font-mono">{h.qty}</td>
                  <td className="px-4 py-2.5 text-center font-mono">{h.nightsOrDays}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(h.unitPrice)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-700">
                    {formatCurrency(h.totalIdr)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{h.period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* BAGIAN 8: BIAYA TAMBAHAN REALISASI (upNov26) */}
      <Card className="shadow-xs overflow-hidden border border-slate-200">
        <CardHeader className="py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Bagian 8 · Biaya Tambahan Realisasi s.d. 26 Nov 2026 (13 Item + 1 Belum Ada Nota)
            </CardTitle>
            <p className="text-[11px] text-slate-500 mt-0.5">
              12 item berbukti nota/transfer otomatis masuk Cashflow sebagai Lunas; Invoice Trainer MRT ($1.166) masuk sebagai Pending.
            </p>
          </div>
          <span className="font-mono font-extrabold text-sm text-rose-700">
            {formatCurrency(scenario.totalAdditionalWithEquip)}
          </span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-4 py-2.5 text-left">Tanggal</th>
                <th className="px-4 py-2.5 text-left">Uraian &amp; Bukti</th>
                <th className="px-4 py-2.5 text-center">Alokasi</th>
                <th className="px-4 py-2.5 text-right">Nominal Asli</th>
                <th className="px-4 py-2.5 text-right">Total (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {scenario.additionalRows.map((a) => (
                <tr key={a.seedKey} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 font-medium">
                    {new Date(`${a.date}T00:00:00Z`).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-900">{a.description}</div>
                    <div className="text-[11px] text-slate-500">{a.proofNote}</div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                      {a.allocationLabel}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                    {a.currency === "USD"
                      ? `USD ${a.originalAmount.toLocaleString("id-ID")}`
                      : formatCurrency(a.originalAmount)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-700">
                    {formatCurrency(a.computedIdr)}
                  </td>
                </tr>
              ))}
              <tr className="bg-amber-50/80">
                <td className="px-4 py-2.5 whitespace-nowrap font-bold text-amber-900">Belum ada</td>
                <td className="px-4 py-2.5">
                  <div className="font-bold text-amber-950">Pembelian alat-alat</div>
                  <div className="text-[11px] text-amber-800">
                    BELUM ADA NOTA — gunakan simulator di atas atau catat di Tab Laba Rugi saat nota tersedia
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                    Bersama
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-amber-900">
                  {equipmentEstimate > 0 ? formatCurrency(equipmentEstimate) : "-"}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-900">
                  {formatCurrency(equipmentEstimate)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* BAGIAN 7: RINGKASAN PER PROGRAM + CATATAN RISIKO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-xs overflow-hidden border border-slate-200">
          <CardHeader className="py-3.5 bg-slate-50/70 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Bagian 7 · Alokasi RAB &amp; Laba/(Rugi) per Program {isSimulated ? "(Simulasi)" : "(upNov26)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Program</th>
                  <th className="px-4 py-2.5 text-right">Pendapatan</th>
                  <th className="px-4 py-2.5 text-right">Biaya</th>
                  <th className="px-4 py-2.5 text-right">Laba / (Rugi)</th>
                  <th className="px-4 py-2.5 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {scenario.programBreakdown.map((p) => {
                  const progMargin =
                    p.revenueBudget > 0 ? (p.profitBudget / p.revenueBudget) * 100 : null;
                  return (
                    <tr key={p.program} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5">
                        <div className="font-bold text-slate-900">{p.label}</div>
                        <div className="text-[11px] text-slate-500">{p.allocationNote}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700">
                        {p.revenueBudget > 0 ? formatCurrency(p.revenueBudget) : "-"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-rose-700">
                        {formatCurrency(p.expenseBudget)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-mono font-bold ${
                          p.profitBudget >= 0 ? "text-indigo-700" : "text-rose-700"
                        }`}
                      >
                        {formatCurrency(p.profitBudget)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-600">
                        {progMargin !== null ? `${progMargin.toFixed(1)}%` : "-"}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-100 font-extrabold text-slate-900">
                  <td className="px-4 py-3">Total Gabungan</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700">
                    {formatCurrency(scenario.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-700">
                    {formatCurrency(scenario.totalExpense)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-800">
                    {formatCurrency(scenario.netProfit)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-800">
                    {scenario.marginPct.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle size={17} className="text-amber-600 shrink-0" />
            <span>Belum Dihitung di RAB (Risiko Tambahan)</span>
          </div>
          <ul className="space-y-2 text-xs text-amber-950 list-disc pl-4">
            {IYRC_UNBUDGETED_NOTES.map((note, idx) => (
              <li key={idx} className="leading-relaxed">
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
