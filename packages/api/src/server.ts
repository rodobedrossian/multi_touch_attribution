import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';
import { loadConfig } from './config';
import hmacPlugin from './plugins/hmac';
import healthRoute from './routes/health';
import trackRoute from './routes/collect/track';
import identifyRoute from './routes/collect/identify';
import deleteUserRoute from './routes/users/delete';
import channelsRoute from './routes/reports/channels';
import journeysRoute from './routes/reports/journeys';
import summaryRoute from './routes/reports/summary';
import writeKeysSettingsRoute from './routes/settings/write-keys';

async function buildServer() {
  const config = loadConfig();

  const fastify = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: config.NODE_ENV !== 'production'
        ? { target: 'pino-pretty' }
        : undefined,
    },
    trustProxy: true,
    bodyLimit: 32 * 1024, // 32KB max body
  });

  // Store raw body for HMAC verification
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    (req as typeof req & { rawBody: string }).rawBody = body as string;
    try {
      done(null, JSON.parse(body as string));
    } catch (err) {
      done(err as Error);
    }
  });

  // CORS
  await fastify.register(cors, {
    origin: config.CORS_ORIGINS.split(',').map(o => o.trim()),
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  });

  // Rate limiting on collect endpoints
  await fastify.register(rateLimit, {
    max: 1000,
    timeWindow: '15 minutes',
    keyGenerator: (req) => {
      const forwarded = req.headers['x-forwarded-for'];
      const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
      return ip ?? req.socket.remoteAddress ?? 'unknown';
    },
    errorResponseBuilder: () => ({
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
    }),
  });

  // Auth plugin
  await fastify.register(fp(hmacPlugin));

  // Routes
  await fastify.register(healthRoute);
  await fastify.register(trackRoute);
  await fastify.register(identifyRoute);
  await fastify.register(deleteUserRoute);
  await fastify.register(channelsRoute);
  await fastify.register(journeysRoute);
  await fastify.register(summaryRoute);
  await fastify.register(writeKeysSettingsRoute);

  return fastify;
}

async function main() {
  const config = loadConfig();
  const server = await buildServer();
  try {
    await server.listen({ port: config.PORT, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
