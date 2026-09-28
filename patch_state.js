const fs = require('fs');
let content = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf-8');

const oldState = "const [manualBulan, setManualBulan] = useState('')";
const newState = "const [manualBulan, setManualBulan] = useState('')\n  const [manualJenis, setManualJenis] = useState('INTRAKURIKULER')";

content = content.replace(oldState, newState);
fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', content);
