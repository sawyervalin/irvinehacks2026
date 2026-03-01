function base64UrlToBytes(base64url) {
  const normalized = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(padded, "base64"));
  }

  throw new Error("No base64 decoder available in this environment.");
}

export function decodeBase64Url(base64url) {
  if (!base64url) {
    return "";
  }
  const bytes = base64UrlToBytes(base64url);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function normalizeHeaderKey(rawName) {
  return rawName
    .split("-")
    .map((segment, index) => {
      if (index === 0) {
        return segment.charAt(0).toLowerCase() + segment.slice(1);
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join("");
}

function parseHeaders(rawHeaders = []) {
  const lowerMap = {};
  for (const header of rawHeaders) {
    if (!header?.name) {
      continue;
    }
    lowerMap[header.name.toLowerCase()] = header.value || "";
  }

  const headers = {
    from: lowerMap.from,
    to: lowerMap.to,
    cc: lowerMap.cc,
    bcc: lowerMap.bcc,
    subject: lowerMap.subject,
    date: lowerMap.date,
    messageId: lowerMap["message-id"],
    replyTo: lowerMap["reply-to"]
  };

  for (const [key, value] of Object.entries(lowerMap)) {
    const camelKey = normalizeHeaderKey(key);
    if (!headers[camelKey]) {
      headers[camelKey] = value;
    }
  }

  return headers;
}

function collectBodyAndParts(node, state) {
  if (!node) {
    return;
  }

  if (node !== state.rootNode) {
    state.parts.push({
      mimeType: node.mimeType,
      filename: node.filename || undefined,
      bodySize: node.body?.size
    });
  }

  const bodyData = node.body?.data;
  if (bodyData) {
    const decoded = decodeBase64Url(bodyData);
    if (node.mimeType === "text/plain") {
      state.textPlain.push(decoded);
    } else if (node.mimeType === "text/html") {
      state.textHtml.push(decoded);
    }
  }

  const childParts = Array.isArray(node.parts) ? node.parts : [];
  for (const part of childParts) {
    collectBodyAndParts(part, state);
  }
}

export function parseMessage(message) {
  const payload = message?.payload || {};
  const state = {
    rootNode: payload,
    textPlain: [],
    textHtml: [],
    parts: []
  };

  collectBodyAndParts(payload, state);

  return {
    id: message.id,
    threadId: message.threadId,
    historyId: message.historyId,
    internalDate: message.internalDate,
    sizeEstimate: message.sizeEstimate,
    labelIds: message.labelIds || [],
    snippet: message.snippet,
    headers: parseHeaders(payload.headers || []),
    body: {
      textPlain: state.textPlain.join("\n\n") || undefined,
      textHtml: state.textHtml.join("\n\n") || undefined
    },
    raw: {
      payloadMimeType: payload.mimeType,
      parts: state.parts
    }
  };
}
