import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { sha256 } from '../../lib/hmac';
import { getUserIdByEmailHash } from '../../db/queries/identity';
import { getEventsByUserId } from '../../db/queries/events';
import { getConversionsByUserId } from '../../db/queries/conversions';

const querySchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().optional(),
}).refine(d => d.email || d.userId, {
  message: 'Either email or userId is required',
});

const journeysRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/v1/reports/journeys', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        ok: false,
        error: 'VALIDATION_ERROR',
        details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
    }

    const { email, userId: rawUserId } = parsed.data;
    let userId = rawUserId;

    if (email && !userId) {
      const emailHash = sha256(email);
      const resolved = await getUserIdByEmailHash(emailHash);
      if (!resolved) {
        return reply.status(404).send({ ok: false, error: 'USER_NOT_FOUND' });
      }
      userId = resolved;
    }

    const [touchpoints, conversions] = await Promise.all([
      getEventsByUserId(userId!),
      getConversionsByUserId(userId!),
    ]);

    return reply.status(200).send({
      userId,
      touchpoints,
      conversions: conversions.map(c => ({
        conversionId: c.id,
        type: c.conversion_type,
        value: c.value,
        convertedAt: c.converted_at,
        lastTouchSource: c.last_touch_source,
        lastTouchMedium: c.last_touch_medium,
        lastTouchCampaign: c.last_touch_campaign,
      })),
    });
  });
};

export default journeysRoute;
