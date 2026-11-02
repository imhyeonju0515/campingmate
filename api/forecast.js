import { getForecast } from '../server/weather.js';

// /api/forecast?place=제주시  → 오늘부터 최대 3일 날짜별 풍속·강수 요약
export default async function handler(req, res) {
  try {
    res.status(200).json(await getForecast({ place: req.query.place }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
