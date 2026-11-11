import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyReceiptToken } from "@/lib/receipt-link";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string; type: string }> }
) {
  try {
    const { id, type } = await context.params;

    if (type !== "h" && type !== "t") {
      return NextResponse.json({ error: "Tipe bukti tidak valid" }, { status: 400 });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("k");
    if (!verifyReceiptToken(id, type, token)) {
      return NextResponse.json(
        { error: "Tautan bukti tidak valid atau akses ditolak" },
        { status: 403 }
      );
    }

    const rekap = await prisma.rekapHonorarium.findUnique({
      where: { id },
      select: {
        bulan: true,
        buktiPembayaranHonor: true,
        buktiPembayaranTransport: true,
        fasilitator: { select: { namaLengkap: true } },
      },
    });

    if (!rekap) {
      return NextResponse.json({ error: "Data rekap tidak ditemukan" }, { status: 404 });
    }

    const sourceUrl =
      type === "h" ? rekap.buktiPembayaranHonor : rekap.buktiPembayaranTransport;

    if (!sourceUrl) {
      return NextResponse.json(
        { error: "Bukti transfer belum tersedia" },
        { status: 404 }
      );
    }

    // Validasi SSRF: hanya fetch URL storage resmi aplikasi ini
    const supabaseOrigin = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(
      /\/+$/,
      ""
    );
    if (!supabaseOrigin || !sourceUrl.startsWith(supabaseOrigin)) {
      return NextResponse.json(
        { error: "Sumber berkas bukti tidak diizinkan" },
        { status: 403 }
      );
    }

    const upstream = await fetch(sourceUrl, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Gagal memuat berkas bukti dari penyimpanan" },
        { status: 502 }
      );
    }

    const contentType =
      upstream.headers.get("content-type") ||
      (sourceUrl.toLowerCase().includes(".pdf") ? "application/pdf" : "image/png");
    const ext = contentType.includes("pdf")
      ? "pdf"
      : contentType.includes("jpeg") || contentType.includes("jpg")
      ? "jpg"
      : "png";

    const safeName = (rekap.fasilitator?.namaLengkap || "Fasilitator")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const labelType = type === "h" ? "Honor" : "Transport";
    const filename = `Bukti_${labelType}_${safeName}_${rekap.bulan || "SNT"}.${ext}`;

    const bytes = await upstream.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("GET /b/[id]/[type] error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menampilkan bukti transfer" },
      { status: 500 }
    );
  }
}
