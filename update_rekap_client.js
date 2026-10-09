const fs = require('fs');
const path = 'src/app/(snt)/fasilitator/rekap-honor/client-page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
if (!content.includes('getFasilitatorJpForMonth')) {
  content = content.replace(
    /export function RekapHonorClient/,
    "import { getFasilitatorJpForMonth } from '@/app/actions/rekap'\n\nexport function RekapHonorClient"
  );
}

// Modify state
content = content.replace(
  /const \[manualBulan, setManualBulan\] = useState\(''\)/,
  `const [manualBulan, setManualBulan] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;
  })`
);

// Modify useEffect
const oldUseEffectPattern = /useEffect\(\(\) => \{\s*\/\/ Auto calculate JP based on type and fasilitator config\s*if \(manualFasilId\) \{\s*const f = fasilitators\.find\(\(x: any\) => x\.id === manualFasilId\)\s*if \(f\) \{\s*const sesi = parseInt\(manualSesi\) \|\| 4\s*const jpIntra = \(f\.defaultJPIntra \|\| 8\) \* sesi\s*const jpEkstra = \(f\.defaultJPEkstra \|\| 4\) \* sesi\s*setManualJPIntra\(jpIntra\.toString\(\)\)\s*setManualJPEkstra\(jpEkstra\.toString\(\)\)\s*\}\s*\}\s*\}, \[manualFasilId, manualSesi, fasilitators\]\)/m;

const newUseEffect = `useEffect(() => {
    async function fetchJp() {
      if (manualFasilId && manualBulan) {
        try {
          const res = await getFasilitatorJpForMonth(manualFasilId, manualBulan);
          if (res) {
            setManualJPIntra(res.totalJPIntra.toString());
            setManualJPEkstra(res.totalJPEkstra.toString());
            setManualSesi(res.sesi.toString());
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchJp();
  }, [manualFasilId, manualBulan])`;

if (oldUseEffectPattern.test(content)) {
  content = content.replace(oldUseEffectPattern, newUseEffect);
  fs.writeFileSync(path, content);
  console.log('Modified client-page');
} else {
  console.log('Regex failed');
}
