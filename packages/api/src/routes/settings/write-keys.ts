import { FastifyPluginAsync } from 'fastify';
import { loadConfig } from '../../config';
import { getPool } from '../../db/client';

const writeKeysRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/v1/settings/write-keys', async (request, reply) => {
    const config = loadConfig();
    if (request.headers['x-admin-key'] !== config.ADMIN_KEY) {
      return reply.status(401).send({ ok: false, error: 'UNAUTHORIZED' });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT id, key_hash, domain, label, created_at, revoked_at
       FROM write_keys ORDER BY created_at DESC`
    );

    return reply.status(200).send({ ok: true, keys: rows });
  });

  fastify.delete<{ Params: { id: string } }>('/v1/settings/write-keys/:id', async (request, reply) => {
    const config = loadConfig();
    if (request.headers['x-admin-key'] !== config.ADMIN_KEY) {
      return reply.status(401).send({ ok: false, error: 'UNAUTHORIZED' });
    }

    const pool = getPool();
    const { rowCount } = await pool.query(
      'UPDATE write_keys SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL',
      [request.params.id]
    );

    return reply.status(200).send({ ok: true, revoked: (rowCount ?? 0) > 0 });
  });
};

export default writeKeysRoute;
