import test from "node:test";
import assert from "node:assert/strict";
import { decodeBase64Url, parseMessage } from "../lib/messageParser.js";

function encodeBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

test("decodeBase64Url: decodes utf8 payload", () => {
  const encoded = encodeBase64Url("hello world");
  assert.equal(decodeBase64Url(encoded), "hello world");
});

test("parseMessage: parses single-part text/plain message", () => {
  const message = {
    id: "m1",
    threadId: "t1",
    labelIds: ["INBOX"],
    snippet: "snippet",
    payload: {
      mimeType: "text/plain",
      headers: [{ name: "Subject", value: "Test" }],
      body: { data: encodeBase64Url("Plain body") }
    }
  };

  const parsed = parseMessage(message);
  assert.equal(parsed.id, "m1");
  assert.equal(parsed.body.textPlain, "Plain body");
  assert.equal(parsed.body.textHtml, undefined);
  assert.equal(parsed.headers.subject, "Test");
});

test("parseMessage: parses multipart with plain + html parts", () => {
  const message = {
    id: "m2",
    threadId: "t2",
    labelIds: [],
    snippet: "snippet",
    payload: {
      mimeType: "multipart/alternative",
      headers: [],
      parts: [
        { mimeType: "text/plain", body: { data: encodeBase64Url("P") } },
        { mimeType: "text/html", body: { data: encodeBase64Url("<p>H</p>") } }
      ]
    }
  };

  const parsed = parseMessage(message);
  assert.equal(parsed.body.textPlain, "P");
  assert.equal(parsed.body.textHtml, "<p>H</p>");
  assert.equal(parsed.raw.parts.length, 2);
});

test("parseMessage: parses nested multipart trees", () => {
  const message = {
    id: "m3",
    threadId: "t3",
    labelIds: [],
    snippet: "snippet",
    payload: {
      mimeType: "multipart/mixed",
      headers: [],
      parts: [
        {
          mimeType: "multipart/alternative",
          parts: [
            { mimeType: "text/plain", body: { data: encodeBase64Url("Nested plain") } },
            { mimeType: "text/html", body: { data: encodeBase64Url("<b>Nested html</b>") } }
          ]
        }
      ]
    }
  };

  const parsed = parseMessage(message);
  assert.equal(parsed.body.textPlain, "Nested plain");
  assert.equal(parsed.body.textHtml, "<b>Nested html</b>");
});

test("parseMessage: falls back to snippet when no body data", () => {
  const message = {
    id: "m4",
    threadId: "t4",
    labelIds: [],
    snippet: "fallback snippet",
    payload: {
      mimeType: "multipart/mixed",
      headers: [],
      parts: [{ mimeType: "application/pdf", body: { size: 12 } }]
    }
  };

  const parsed = parseMessage(message);
  assert.equal(parsed.body.textPlain, undefined);
  assert.equal(parsed.body.textHtml, undefined);
  assert.equal(parsed.snippet, "fallback snippet");
});
