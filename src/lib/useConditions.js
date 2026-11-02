import { useEffect, useState } from 'react'
import { fetchCondition } from '../api/client'

export const REGIONS = ['제주시', '서귀포시']

// 제주시·서귀포시 두 곳의 캠핑 컨디션을 한 번에 불러옵니다 → { data: { 제주시: {...}, 서귀포시: {...} }, failed }
export function useConditions() {
  const [data, setData] = useState({})
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    REGIONS.forEach((p) =>
      fetchCondition(p).then((d) => setData((x) => ({ ...x, [p]: d }))).catch(() => setFailed(true)))
  }, [])

  return { data, failed }
}
