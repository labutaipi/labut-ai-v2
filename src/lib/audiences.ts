export const AUDIENCES = [
  { slug: 'mulheres-adultas', label: 'Mulheres adultas', icon: '👩' },
  { slug: 'familias',         label: 'Famílias',          icon: '👨‍👩‍👧' },
  { slug: 'jovens',           label: 'Jovens (18–30)',     icon: '🧑' },
  { slug: 'homens-adultos',   label: 'Homens adultos',     icon: '👨' },
  { slug: 'todos',            label: 'Todos os públicos',  icon: '🌍' },
] as const

export type AudienceSlug = (typeof AUDIENCES)[number]['slug']
export type Audience = (typeof AUDIENCES)[number]

export function getAudienceBySlug(slug: AudienceSlug): Audience {
  return AUDIENCES.find((a) => a.slug === slug)!
}

export function isValidAudienceSlug(slug: string): slug is AudienceSlug {
  return AUDIENCES.some((a) => a.slug === slug)
}
