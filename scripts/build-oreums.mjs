// 제주특별자치도_제주오름요약설명 CSV(공공데이터포털 15096996) → server/data/oreums.json
// 사용: node scripts/build-oreums.mjs   (CSV 가 바뀌면 다시 실행)
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const src = path.join(root, 'server/data/source/jeju-oreum-summary.csv')
const text = fs.readFileSync(src, 'utf8').replace(/^﻿/, '')

// 따옴표 안의 쉼표·줄바꿈을 지키는 간단한 CSV 파서
function parseCsv(s) {
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) { if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((x) => x.trim()))
}

const [head, ...rows] = parseCsv(text)
const col = (name) => head.findIndex((h) => h.trim().startsWith(name))
const idx = { en: col('오름영문명'), ko: col('오름명'), loc: col('위치'), rel: col('비고'), ele: col('표고'), lng: col('경도'), lat: col('위도'), desc: col('설명'), date: col('데이터기준일자') }
const num = (v) => { const n = Number(String(v).trim()); return Number.isFinite(n) ? n : null }

const list = rows.map((r) => ({
  id: `o-${r[idx.en].trim()}`,
  en: r[idx.en].trim(), ko: r[idx.ko].trim(), loc: r[idx.loc].trim(),
  rel: num(r[idx.rel]), ele: num(r[idx.ele]), lng: num(r[idx.lng]), lat: num(r[idx.lat]),
  desc: r[idx.desc].trim(), date: r[idx.date].trim(),
})).filter((o) => o.ko && o.lat != null && o.lng != null)

fs.writeFileSync(path.join(root, 'server/data/oreums.json'), JSON.stringify(list, null, 1) + '\n')
console.log(`${list.length}개 오름 → server/data/oreums.json (기준일 ${list[0]?.date})`)
const dup = list.map((o) => o.id).filter((id, i, a) => a.indexOf(id) !== i)
if (dup.length) console.warn('중복 id:', dup)
