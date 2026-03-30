export function toAbsoluteAssetUrl(url?: string | null): string {
  const value = (url ?? '').trim()
  if (!value) {
    return ''
  }

  if (
    value.startsWith('http://')
    || value.startsWith('https://')
    || value.startsWith('//')
    || value.startsWith('data:')
    || value.startsWith('blob:')
  ) {
    return value
  }

  if (value.startsWith('/api/')) {
    return value
  }

  if (value.startsWith('/')) {
    return `/api${value}`
  }

  return `/api/${value}`
}
