import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProduction } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import apiRouter from './routes';

const JSON_BODY_LIMIT = '100kb';

function parseCorsOrigin(value: string): string | string[] {
  return value === '*' ? value : value.split(',').map((origin) => origin.trim());
}

const app = express();

app.use(helmet());
app.use(cors({ origin: parseCorsOrigin(env.CORS_ORIGIN) }));
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

app.use('/', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
