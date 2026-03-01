import test from "node:test";
import assert from "node:assert/strict";
import {
  buildIngestPayload,
  sendIngestToApp
} from "../lib/appBridge.js";

test("buildIngestPayload: wraps message payload with source and timestamp", () => {
  const input = { count: 2, messages: [{ id: "a" }] };
  const result = buildIngestPayload(input);

  assert.equal(result.source, "chrome-extension");
  assert.equal(result.data, input);
  assert.equal(typeof result.ingestedAt, "string");
  assert.ok(!Number.isNaN(Date.parse(result.ingestedAt)));
});

test("sendIngestToApp: posts payload with expected headers", async () => {
  let calledUrl = "";
  let calledOptions = {};
  const fetchMock = async (url, options) => {
    calledUrl = url;
    calledOptions = options;
    return {
      ok: true,
      status: 200
    };
  };

  const data = { count: 1, messages: [{ id: "m1" }] };
  const result = await sendIngestToApp({
    data,
    appBaseUrl: "http://localhost:3000",
    apiKey: "test-key",
    fetchImpl: fetchMock
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(calledUrl, "http://localhost:3000/api/gmail-ingest");
  assert.equal(calledOptions.method, "POST");
  assert.equal(calledOptions.headers["Content-Type"], "application/json");
  assert.equal(calledOptions.headers["x-extension-api-key"], "test-key");
  const parsedBody = JSON.parse(calledOptions.body);
  assert.equal(parsedBody.source, "chrome-extension");
  assert.deepEqual(parsedBody.data, data);
});
