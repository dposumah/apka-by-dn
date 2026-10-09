const fs = require('fs');

const path = 'src/app/(snt)/fasilitator/rekap-honor/client-page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove useState for manualJP and manualHonor
content = content.replace(/const \[manualJP, setManualJP\] = useState\(''\)\n/, '');
content = content.replace(/const \[manualHonor, setManualHonor\] = useState\(''\)\n/, '');

// Remove the second useEffect
const useEffectRegex = /useEffect\(\(\) => \{\s*\/\/\s*Auto calculate total JP from Intra \+ Ekstra\s*const jpIntra = parseInt\(manualJPIntra\) \|\| 0\s*const jpEkstra = parseInt\(manualJPEkstra\) \|\| 0\s*const totalJP = jpIntra \+ jpEkstra\s*setManualJP\(totalJP\.toString\(\)\)\s*const rate = parseInt\(manualRate\) \|\| 0\s*setManualHonor\(\(totalJP \* rate\)\.toString\(\)\)\s*\}, \[manualJPIntra, manualJPEkstra, manualRate\]\)/m;
content = content.replace(useEffectRegex, '');

// Add derived state after useState declarations
const isSubmittingRegex = /const \[isSubmitting, setIsSubmitting\] = useState\(false\)/;
const derivedState = `const [isSubmitting, setIsSubmitting] = useState(false)
    
    // Computed values
    const computedTotalJP = (parseInt(manualJPIntra) || 0) + (parseInt(manualJPEkstra) || 0);
    const computedTotalHonor = computedTotalJP * (parseInt(manualRate) || 0);
`;
content = content.replace(isSubmittingRegex, derivedState);

// Replace in handleManualSubmit
content = content.replace(/parseInt\(manualJP\) \|\| 0/g, 'computedTotalJP');
content = content.replace(/parseInt\(manualHonor\) \|\| 0/g, 'computedTotalHonor');

// Remove setManualJP and setManualHonor in handleManualSubmit
content = content.replace(/setManualJP\(''\)\n/g, '');
content = content.replace(/setManualHonor\(''\)\n/g, '');

// Replace value={manualJP} and value={manualHonor} in inputs
content = content.replace(/value=\{manualJP\}/g, 'value={computedTotalJP}');
content = content.replace(/value=\{manualHonor\} onChange=\{e => setManualHonor\(e\.target\.value\)\}/g, 'value={computedTotalHonor} readOnly className="w-full border rounded p-2 bg-slate-100"');

fs.writeFileSync(path, content);
console.log('Fixed JP calculation logic');
