import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import {
  FALLBACK_FX_RATES,
  InvoicePaymentOption,
  ParsedInvoiceData,
} from "@/lib/cashflow-invoice";

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB

async function fetchExchangeRateToIdr(
  currency: string
): Promise<{ rate: number; source: string }> {
  const cur = (currency || "IDR").toUpperCase();
  if (cur === "IDR" || cur === "RP") {
    return { rate: 1, source: "IDR" };
  }

  const fallback = FALLBACK_FX_RATES[cur] || 15900;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(cur)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const idrRate = Number(json?.rates?.IDR);
      if (idrRate && Number.isFinite(idrRate) && idrRate > 0) {
        return { rate: Math.round(idrRate), source: "Kurs Pasar Live (dapat diedit)" };
      }
    }
  } catch (err) {
    console.warn("FX rate lookup fallback:", err);
  }
  return { rate: fallback, source: "Estimasi Kurs Default (silakan sesuaikan)" };
}

async function callGeminiInvoiceParser(
  ai: GoogleGenAI,
  pdfBase64: string,
  prompt: string
): Promise<string> {
  const modelCandidates = [
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-2.5-flash",
  ];
  let lastError: any = null;

  for (const model of modelCandidates) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
                { text: prompt },
              ],
            },
          ],
          config: { responseMimeType: "application/json" },
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || "";
        const retryable =
          msg.includes("503") ||
          msg.includes("429") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("RESOURCE_EXHAUSTED");
        console.warn(`[Invoice AI] ${model} attempt ${attempt} failed:`, msg);
        if (retryable) {
          await new Promise((r) => setTimeout(r, 900 * attempt));
        } else {
          break;
        }
      }
    }
  }

  const rawMsg = String(lastError?.message || "");
  if (rawMsg.includes("503") || rawMsg.includes("high demand") || rawMsg.includes("UNAVAILABLE")) {
    throw new Error(
      "Server AI Google Gemini sedang mengalami antrean tinggi sementara. Mohon klik ulang Scan PDF beberapa detik lagi."
    );
  }
  throw new Error(rawMsg || "Layanan AI Gemini gagal memproses PDF invoice saat ini.");
}

function filterDistinctSections(sections: ParsedInvoiceData["detectedSections"]) {
  return (sections || []).filter((s) => {
    const lbl = (s?.label || "").toLowerCase().trim();
    return (
      lbl.length > 0 &&
      !lbl.includes("sub total") &&
      !lbl.includes("subtotal") &&
      !lbl.includes("grand total") &&
      !lbl.includes("total keseluruhan") &&
      !lbl.includes("rest payment") &&
      !lbl.includes("down payment") &&
      Number(s.amount) > 0
    );
  });
}

