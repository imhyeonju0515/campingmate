import { getStoryPlace } from '../server/place.js';

// /api/place?id=s-saebyeol&lang=ko  → 이야기 스팟의 사진·설명·주소 (TourAPI)
export default async function handler(req, res) {
  try {
    res.status(200).json(await getStoryPlace({ id: req.query.id, lang: req.query.lang }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
