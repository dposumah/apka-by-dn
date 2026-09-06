const fs = require('fs')
let code = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8')

// Add import
if (!code.includes('FullPageLoading')) {
  code = code.replace(
    "import { signIn } from 'next-auth/react'",
    "import { signIn } from 'next-auth/react'\nimport { FullPageLoading } from '@/components/ui/LoadingSpinner'"
  )
}

// Add state
if (!code.includes('isSuccess')) {
  code = code.replace(
    "const [loading, setLoading] = useState(false)",
    "const [loading, setLoading] = useState(false)\n  const [isSuccess, setIsSuccess] = useState(false)"
  )
}

// Update login success
code = code.replace(
  `} else {
        router.push('/')
        router.refresh()
      }`,
  `} else {
        setIsSuccess(true)
        router.push('/')
        router.refresh()
      }`
)

// Update render
code = code.replace(
  `return (
    <div className="min-h-screen`,
  `if (isSuccess) {
    return <FullPageLoading />
  }

  return (
    <div className="min-h-screen`
)

fs.writeFileSync('src/app/(auth)/login/page.tsx', code)
