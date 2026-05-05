import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getChannelReport } from '../../db/queries/conversions';

const querySchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
  model: z.enum(['last_touch']).default('last_touch'),
  conversionType: z.string().optional(),
});

const channelsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/v1/reports/channels', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        ok: false,
        error: 'VALIDATION_ERROR',
        details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
    }

    const { from, to, model, conversionType } = parsed.data;
    const rows = await getChannelReport(new Date(from), new Date(to + 'T23:59:59Z'), conversionType);

    const formatted = rows.map(r => ({
      source: r.source,
      medium: r.medium,
      campaign: r.campaign,
      conversions: parseInt(r.conversions, 10),
      value: r.value ? parseFloat(r.value) : null,
      cpa: r.value && parseInt(r.conversions, 10) > 0
        ? parseFloat(r.value) / parseInt(r.conversions, 10)
        : null,
    }));

    const totalConversions = formatted.reduce((s, r) => s + r.conversions, 0);
    const totalValue = formatted.reduce((s, r) => s + (r.value ?? 0), 0);

    return reply.status(200).send({
      model,
      from,
      to,
      rows: formatted,
      totals: { conversions: totalConversions, value: totalValue },
    });
  });
};

export default channelsRoute;
