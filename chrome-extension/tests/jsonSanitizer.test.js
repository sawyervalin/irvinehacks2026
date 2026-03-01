import test from "node:test";
import assert from "node:assert/strict";
import { escapeInvisibleChars, sanitizeForJsonExport } from "../lib/jsonSanitizer.js";

test("escapeInvisibleChars: converts zero-width and control chars to unicode escapes", () => {
  const value = `A\u200BB\u0007C`;
  const escaped = escapeInvisibleChars(value);
  assert.equal(escaped, "A\\u200BB\\u0007C");
});

test("sanitizeForJsonExport: escapes nested string values", () => {
  const payload = {
    snippet: "Hi\u00A0there",
    body: {
      textPlain: "Line1\u202ELine2"
    },
    arr: ["X\u200D", 1, true]
  };

  const sanitized = sanitizeForJsonExport(payload);
  assert.equal(sanitized.snippet, "Hi\\u00A0there");
  assert.equal(sanitized.body.textPlain, "Line1\\u202ELine2");
  assert.equal(sanitized.arr[0], "X\\u200D");
  assert.equal(sanitized.arr[1], 1);
});

test("sanitizeForJsonExport: handles circular references safely", () => {
  const payload = { name: "root" };
  payload.self = payload;

  const sanitized = sanitizeForJsonExport(payload);
  assert.equal(sanitized.self, "[Circular]");
});
