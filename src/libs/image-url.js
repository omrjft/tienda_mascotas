const MAX_IMAGE_URL_LENGTH = 2048;

function normalizeImageUrl(value) {
  if (value === undefined || value === null) {
    return { valid: true, value: null };
  }

  if (typeof value !== 'string') {
    return { valid: false, value: null };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: true, value: null };
  }

  if (trimmed.length > MAX_IMAGE_URL_LENGTH) {
    return { valid: false, value: null };
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
      return { valid: false, value: null };
    }
    return { valid: true, value: url.href };
  } catch {
    return { valid: false, value: null };
  }
}

module.exports = normalizeImageUrl;
