import { listOreums } from '../server/oreumList.js';

// /api/oreums?lang=ko  → 제주 오름 전체(이야기 카드가 있는 곳 제외) + 가까운 캠핑장
export default async function handler(req, res) {
  try {
    res.status(200).json(await listOreums({ lang: req.query.lang }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
