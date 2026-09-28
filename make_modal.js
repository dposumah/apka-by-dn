const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');

// Replace the inline {submittedExpense && (...)} block with a modal
page = page.replace(
  /\{submittedExpense && \([\s\S]*?<Card className="mt-8 border-green-200 bg-green-50">[\s\S]*?<CardHeader>[\s\S]*?<CardTitle className="text-green-800 text-lg">Pengeluaran berhasil dicatat!<\/CardTitle>[\s\S]*?<\/CardHeader>[\s\S]*?<CardContent className="space-y-4">/,
  `{submittedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border-green-200">
            <CardHeader className="bg-green-50 border-b border-green-100 relative">
              <button 
                onClick={() => setSubmittedExpense(null)}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                type="button"
              >
                ✕
              </button>
              <CardTitle className="text-green-800 text-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Pengeluaran berhasil dicatat!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">`
);

// Close the wrapper
page = page.replace(
  /<\/CardContent>\s*<\/Card>\s*\)\}\s*<\/div>\s*\)\s*\}\s*$/m,
  `</CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}`
);

fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', page);
console.log('Fixed modal');
