import { useState } from 'react'
import { distKm, getPosition, STAMP_RADIUS_KM } from './geo'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

// 이야기 스팟 도장 찍기 — 이야기 카드가 씁니다.
// 도장은 스팟 1km 안에서만 찍힙니다 (브라우저 위치 기준 — 서버가 검증하는 것은 아니라서 진짜 부정 방지는 아님)
export function useStamp(story, campId) {
  const t = useT()
  const stamp = useAppStore((s) => s.stamps.find((x) => x.spotId === story.id))
  const stampSpot = useAppStore((s) => s.stampSpot)
  const toast = useAppStore((s) => s.toast)
  const [fresh, setFresh] = useState(false)
  const [locating, setLocating] = useState(false)

  async function onStamp() {
    setLocating(true)
    try {
      const me = await getPosition()
      const km = distKm(me.lat, me.lng, story.lat, story.lng)
      if (km > STAMP_RADIUS_KM) return toast(`${t('stampTooFar')} (${km.toFixed(1)} km)`, 'warning')
      await stampSpot({ spotId: story.id, name: story.name, tag: story.tag, campId })
      setFresh(true)
      toast(t('stampSay'))
    } catch (e) {
      toast(t({ unsupported: 'stampNoGeo', denied: 'stampDenied' }[e.code] ?? 'stampUnavail'), 'warning')
    } finally {
      setLocating(false)
    }
  }

  return { stamp, onStamp, locating, fresh }
}
