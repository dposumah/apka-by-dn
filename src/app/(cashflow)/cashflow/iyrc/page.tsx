import { redirect } from "next/navigation";
import { getIyrcData } from "@/actions/iyrc";
import IyrcClientPage from "./IyrcClientPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "IYRC China 2026 - Rencana Anggaran & Kontingen",
};

export default async function IyrcPage() {
  const data = await getIyrcData();

  if ("unauthorized" in data && data.unauthorized) {
    redirect("/login");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <IyrcClientPage initialData={data} />
    </div>
  );
}
