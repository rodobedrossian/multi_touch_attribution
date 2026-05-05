import { FastifyPluginAsync } from 'fastify';
import { loadConfig } from '../../config';
import { sha256 } from '../../lib/hmac';
import { getAnonymousIdsByEmailHash, deleteByEmailHash } from '../../db/queries/identity';
import { anonymizeConversionsByUserId } from '../../db/queries/conversions';
import { getPool } from '../../db/client';

const deleteUserRoute: FastifyPluginAsync = async (fastify) => {
  fastify.delete<{ Params: { email: string } }>('/v1/users/:email', async (request, reply) => {
    const config = loadConfig();
    const adminKey = request.headers['x-admin-key'];
    if (!adminKey || adminKey !== config.ADMIN_KEY) {
      return reply.status(401).send({ ok: false, error: 'UNAUTHORIZED' });
    }

    const email = decodeURIComponent(request.params.email);
    const emailHash = sha256(email);

    // 1. Collect all anonymous IDs linked to this user
    const anonymousIds = await getAnonymousIdsByEmailHash(emailHash);

    let eventsAnonymized = 0;

    if (anonymousIds.length > 0) {
      const pool = getPool();
      // 2. Null out PII on events (ip_address, user_id) for all linked anonymous IDs
      const { rowCount } = await pool.query(
        `UPDATE events
         SET ip_address = NULL, user_id = NULL
         WHERE anonymous_id = ANY($1)`,
        [anonymousIds]
      );
      eventsAnonymized = rowCount ?? 0;
    }

    // 3. Anonymize conversions
    await anonymizeConversionsByUserId(emailHash);

    // 4. Remove from identity map
    const deleted = await deleteByEmailHash(emailHash);

    return reply.status(200).send({
      ok: true,
      anonymousIdsErased: deleted,
      eventsAnonymized,
    });
  });
};

export default deleteUserRoute;
