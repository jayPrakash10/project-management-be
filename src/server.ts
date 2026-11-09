import app from './app';
import { env } from './config/env';

// Local development entry point. On Vercel, api/index.ts exports the app instead.
app.listen(env.PORT, () => {
  console.log(`TaskFlow API running on http://localhost:${env.PORT}`);
});
