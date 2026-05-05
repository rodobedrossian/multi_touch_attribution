import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { getPool } from '../db/client';
import { verifyHmac } from '../lib/hmac';

declare module 'fastify' {
  interface FastifyRequest {
    writeKeyId: string | null;
  }
}

const hmacPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('writeKeyId', null);

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const route = request.routerPath ?? request.url;

    // Skip HMAC for health check, report endpoints, admin routes, and settings
    if (
      route === '/v1/healthz' ||
      route.startsWith('/v1/reports/') ||
      route.startsWith('/v1/users/') ||
      route.startsWith('/v1/settings/')
    ) {
      return;
    }

    const header = request.headers['x-write-key'] as string | undefined;
    if (!header) {
      return reply.status(401).send({ ok: false, error: 'MISSING_WRITE_KEY' });
    }

    const dotIdx = header.indexOf('.');
    if (dotIdx === -1) {
      return reply.status(401).send({ ok: false, error: 'INVALID_WRITE_KEY_FORMAT' });
    }

    const keyId = header.slice(0, dotIdx);
    const signature = header.slice(dotIdx + 1);
    const rawBody = (request as FastifyRequest & { rawBody?: string }).rawBody ?? '';

    const pool = getPool();
    const { rows } = await pool.query<{ id: string; secret: string }>(
      'SELECT id, secret FROM write_keys WHERE id = $1 AND revoked_at IS NULL LIMIT 1',
      [keyId]
    );

    if (rows.length === 0) {
      return reply.status(401).send({ ok: false, error: 'INVALID_WRITE_KEY' });
    }

    if (!verifyHmac(rows[0].secret, rawBody, signature)) {
      return reply.status(401).send({ ok: false, error: 'INVALID_SIGNATURE' });
    }

    request.writeKeyId = rows[0].id;
  });
};

export default fp(hmacPlugin, { name: 'hmac' });
