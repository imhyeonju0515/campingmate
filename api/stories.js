import { listStories } from '../server/camps.js';

export default function handler(req, res) {
  const { lang = 'ko', tag = '', area = '' } = req.query;
  res.status(200).json(listStories({ lang, tag, area }));
}
