import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { sha256 } from '../../lib/hmac';
import { upsertIdentity } from '../../db/queries/identity';
import { backfillUserId, getLastTouch, getFirstTouch, getJourneyEvents } from '../../db/queries/events';
import { insertConversion } from '../../db/queries/conversions';

const identifyBodySchema = z.object({
  anonymousId: z.string().uuid(),
  userId: z.string().optional(),
  traits: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }).and(z.record(z.unknown())),
  conversion: z.object({
    type: z.string().min(1).max(64).default('lead'),
    value: z.number().nonnegative().optional(),
    currency: z.string().length(3).default('USD'),
  }).optional(),
});

const identifyRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/v1/identify', async (request, reply) => {
    const parsed = identifyBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        ok: false,
        error: 'VALIDATION_ERROR',
        details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
    }

    const body = parsed.data;
    const emailHash = sha256(body.traits.email);
    const userId = body.userId || emailHash;

    // 1. Upsert identity map
    await upsertIdentity({
      anonymous_id: body.anonymousId,
      user_id: userId,
      email: body.traits.email,
      email_hash: emailHash,
      name: body.traits.name ?? null,
      traits: body.traits as Record<string, unknown>,
    });

    // 2. Back-fill user_id on all prior events for this anonymous ID
    const backfilled = await backfillUserId(body.anonymousId, userId);

    let conversionId: string | null = null;
    let touchpointCount = 0;

    if (body.conversion) {
      // 3. Attribution: last touch and first touch
      const [lastTouch, firstTouch, journeyEvents] = await Promise.all([
        getLastTouch(body.anonymousId),
        getFirstTouch(body.anonymousId),
        getJourneyEvents(body.anonymousId),
      ]);

      touchpointCount = journeyEvents.length;

      // 4. Insert conversion with attribution
      conversionId = await insertConversion({
        user_id: userId,
        anonymous_id: body.anonymousId,
        conversion_type: body.conversion.type,
        value: body.conversion.value ?? null,
        currency: body.conversion.currency,
        last_touch_source: lastTouch?.utm_source ?? null,
        last_touch_medium: lastTouch?.utm_medium ?? null,
        last_touch_campaign: lastTouch?.utm_campaign ?? null,
        last_touch_content: lastTouch?.utm_content ?? null,
        first_touch_source: firstTouch?.utm_source ?? null,
        first_touch_medium: firstTouch?.utm_medium ?? null,
        first_touch_campaign: firstTouch?.utm_campaign ?? null,
        first_touch_content: firstTouch?.utm_content ?? null,
        journey_summary: journeyEvents,
      });
    }

    return reply.status(200).send({
      ok: true,
      userId,
      eventsBackfilled: backfilled,
      conversionId,
      touchpointCount,
    });
  });
};

export default identifyRoute;
