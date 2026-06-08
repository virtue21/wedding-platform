export function slugify(bride: string, groom: string) {
  const clean = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${clean(bride)}-and-${clean(groom)}`
}
