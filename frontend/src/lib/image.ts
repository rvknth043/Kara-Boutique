const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function getApiOrigin() {
  try {
    return new URL(DEFAULT_API_URL).origin;
  } catch {
    return 'http://localhost:5000';
  }
}

export function resolveImageUrl(src?: string | null) {
  if (!src) return '/placeholder.jpg';

  const trimmed = src.trim();
  if (!trimmed) return '/placeholder.jpg';

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${getApiOrigin()}${normalizedPath}`;
}
