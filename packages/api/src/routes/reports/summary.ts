import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getSummaryReport } from '../../db/queries/conversions';

const querySchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
});

const summaryRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/v1/reports/summary', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        ok: false,
        error: 'VALIDATION_ERROR',
        details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
    }

    const { from, to } = parsed.data;
    const { summary, topChannel, byDay } = await getSummaryReport(
      new Date(from),
      new Date(to + 'T23:59:59Z')
    );

    return reply.status(200).send({
      from,
      to,
      totalConversions: parseInt(summary.total_conversions, 10),
      totalValue: summary.total_value ? parseFloat(summary.total_value) : null,
      uniqueUsers: parseInt(summary.unique_users, 10),
      topChannel: topChannel
        ? {
            source: topChannel.source,
            medium: topChannel.medium,
            campaign: topChannel.campaign,
            conversions: parseInt(topChannel.conversions, 10),
          }
        : null,
      conversionsByDay: byDay.map(d => ({
        date: d.date,
        conversions: parseInt(d.conversions, 10),
      })),
    });
  });
};

export default summaryRoute;
