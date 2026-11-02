import { useState } from 'react'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

// 주소 → 누르면 지도에서 열고, 옆의 복사 아이콘을 누르면 주소를 복사합니다.
// 한국어는 네이버 지도, 그 밖의 언어(해외 방문객)는 구글 지도로 엽니다.
// nested: 카드 전체가 이미 링크일 때(<a> 안에 <a> 금지) 쓰는 버전 — 같은 모양, 클릭만 직접 처리
const mapUrl = (addr, lang) => lang === 'ko'
  ? `https://map.naver.com/p/search/${encodeURIComponent(addr)}`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true } catch { /* 아래 대체 방법 */ }
  try {   // http 등 clipboard API 가 막힌 환경용
    const ta = Object.assign(document.createElement('textarea'), { value: text })
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta); ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch { return false }
}

export default function AddressLink({ addr, nested = false, className = '' }) {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const toast = useAppStore((s) => s.toast)
  const [done, setDone] = useState(false)
  if (!addr) return null
  const url = mapUrl(addr, lang)
  const stop = (e) => { e.preventDefault(); e.stopPropagation() }

  async function onCopy(e) {
    stop(e)
    if (await copyText(addr)) {
      setDone(true); toast(t('copied')); setTimeout(() => setDone(false), 1500)
    } else toast(t('copyFail'), 'warning')
  }

  const open = () => window.open(url, '_blank', 'noopener,noreferrer')
  return (
    <span className={`addr-wrap ${className}`}>
      {nested ? (
        <span role="link" tabIndex={0} className="addr-link" title={t('openMap')}
          onClick={(e) => { stop(e); open() }} onKeyDown={(e) => { if (e.key === 'Enter') { stop(e); open() } }}>{addr}</span>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="addr-link" title={t('openMap')}>{addr}</a>
      )}
      <button type="button" className="copy-btn" onClick={onCopy} title={t('copyAddr')} aria-label={t('copyAddr')}>
        <i className={`bi bi-${done ? 'check2' : 'copy'}`} />
      </button>
    </span>
  )
}
