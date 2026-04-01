export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function generateSKU(prefix: string, productName: string): string {
  const nameCode = productName
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 3);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${nameCode}-${random}`;
}
