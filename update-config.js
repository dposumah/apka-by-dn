const fs = require('fs')

let config = fs.readFileSync('next.config.ts', 'utf8')

config = config.replace(
  'const nextConfig: NextConfig = {',
  'const nextConfig: NextConfig = {\n  experimental: {\n    serverActions: {\n      bodySizeLimit: "10mb"\n    }\n  },'
)

fs.writeFileSync('next.config.ts', config)
