import { redirect } from "next/navigation";
import { getSntReportWorkspaceData } from "@/app/actions/snt-reports";
import { PaketLaporanClientPage } from "./client-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Paket Laporan SNT Wilayah 2 - Export PDF & Audit Kwitansi",
};

export default async function PaketLaporanPage() {
  const data = await getSntReportWorkspaceData();

  if (data.unauthorized) {
    redirect("/login");
  }

  return <PaketLaporanClientPage initialData={data} />;
}
