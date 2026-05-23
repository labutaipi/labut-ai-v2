import * as z from 'zod'
import { protectedProcedure } from '@/server/orpc'
import { prisma } from '@/server/db'
import { isValidSegmentSlug } from '@/lib/segments'
import { isValidCitySlug } from '@/lib/cities'

export const onboardingRouter = {
  save: protectedProcedure
    .input(
      z.object({
        segmentSlug: z.string().refine(isValidSegmentSlug, 'Segmento inválido'),
        citySlug: z.string().refine(isValidCitySlug, 'Cidade inválida'),
        businessName: z.string().min(2, 'Nome do negócio deve ter pelo menos 2 caracteres').optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      await prisma.user.update({
        where: { id: context.userId },
        data: {
          segmentSlug: input.segmentSlug,
          citySlug: input.citySlug,
          businessName: input.businessName,
        },
      })
      return { success: true }
    }),
}
