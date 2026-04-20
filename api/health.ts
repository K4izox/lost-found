import { VercelRequest, VercelResponse } from '@vercel/node';

export default function (req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'ok', message: 'Vercel Function is alive!' });
}
