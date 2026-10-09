const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', 'utf8');

const editState = `
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const openEditModal = (expense: any) => {
    setEditData({
      id: expense.id,
      date: expense.date ? new Date(expense.date).toISOString().substring(0,10) : new Date(expense.createdAt).toISOString().substring(0,10),
      description: expense.description,
      amount: expense.amount,
      rabItemId: expense.rabItemId
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editData) return;
    setIsSaving(true);
    try {
      const res = await updateExpense(editData.id, {
        date: new Date(editData.date),
        description: editData.description,
        amount: parseFloat(editData.amount),
        rabItemId: editData.rabItemId
      });
      if (res.error) throw new Error(res.error);
      setShowEditModal(false);
      window.location.reload();
    } catch (err) {
      alert("Gagal mengedit: " + err);
    } finally {
      setIsSaving(false);
    }
  }
`;

if (!page.includes('const [showEditModal')) {
  page = page.replace(
    /const \[inputTanggal, setInputTanggal\] = useState\(""\)/,
    `const [inputTanggal, setInputTanggal] = useState("")\n${editState}`
  );
  fs.writeFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', page);
}

console.log('Fixed dashboard-rab client page');
