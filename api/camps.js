import { getCamp, listCamps } from '../server/camps.js';

// /api/camps?lang=ko&keyword=&type=&region=   → 캠핑장 목록
// /api/camps?id=123&lang=en                   → 캠핑장 1개 + 근처 스토리 + 주변 장소
export default async function handler(req, res) {
  try {
    const { id, lang = 'ko', keyword = '', type = '', region = '' } = req.query;
    res.status(200).json(id ? await getCamp({ id, lang }) : await listCamps({ lang, keyword, type, region }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
