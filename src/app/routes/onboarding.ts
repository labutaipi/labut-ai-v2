import * as z from 'zod'
import { protectedProcedure } from '@/server/orpc'
import { prisma } from '@/server/db'
import { isValidSegmentSlug } from '@/lib/segments'
import { isValidCitySlug } from '@/lib/cities'
import { isValidAudienceSlug } from '@/lib/audiences'

export const onboardingRouter = {
  save: protectedProcedure
    .input(
      z.object({
        segmentSlug: z.string().refine(isValidSegmentSlug, 'Segmento inválido'),
        citySlug: z.string().refine(isValidCitySlug, 'Cidade inválida'),
        audienceSlug: z.string().refine(isValidAudienceSlug, 'Público alvo inválido').optional(),
        businessName: z.string().min(2).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      await prisma.user.update({
        where: { id: context.userId },
        data: {
          segmentSlug: input.segmentSlug,
          citySlug: input.citySlug,
          targetAudience: input.audienceSlug,
          businessName: input.businessName,
        },
      })
      return { success: true }
    }),
}
