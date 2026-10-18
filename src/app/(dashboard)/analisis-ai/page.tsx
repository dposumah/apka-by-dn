'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  TrendingUp,
  Scissors,
  ShieldCheck,
  Target,
  RefreshCw,
  Send,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Wallet,
  DollarSign,
  Printer,
  ChevronRight,
  Bot,
  User,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { generateFinancialAIAnalysis, askFinancialAIChat, getFinancialAIData } from '@/actions/financial-ai';
import Link from 'next/link';

interface QnAItem {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

export default function AnalisisAIPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [kpiData, setKpiData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Chat Q&A State
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<QnAItem[]>([]);

  // Load KPI data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setInitialLoading(true);
        const data = await getFinancialAIData();
        setKpiData(data);
      } catch (err: any) {
        console.error('Failed to load financial data:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, []);

  const handleGenerateAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateFinancialAIAnalysis();
      if (res.success) {
        setAnalysisResult(res);
      } else {
        setError(res.error || 'Gagal memproses analisis AI');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (customQ?: string) => {
    const q = customQ || question;
    if (!q.trim() || asking) return;

    setAsking(true);
    const newQId = Date.now().toString();
    try {
      const res = await askFinancialAIChat(q);
      if (res.success && res.answer) {
        setChatHistory((prev) => [
          ...prev,
          {
            id: newQId,
            question: q,
            answer: res.answer || '',
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        if (!customQ) setQuestion('');
      } else {
        alert(res.error || 'Gagal mendapatkan tanggapan dari AI');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setAsking(false);
    }
  };

  // Helper to render markdown text neatly
  const renderFormattedMarkdown = (text: string) => {
    if (!text) return null;

    const sections = text.split('\n\n');

    return (
      <div className="space-y-4 text-slate-800 leading-relaxed text-sm">
        {sections.map((sec, idx) => {
          // Headers
          if (sec.startsWith('### ')) {
            const title = sec.replace('### ', '');
            return (
              <div key={idx} className="pt-3 pb-1 border-b border-slate-200">
                <h3 className="text-base font-bold text-indigo-950 flex items-center gap-2">
                  {title}
                </h3>
              </div>
            );
          }
          if (sec.startsWith('## ')) {
            const title = sec.replace('## ', '');
            return (
              <div key={idx} className="pt-4 pb-2 border-b-2 border-indigo-200">
                <h2 className="text-lg font-extrabold text-indigo-900">{title}</h2>
              </div>
            );
          }

          // Bullet lists
          if (sec.startsWith('- ') || sec.includes('\n- ')) {
            const items = sec.split('\n').filter((l) => l.trim().startsWith('- '));
            return (
              <ul key={idx} className="space-y-1.5 pl-2">
                {items.map((item, itemIdx) => {
                  const cleaned = item.replace(/^- /, '');
                  return (
                    <li key={itemIdx} className="flex items-start gap-2 text-slate-700">
                      <span className="text-indigo-600 font-bold mt-0.5">•</span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: cleaned.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>'),
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            );
          }

          // Numbered lists
          if (sec.match(/^\d+\.\s/m)) {
            const items = sec.split('\n').filter((l) => l.match(/^\d+\.\s/));
            return (
              <ol key={idx} className="space-y-2 pl-2">
                {items.map((item, itemIdx) => {
                  const cleaned = item.replace(/^\d+\.\s*/, '');
                  return (
                    <li key={itemIdx} className="flex items-start gap-2.5 text-slate-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                        {itemIdx + 1}
                      </span>
                      <span
                        className="flex-1"
                        dangerouslySetInnerHTML={{
                          __html: cleaned.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>'),
                        }}
                      />
                    </li>
                  );
                })}
              </ol>
            );
          }

          // Regular paragraphs with bold styling
          return (
            <p
              key={idx}
              className="text-slate-700"
              dangerouslySetInnerHTML={{
                __html: sec.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-950 font-semibold">$1</strong>'),
              }}
            />
          );
        })}
      </div>
    );
  };

  const presetQuestions = [
    'Bagaimana evaluasi profitabilitas proyek KKA SNT 2026 saat ini?',
    'Di pos beban mana perusahaan bisa melakukan penghematan terbesar?',
    'Apakah cadangan kas saat ini aman untuk belanja aset baru?',
    'Bagaimana cara meningkatkan diversifikasi omset agar tidak bergantung 1 termin?',
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-700/60 border border-indigo-400/30 text-xs font-semibold text-indigo-200">
            <Sparkles size={13} className="text-amber-300" />
            AI Financial Advisor • Google Gemini
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Analisis & Rekomendasi Finansial AI
          </h1>
          <p className="text-indigo-200 text-xs md:text-sm leading-relaxed">
            Konsultan keuangan cerdas untuk menganalisis kinerja pembukuan riil, mengukur profit murni,
            menemukan titik efisiensi biaya, serta merekomendasikan strategi peningkatan omset PT. JT Robotic Explorer.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 z-10 shrink-0">
          <Button
            onClick={handleGenerateAnalysis}
            disabled={loading}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold shadow-lg hover:shadow-xl transition-all gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Menganalisis Data...' : 'Mulai / Perbarui Analisis AI'}
          </Button>
          {analysisResult && (
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2"
            >
              <Printer size={16} />
              Cetak Laporan
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Score Card */}
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Skor Kesehatan Keuangan
            </CardDescription>
            <CardTitle className="text-2xl font-black text-indigo-950 flex items-center justify-between">
              <span>{analysisResult ? `${analysisResult.healthScore}/100` : '92/100'}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {analysisResult?.healthStatus || 'Surplus Kuat'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Margin Laba Bersih:{' '}
              <span className="font-bold text-slate-800">
                {kpiData?.kpi?.profitMargin || 93.1}%
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Total Pendapatan */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Pendapatan Bulan Ini
            </CardDescription>
            <CardTitle className="text-xl font-black text-emerald-700">
              {formatCurrency(kpiData?.kpi?.revenue || 634752389)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Termin 1 KKA SNT:{' '}
              <span className="font-bold text-slate-800">Rp 631,7 Jt</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Beban */}
        <Card className="border-rose-200 bg-gradient-to-br from-rose-50/50 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Beban Operasional & Proyek
            </CardDescription>
            <CardTitle className="text-xl font-black text-rose-600">
              {formatCurrency(kpiData?.kpi?.expense || 43491451)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Rasio Beban/Omset:{' '}
              <span className="font-bold text-slate-800">
                {kpiData?.kpi?.revenue
                  ? Math.round((kpiData.kpi.expense / kpiData.kpi.revenue) * 1000) / 10
                  : 6.9}%
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Saldo Kas & Runway */}
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50/50 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Likuiditas Kas & Bank
            </CardDescription>
            <CardTitle className="text-xl font-black text-teal-700">
              {formatCurrency(kpiData?.kpi?.cashAndBank || 646515497)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Ketahanan Operasional:{' '}
              <span className="font-bold text-teal-800">
                ~{kpiData?.kpi?.cashRunwayMonths || 14.9} Bulan
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Full AI Report (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Laporan Rekomendasi Eksekutif
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {analysisResult?.generatedAt
                      ? `Dianalisis pada ${analysisResult.generatedAt}`
                      : 'Hasil analisis menyeluruh terhadap pembukuan perusahaan'}
                  </CardDescription>
                </div>
                {analysisResult && (
                  <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 text-xs py-1">
                    Google Gemini 2.5/Flash
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">Sedang Menganalisis Keuangan Perusahaan...</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      AI sedang meninjau jurnal umum, margin laba rugi, akun kas & bank, serta realisasi proyek KKA SNT.
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 space-y-2">
                  <div className="font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Gagal Menerima Analisis AI
                  </div>
                  <p className="text-xs">{error}</p>
                  <Button size="sm" variant="outline" onClick={handleGenerateAnalysis} className="mt-2 text-xs">
                    Coba Lagi
                  </Button>
                </div>
              ) : analysisResult ? (
                <div className="prose max-w-none">
                  {renderFormattedMarkdown(analysisResult.rawText)}
                </div>
              ) : (
                <div className="py-12 px-6 text-center space-y-4 bg-gradient-to-b from-indigo-50/40 to-transparent rounded-xl border border-dashed border-indigo-200">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
                    <Lightbulb className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="font-bold text-base text-slate-900">
                      Belum Ada Hasil Analisis Baru
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Klik tombol di bawah untuk meminta AI membaca laporan keuangan bulan ini,
                      memberikan rekomendasi pemangkasan biaya, serta strategi peningkatan profit.
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateAnalysis}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2"
                  >
                    <Sparkles size={16} />
                    Jalankan Analisis Finansial AI Sekarang
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive Chat & Quick Advice (1 col) */}
        <div className="space-y-6">
          {/* Interactive Q&A Card */}
          <Card className="border-indigo-200 shadow-sm flex flex-col h-[580px]">
            <CardHeader className="border-b bg-indigo-50/50 pb-3">
              <CardTitle className="text-base font-bold text-indigo-950 flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                Tanya Konsultan Finansial AI
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Tanyakan pertanyaan spesifik tentang strategi bisnis atau pengeluaran Anda.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <HelpCircle size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-700">Pilih Pertanyaan Cepat</p>
                    <p className="text-[11px] text-slate-400">
                      Klik salah satu topik di bawah untuk konsultasi langsung:
                    </p>
                  </div>
                  <div className="space-y-1.5 text-left">
                    {presetQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskQuestion(q)}
                        disabled={asking}
                        className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs font-medium text-slate-700 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((chat) => (
                    <div key={chat.id} className="space-y-2">
                      {/* User message */}
                      <div className="flex items-start gap-2 justify-end">
                        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-3.5 py-2 text-xs max-w-[85%] shadow-sm">
                          {chat.question}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          <User size={12} />
                        </div>
                      </div>

                      {/* AI response */}
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                          <Bot size={12} />
                        </div>
                        <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none p-3 text-xs max-w-[90%] border border-slate-200 prose prose-indigo">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: chat.answer
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br/>'),
                            }}
                          />
                          <span className="block mt-1.5 text-[9px] text-slate-400 text-right">
                            {chat.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {asking && (
                    <div className="flex items-center gap-2 text-xs text-indigo-600 italic">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Konsultan AI sedang menyusun jawaban...
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            {/* Chat Input */}
            <div className="p-3 border-t bg-slate-50/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskQuestion();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ketik pertanyaan keuangan Anda..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={asking}
                  className="flex-1 px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={asking || !question.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                >
                  <Send size={14} />
                </Button>
              </form>
            </div>
          </Card>

          {/* Quick Action Navigation Card */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">
                Pusat Navigasi Terkait
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/laporan/kka-snt"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 text-xs font-semibold text-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="p-1 rounded bg-emerald-100 text-emerald-700">🤖</span>
                  <span>Laporan Proyek KKA SNT 2026</span>
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
              <Link
                href="/laporan/laba-rugi"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="p-1 rounded bg-blue-100 text-blue-700">📊</span>
                  <span>Laporan Laba Rugi Perusahaan</span>
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
              <Link
                href="/laporan/arus-kas"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-teal-300 hover:bg-teal-50/40 text-xs font-semibold text-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="p-1 rounded bg-teal-100 text-teal-700">🌊</span>
                  <span>Laporan Arus Kas Likuid</span>
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
              <Link
                href="/cashflow"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs font-semibold text-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="p-1 rounded bg-indigo-100 text-indigo-700">✨</span>
                  <span>Cashflow 3 Proyek (Bina/ASMI/IYRC)</span>
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
