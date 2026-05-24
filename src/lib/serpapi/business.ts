import 'server-only'
import { prisma } from '@/server/db'

const TERESINA_LL = '@-5.0892,-42.8019,13z'
const TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

export async function fetchBusinessProfile(userId: string, query: string, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await prisma.businessProfile.findUnique({
      where: { userId },
      include: { reviews: { orderBy: { publishedAt: 'desc' }, take: 5 } },
    })
    if (cached && Date.now() - cached.syncedAt.getTime() < TTL_MS) {
      return cached
    }
  }

  const searchParams = new URLSearchParams({
    engine: 'google_maps',
    q: query,
    ll: TERESINA_LL,
    hl: 'pt-BR',
    api_key: process.env.SERPAPI_KEY!,
  })

  const searchRes = await fetch(`https://serpapi.com/search.json?${searchParams}`)
  const searchData = await searchRes.json()
  const place = searchData?.local_results?.[0]

  if (!place) return null

  const reviewParams = new URLSearchParams({
    engine: 'google_maps_reviews',
    place_id: place.place_id,
    hl: 'pt-BR',
    api_key: process.env.SERPAPI_KEY!,
  })
  const reviewsRes = await fetch(`https://serpapi.com/search.json?${reviewParams}`)
  const reviewsData = await reviewsRes.json()
  const reviews: any[] = reviewsData?.reviews?.slice(0, 5) ?? []

  const profile = await prisma.businessProfile.upsert({
    where: { userId },
    update: {
      placeId: place.place_id,
      name: place.title,
      rating: place.rating ?? null,
      reviewCount: place.reviews ?? null,
      syncedAt: new Date(),
    },
    create: {
      userId,
      placeId: place.place_id,
      name: place.title,
      rating: place.rating ?? null,
      reviewCount: place.reviews ?? null,
    },
  })

  await prisma.businessReview.deleteMany({ where: { profileId: profile.id } })

  if (reviews.length) {
    await prisma.businessReview.createMany({
      data: reviews.map((r) => ({
        profileId: profile.id,
        author: r.user?.name ?? 'Anônimo',
        rating: r.rating ?? 0,
        comment: r.snippet ?? null,
        publishedAt: r.iso_date ? new Date(r.iso_date) : new Date(),
      })),
    })
  }

  return prisma.businessProfile.findUnique({
    where: { userId },
    include: { reviews: { orderBy: { publishedAt: 'desc' }, take: 5 } },
  })
}
