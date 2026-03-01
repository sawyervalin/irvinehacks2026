function isInvisibleCodePoint(codePoint) {
  if (codePoint <= 0x1f) return true;
  if (codePoint >= 0x7f && codePoint <= 0x9f) return true;
  if (codePoint === 0x00a0 || codePoint === 0x00ad || codePoint === 0x034f) return true;
  if (codePoint === 0x061c || codePoint === 0x115f || codePoint === 0x1160) return true;
  if (codePoint >= 0x17b4 && codePoint <= 0x17b5) return true;
  if (codePoint >= 0x180b && codePoint <= 0x180f) return true;
  if (codePoint >= 0x200b && codePoint <= 0x200f) return true;
  if (codePoint >= 0x2028 && codePoint <= 0x202e) return true;
  if (codePoint >= 0x2060 && codePoint <= 0x206f) return true;
  if (codePoint === 0x2800 || codePoint === 0x3000 || codePoint === 0x3164) return true;
  if (codePoint >= 0xfe00 && codePoint <= 0xfe0f) return true;
  if (codePoint === 0xfeff || codePoint === 0xffa0) return true;
  if (codePoint >= 0xe0100 && codePoint <= 0xe01ef) return true;
  return false;
}

function toUnicodeEscape(codePoint) {
  if (codePoint <= 0xffff) {
    return `\\u${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
  }

  const adjusted = codePoint - 0x10000;
  const high = 0xd800 + (adjusted >> 10);
  const low = 0xdc00 + (adjusted & 0x3ff);
  return `\\u${high.toString(16).toUpperCase()}\\u${low.toString(16).toUpperCase()}`;
}

export function escapeInvisibleChars(value) {
  let output = "";
  for (const char of String(value)) {
    const codePoint = char.codePointAt(0);
    if (isInvisibleCodePoint(codePoint)) {
      output += toUnicodeEscape(codePoint);
    } else {
      output += char;
    }
  }
  return output;
}

function sanitizeNode(value, seen) {
  if (typeof value === "string") {
    return escapeInvisibleChars(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeNode(item, seen));
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);

    const output = {};
    for (const [key, nested] of Object.entries(value)) {
      output[key] = sanitizeNode(nested, seen);
    }

    seen.delete(value);
    return output;
  }

  return value;
}

export function sanitizeForJsonExport(value) {
  return sanitizeNode(value, new WeakSet());
}
