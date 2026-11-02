import { searchHeritage } from '../server/heritage.js';

export default async function handler(req, res) {
  try {
    res.status(200).json(await searchHeritage({ keyword: req.query.keyword, lang: req.query.lang }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
