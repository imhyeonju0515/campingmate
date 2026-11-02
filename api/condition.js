import { getCondition } from '../server/condition.js';

export default async function handler(req, res) {
  try {
    res.status(200).json(await getCondition({ place: req.query.place }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
