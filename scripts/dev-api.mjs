// 로컬 개발 서버: Vite 화면 + /api/* 서버 함수를 한 포트(5173)에서 함께 제공합니다.
// Vercel CLI(vercel dev) 없이도 api/ 폴더의 함수를 그대로 실행합니다. 실행: npm run dev:api
// 키는 .env.local 에서 읽습니다 (package.json 의 --env-file). 배포(Vercel)에서는 이 파일을 쓰지 않습니다.
import { createServer as createHttp } from 'node:http'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { createServer as createVite } from 'vite'

const root = path.resolve(import.meta.dirname, '..')
const port = Number(process.env.PORT) || 5173
const vite = await createVite({ root, server: { middlewareMode: true }, appType: 'spa' })

// Vercel 함수가 쓰는 req.query / res.status().json() 만 흉내 냅니다
const readBody = (req) => new Promise((resolve) => {
  let data = ''
  req.on('data', (c) => { data += c })
  req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) } })
})

createHttp(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`)
  if (!url.pathname.startsWith('/api/')) return vite.middlewares(req, res)

  try {
    const file = path.join(root, `${url.pathname.replace(/\.\./g, '')}.js`)
    const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`)   // 매번 새로 읽어 수정이 바로 반영됨
    req.query = Object.fromEntries(url.searchParams)
    req.body = req.method === 'POST' ? await readBody(req) : undefined
    res.status = (code) => { res.statusCode = code; return res }
    res.json = (obj) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)) }
    await mod.default(req, res)
  } catch (e) {
    res.statusCode = e.code === 'ERR_MODULE_NOT_FOUND' ? 404 : 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: e.code === 'ERR_MODULE_NOT_FOUND' ? `없는 API: ${url.pathname}` : e.message }))
  }
}).listen(port, () => console.log(`\n  화면 + /api  →  http://localhost:${port}\n`))
