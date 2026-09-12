import app from '../server';
import { initDatabase } from '../src/db/index';

let isDbInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (e) {
      console.error('[Vercel Serverless] Database init error:', e);
    }
  }
  return app(req, res);
}
