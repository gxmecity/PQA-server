export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
}
export const uniqueId = function () {
  return 'id-' + Math.random().toString(36).substr(2, 16)
}