function buildPaymentOptions(parsed: ParsedInvoiceData): InvoicePaymentOption[] {
  const options: InvoicePaymentOption[] = [];
  const primaryTotal = Number(parsed.originalAmount) || 0;
  const distinctSections = filterDistinctSections(parsed.detectedSections);
  const sectionsSum = distinctSections.reduce(
    (sum, s) => sum + (Number(s.amount) || 0),
    0
  );
  const isUsdLike = (parsed.currency || "IDR").toUpperCase() !== "IDR";
  const diffThreshold = isUsdLike ? 1 : 1000;
  const hasUnmergedSections =
    distinctSections.length > 1 &&
    Boolean(parsed.amountAnomalyNote) &&
    sectionsSum > primaryTotal + diffThreshold &&
    primaryTotal > 0;

  const termsLower = (parsed.paymentTermsSummary || "").toLowerCase();
  const hasHalfDeposit =
    termsLower.includes("50%") ||
    termsLower.includes("deposit") ||
    termsLower.includes("dp ");

  const pushUnique = (label: string, amount: number, scheme: string) => {
    if (!(amount > 0)) return;
    if (!options.some((o) => Math.abs(o.amount - amount) < 0.01 && o.label === label)) {
      options.push({ label, amount, scheme });
    }
  };

  if (primaryTotal > 0) {
    pushUnique(
      hasUnmergedSections ? "Total Tertulis Dokumen (100%)" : "Bayar Penuh (100%)",
      primaryTotal,
      "Full 100%"
    );
  }

  if (hasHalfDeposit && primaryTotal > 0) {
    pushUnique("DP 50% (Sesuai Syarat)", Number((primaryTotal * 0.5).toFixed(2)), "DP 50%");
  }

  if (hasUnmergedSections) {
    pushUnique(
      "Gabungan Seluruh Bagian (100%)",
      Number(sectionsSum.toFixed(2)),
      "Full Gabungan Seksi"
    );
    if (hasHalfDeposit) {
      pushUnique(
        "DP 50% Gabungan Seksi",
        Number((sectionsSum * 0.5).toFixed(2)),
        "DP 50% Gabungan"
      );
    }
  }

  // Merge any extra distinct options proposed by AI
  for (const aiOpt of parsed.suggestedPaymentOptions || []) {
    const amt = Number(aiOpt.amount) || 0;
    if (amt > 0 && !options.some((o) => Math.abs(o.amount - amt) < 0.01)) {
      options.push({ label: aiOpt.label, amount: amt, scheme: aiOpt.label });
    }
  }

  return options;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role === "FASILITATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let apiKey = process.env.GEMINI_API_KEY || "";
    if (apiKey.startsWith('"') && apiKey.endsWith('"')) apiKey = apiKey.slice(1, -1);
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum dikonfigurasi pada file .env" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileUrl = formData.get("fileUrl") as string | null;

    let pdfBuffer: Buffer | null = null;

    if (file && file.size > 0) {
      if (file.size > MAX_PDF_BYTES) {
        return NextResponse.json(
          { error: "Ukuran file PDF maksimal 20 MB." },
          { status: 400 }
        );
      }
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        return NextResponse.json(
          { error: "Hanya file PDF (.pdf) yang didukung untuk scan invoice." },
          { status: 400 }
        );
      }
      pdfBuffer = Buffer.from(await file.arrayBuffer());
    } else if (fileUrl) {
      // Validasi SSRF: hanya izinkan URL dari Supabase Storage aplikasi ini
      const allowedPrefix = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
      if (!allowedPrefix || !fileUrl.startsWith(allowedPrefix)) {
        return NextResponse.json(
          { error: "URL file PDF tidak valid atau bukan dari storage aplikasi." },
          { status: 400 }
        );
      }
      const fetchRes = await fetch(fileUrl);
      if (!fetchRes.ok) {
        return NextResponse.json(
          { error: "Gagal mengambil file PDF dari storage untuk dianalisis." },
          { status: 400 }
        );
      }
      const ab = await fetchRes.arrayBuffer();
      if (ab.byteLength > MAX_PDF_BYTES) {
        return NextResponse.json(
          { error: "Ukuran file PDF maksimal 20 MB." },
          { status: 400 }
        );
      }
      pdfBuffer = Buffer.from(ab);
    } else {
      return NextResponse.json(
        { error: "Tidak ada file PDF invoice yang dikirim." },
        { status: 400 }
      );
    }

    const projects = await prisma.cashflowProject.findMany({
      orderBy: { name: "asc" },
      select: { name: true, description: true },
    });
    const projectNames = projects.map((p) => p.name);

    const prompt = `Anda adalah sistem OCR & Ekstraksi Akuntansi ahli. Analisis SELURUH HALAMAN dokumen PDF Invoice / Confirmation Letter / Tagihan ini dan kembalikan JSON VALID SAJA (tanpa markdown code fence).

Daftar nama proyek yang ada di sistem: ${JSON.stringify(projectNames)}.
Panduan pencocokan proyek (suggestedProject):
- Gunakan "IYRC" bila dokumen menyebut IYRC, Shenzhen, China, MY-ROBOT, Pelatihan/Akomodasi Jakarta bulan Nov-Des, Greenville Jakarta Barat, Mrs. Jully, Hotel Kedoya/Grogol, Paspor, Visa, atau kontingen lomba robotik.
- Gunakan "Bina Insani" atau "ASMI" bila cocok dengan nama proyek tersebut.
- Jika ragu/tidak cocok, isi dengan nama proyek paling relevan atau null.

Instruksi penting ekstraksi:
1. Periksa setiap halaman sampai akhir dokumen untuk menemukan detail REKENING BANK TUJUAN TRANSFER (Nama Bank, Cabang, Nomor Rekening, Atas Nama, SWIFT Code, Alamat Bank). Jangan lewatkan rekening di halaman 2, 3, dst.
2. Periksa semua bagian/seksi biaya terpisah (misal A. Akomodasi Kamar, B. Ruang Meeting/Banquet, C. F&B) untuk dimasukkan ke detectedSections. JANGAN masukkan baris ringkasan "Sub Total" atau "Grand Total" ke detectedSections. Jika Total Keseluruhan di dokumen tidak menjumlahkan salah satu seksi (ada selisih), tuliskan penjelasan singkat pada amountAnomalyNote; jika semua sudah terjumlah dengan benar, set amountAnomalyNote ke null.
3. Pada lineItems hotel/akomodasi, pastikan qty & notes mencerminkan jumlah malam/kamar secara akurat (misal notes: "26 malam × 1 kamar"). Item FOC tetap dicatat dengan amount: 0 dan notes: "FOC".
4. Ekstrak syarat pembayaran / deposit (misal DP 50% s.d. H-14, Payment deadline, dll) ke paymentTermsSummary dan paymentDeadlineText.
5. Gunakan mata uang asli dokumen pada currency ("IDR", "USD", "MYR", "SGD", "CNY", "EUR").

Schema JSON yang WAJIB diikuti:
{
  "vendorName": "string",
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD or null",
  "paymentDeadlineText": "string or null",
  "suggestedProject": "string or null",
  "suggestedCategory": "string",
  "summaryTitle": "string (ringkasan 1 baris singkat untuk keterangan transaksi)",
  "currency": "IDR | USD | MYR | SGD | CNY | EUR",
  "originalAmount": number,
  "detectedSections": [
    { "label": "string", "amount": number }
  ],
  "paymentTermsSummary": "string or null",
  "suggestedPaymentOptions": [
    { "label": "string", "amount": number }
  ],
  "amountAnomalyNote": "string or null",
  "lineItems": [
    { "description": "string", "qty": number, "unitPrice": number, "amount": number, "notes": "string or null" }
  ],
  "bankAccount": {
    "bankName": "string",
    "branch": "string or null",
    "accountNumber": "string",
    "accountHolder": "string",
    "swiftCode": "string or null",
    "bankAddress": "string or null"
  },
  "picName": "string or null",
  "picPhone": "string or null"
}`;

    const ai = new GoogleGenAI({ apiKey });
    const rawJsonText = await callGeminiInvoiceParser(
      ai,
      pdfBuffer.toString("base64"),
      prompt
    );

    const cleanedText = rawJsonText
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed: ParsedInvoiceData;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      console.error("Invalid JSON from Gemini:", cleanedText);
      return NextResponse.json(
        { error: "AI mengembalikan format data yang tidak valid. Coba ulangi scan." },
        { status: 500 }
      );
    }

    const currency = (parsed.currency || "IDR").toUpperCase();
    const { rate, source } = await fetchExchangeRateToIdr(currency);

    const distinctSections = filterDistinctSections(parsed.detectedSections);
    const enriched: ParsedInvoiceData = {
      ...parsed,
      currency,
      originalAmount: Number(parsed.originalAmount) || 0,
      suggestedExchangeRate: rate,
      exchangeRateSource: source,
      detectedSections: distinctSections,
      lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
      bankAccount: parsed.bankAccount || {
        bankName: "",
        accountNumber: "",
        accountHolder: "",
      },
      suggestedPaymentOptions: buildPaymentOptions(parsed),
    };

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error("POST /api/cashflow/parse-invoice error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses PDF invoice" },
      { status: 500 }
    );
  }
}
