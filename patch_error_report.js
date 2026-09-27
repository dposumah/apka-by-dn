const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/portal/laporan/client-form.tsx', 'utf8');

const toReplace = `      } catch (error) {
        toast({ title: 'Gagal', description: 'Gagal mengirim laporan', type: 'error' })
        setSaving(false)
      }`;

const replaceWith = `      } catch (error: any) {
        toast({ title: 'Gagal', description: error.message || 'Gagal mengirim laporan', type: 'error' })
        setSaving(false)
      }`;

code = code.replace(toReplace, replaceWith);
fs.writeFileSync('src/app/(snt)/portal/laporan/client-form.tsx', code);
console.log('Fixed error reporting in client-form');
