const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/portal/laporan/page.tsx', 'utf8');

if (!page.includes('getAppSetting')) {
  page = page.replace(
    /import \{ LaporanClientForm \} from "\.\/client-form"/,
    'import { LaporanClientForm } from "./client-form"\nimport { getAppSetting } from "@/app/actions/rab"'
  );
  
  page = page.replace(
    /<LaporanClientForm\s*fasilitatorId=\{fasilitator\.id\}\s*besaranTransport=\{fasilitator\.besaranTransport\}\s*defaultJPIntra=\{fasilitator\.defaultJPIntra\}\s*defaultJPEkstra=\{fasilitator\.defaultJPEkstra\}\s*\/>/,
    `{
    const hargaPertamax = await getAppSetting('harga_pertamax', '13900');
    return <LaporanClientForm 
      fasilitatorId={fasilitator.id} 
      besaranTransport={fasilitator.besaranTransport}
      jarakPPKm={fasilitator.jarakPPKm || 0}
      hargaPertamax={parseFloat(hargaPertamax)}
      defaultJPIntra={fasilitator.defaultJPIntra}
      defaultJPEkstra={fasilitator.defaultJPEkstra}
      jenisTugas={fasilitator.jenisTugas}
    />
  }`
  );

  fs.writeFileSync('src/app/(snt)/portal/laporan/page.tsx', page);
}
console.log('Fixed portal laporan page');
