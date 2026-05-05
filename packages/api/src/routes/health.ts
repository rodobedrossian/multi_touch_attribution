import { FastifyPluginAsync } from 'fastify';
import { checkDb } from '../db/client';

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/v1/healthz', async (_req, reply) => {
    const dbOk = await checkDb();
    const status = dbOk ? 'ok' : 'degraded';
    reply.status(dbOk ? 200 : 503).send({
      status,
      db: dbOk ? 'ok' : 'error',
      version: '1.0.0',
    });
  });
};

export default healthRoute;
