import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { insertEvent } from '../../db/queries/events';
import { isBot, parseUserAgent } from '../../lib/device-parser';
import { lookupGeo, extractIp } from '../../lib/geoip';

const trackBodySchema = z.object({
  anonymousId: z.string().uuid(),
  sessionId: z.string().min(1).max(128),
  event: z.string().min(1).max(64),
  timestamp: z.string().datetime(),
  properties: z.record(z.unknown()).default({}),
});

const trackRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/v1/track', async (request, reply) => {
    const ua = request.headers['user-agent'];
    if (isBot(ua)) {
      return reply.status(200).send({ ok: true, dropped: true });
    }

    const parsed = trackBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        ok: false,
        error: 'VALIDATION_ERROR',
        details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
    }

    const body = parsed.data;
    const ts = new Date(body.timestamp);

    // Reject timestamps more than 24h in the future
    if (ts.getTime() > Date.now() + 86_400_000) {
      return reply.status(400).send({ ok: false, error: 'INVALID_TIMESTAMP' });
    }

    const props = body.properties as Record<string, string | undefined>;
    const ip = extractIp(
      request.headers['x-forwarded-for'] as string | undefined,
      request.socket.remoteAddress
    );

    const [device, geo] = await Promise.all([
      Promise.resolve(parseUserAgent(ua)),
      lookupGeo(ip),
    ]);

    const eventId = await insertEvent({
      type: body.event,
      anonymous_id: body.anonymousId,
      session_id: body.sessionId,
      write_key_id: request.writeKeyId,
      timestamp: ts,
      url: props.url ?? null,
      referrer: props.referrer ?? null,
      utm_source: props.utm_source ?? null,
      utm_medium: props.utm_medium ?? null,
      utm_campaign: props.utm_campaign ?? null,
      utm_content: props.utm_content ?? null,
      utm_term: props.utm_term ?? null,
      properties: body.properties,
      geo_country: geo.geo_country,
      geo_city: geo.geo_city,
      device_type: device.device_type,
      browser: device.browser,
      os: device.os,
      ip_address: ip ?? null,
    });

    return reply.status(200).send({ ok: true, eventId });
  });
};

export default trackRoute;
