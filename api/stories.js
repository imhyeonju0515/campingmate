import { listStories } from '../server/camps.js';

export default async function handler(req, res) {
  try {
    const { lang = 'ko', tag = '', area = '' } = req.query;
    res.status(200).json(await listStories({ lang, tag, area }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
