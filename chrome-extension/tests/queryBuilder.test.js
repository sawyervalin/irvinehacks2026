import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGmailQuery,
  normalizeDomain,
  normalizeKeywords,
  validateDomain,
  validateEmail
} from "../lib/queryBuilder.js";

test("validateEmail: accepts pragmatic valid email", () => {
  assert.equal(validateEmail("user@example.com"), true);
});

test("validateEmail: rejects malformed email", () => {
  assert.equal(validateEmail("bad@@example"), false);
});

test("validateDomain: accepts pragmatic valid domain", () => {
  assert.equal(validateDomain("company.com"), true);
});

test("validateDomain: rejects malformed domain", () => {
  assert.equal(validateDomain("company"), false);
});

test("normalizeDomain: trims, lowercases, strips leading @", () => {
  assert.equal(normalizeDomain(" @Sub.Example.com "), "sub.example.com");
});

test("normalizeKeywords: trims and splits by whitespace", () => {
  const tokens = normalizeKeywords(" invoice   march\tacme ");
  assert.deepEqual(tokens, ["invoice", "march", "acme"]);
});

test("buildGmailQuery: sender only", () => {
  const query = buildGmailQuery({ senderEmail: "sender@example.com" });
  assert.equal(query.query, "from:sender@example.com");
  assert.equal(query.limit, 20);
});

test("buildGmailQuery: keywords only", () => {
  const query = buildGmailQuery({ keywords: "foo bar" });
  assert.equal(query.query, "foo bar");
});

test("buildGmailQuery: domain only", () => {
  const query = buildGmailQuery({ senderDomain: "company.com" });
  assert.equal(query.query, "from:company.com");
});

test("buildGmailQuery: sender and keywords", () => {
  const query = buildGmailQuery({
    senderEmail: "sender@example.com",
    keywords: "foo bar",
    limit: 10
  });
  assert.equal(query.query, "from:sender@example.com foo bar");
  assert.equal(query.limit, 10);
});

test("buildGmailQuery: sender domain and keywords", () => {
  const query = buildGmailQuery({
    senderDomain: "company.com",
    keywords: "quarterly report"
  });
  assert.equal(query.query, "from:company.com quarterly report");
});

test("buildGmailQuery: clamps limit at 20", () => {
  const query = buildGmailQuery({ keywords: "x", limit: 1000 });
  assert.equal(query.limit, 20);
});

test("buildGmailQuery: rejects empty filters", () => {
  assert.throws(() => buildGmailQuery({}), /Provide sender email/);
});

test("buildGmailQuery: rejects invalid sender", () => {
  assert.throws(() => buildGmailQuery({ senderEmail: "invalid", keywords: "x" }), /invalid/i);
});

test("buildGmailQuery: rejects invalid domain", () => {
  assert.throws(() => buildGmailQuery({ senderDomain: "invalid_domain", keywords: "x" }), /invalid/i);
});
