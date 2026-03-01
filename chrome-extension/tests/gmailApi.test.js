import test from "node:test";
import assert from "node:assert/strict";
import { searchEmails } from "../lib/gmailApi.js";

function makeJsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    }
  };
}

function encodeBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

test("searchEmails: lists and fetches full messages", async () => {
  const fetchMock = async (url) => {
    if (url.includes("/messages?q=")) {
      return makeJsonResponse({
        messages: [{ id: "a" }, { id: "b" }]
      });
    }

    if (url.includes("/messages/a?format=full")) {
      return makeJsonResponse({
        id: "a",
        threadId: "ta",
        labelIds: ["INBOX"],
        snippet: "s-a",
        payload: {
          mimeType: "text/plain",
          headers: [{ name: "From", value: "sender@example.com" }],
          body: { data: encodeBase64Url("A body") }
        }
      });
    }

    if (url.includes("/messages/b?format=full")) {
      return makeJsonResponse({
        id: "b",
        threadId: "tb",
        labelIds: ["INBOX"],
        snippet: "s-b",
        payload: {
          mimeType: "text/plain",
          headers: [{ name: "Subject", value: "S" }],
          body: { data: encodeBase64Url("B body") }
        }
      });
    }

    return makeJsonResponse({ error: { message: "Not Found" } }, 404);
  };

  const result = await searchEmails({
    token: "token",
    request: { senderEmail: "sender@example.com", keywords: "invoice march", limit: 50 },
    fetchImpl: fetchMock
  });

  assert.equal(result.query, "from:sender@example.com invoice march");
  assert.equal(result.count, 2);
  assert.equal(result.messages[0].id, "a");
  assert.equal(result.messages[1].id, "b");
});

test("searchEmails: continues on per-message errors", async () => {
  const fetchMock = async (url) => {
    if (url.includes("/messages?q=")) {
      return makeJsonResponse({
        messages: [{ id: "ok-id" }, { id: "bad-id" }]
      });
    }

    if (url.includes("/messages/ok-id?format=full")) {
      return makeJsonResponse({
        id: "ok-id",
        threadId: "t-ok",
        labelIds: [],
        snippet: "ok",
        payload: {
          mimeType: "text/plain",
          headers: [],
          body: { data: encodeBase64Url("body") }
        }
      });
    }

    if (url.includes("/messages/bad-id?format=full")) {
      return makeJsonResponse({ error: { message: "Boom" } }, 500);
    }

    return makeJsonResponse({}, 404);
  };

  const result = await searchEmails({
    token: "token",
    request: { keywords: "x" },
    fetchImpl: fetchMock
  });

  assert.equal(result.count, 1);
  assert.equal(result.messages[0].id, "ok-id");
  assert.equal(result.errors?.length, 1);
  assert.match(result.errors[0].message, /Boom/);
});

test("searchEmails: throws on auth/list-level failures", async () => {
  const fetchMock = async () => makeJsonResponse({ error: { message: "Unauthorized" } }, 401);

  await assert.rejects(
    () =>
      searchEmails({
        token: "token",
        request: { keywords: "x" },
        fetchImpl: fetchMock
      }),
    /Unauthorized/
  );
});
