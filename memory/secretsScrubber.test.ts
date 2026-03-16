import { test, expect, describe } from "bun:test";
import { scrubSecrets } from "./secretsScrubber.js";

describe("scrubSecrets", () => {
  // --- Clean content ---
  test("clean string returns unchanged with empty redactions", () => {
    const r = scrubSecrets("no secrets here, just normal text");
    expect(r.scrubbed).toBe("no secrets here, just normal text");
    expect(r.redactions).toEqual([]);
  });

  test("empty string returns unchanged", () => {
    const r = scrubSecrets("");
    expect(r.scrubbed).toBe("");
    expect(r.redactions).toEqual([]);
  });

  test("unicode content returns unchanged when no secrets", () => {
    const r = scrubSecrets("héllo wörld 日本語");
    expect(r.scrubbed).toBe("héllo wörld 日本語");
    expect(r.redactions).toEqual([]);
  });

  // --- AWS access key ---
  test("detects aws-access-key", () => {
    const r = scrubSecrets("key: AKIAIOSFODNN7EXAMPLE");
    expect(r.scrubbed).toContain("[REDACTED:aws-access-key]");
    expect(r.redactions).toContain("aws-access-key");
  });

  test("no false positive for aws-access-key with short token", () => {
    const r = scrubSecrets("AKIA123SHORT");
    expect(r.redactions).not.toContain("aws-access-key");
  });

  // --- GitHub token ---
  test("detects github-token (ghp_)", () => {
    const r = scrubSecrets("token ghp_abcdefghijklmnopqrstuvwxyz1234567890AB");
    expect(r.scrubbed).toContain("[REDACTED:github-token]");
    expect(r.redactions).toContain("github-token");
  });

  test("detects github-token (ghs_)", () => {
    const r = scrubSecrets("ghs_abcdefghijklmnopqrstuvwxyz1234567890ABCD");
    expect(r.redactions).toContain("github-token");
  });

  test("no false positive for github-token with short token", () => {
    const r = scrubSecrets("ghp_short123");
    expect(r.redactions).not.toContain("github-token");
  });

  // --- OpenAI key ---
  test("detects openai-key (sk- 48 chars)", () => {
    const r = scrubSecrets("sk-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV");
    expect(r.scrubbed).toContain("[REDACTED:openai-key]");
    expect(r.redactions).toContain("openai-key");
  });

  test("detects openai-key (sk-proj-)", () => {
    const r = scrubSecrets("my key is sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNO");
    expect(r.redactions).toContain("openai-key");
  });

  test("no false positive for openai-key with short token", () => {
    const r = scrubSecrets("sk-short");
    expect(r.redactions).not.toContain("openai-key");
  });

  // --- Anthropic key ---
  test("detects anthropic-key", () => {
    const key = "sk-ant-" + "a".repeat(93);
    const r = scrubSecrets(`key=${key}`);
    expect(r.scrubbed).toContain("[REDACTED:anthropic-key]");
    expect(r.redactions).toContain("anthropic-key");
  });

  test("no false positive for short anthropic-like token", () => {
    const r = scrubSecrets("sk-ant-short");
    expect(r.redactions).not.toContain("anthropic-key");
  });

  // --- Google API key ---
  test("detects google-api-key", () => {
    const r = scrubSecrets("AIzaSyAbcdefghijklmnopqrstuvwxyz12345678");
    expect(r.scrubbed).toContain("[REDACTED:google-api-key]");
    expect(r.redactions).toContain("google-api-key");
  });

  test("no false positive for google-api-key with short key", () => {
    const r = scrubSecrets("AIzaSyShort");
    expect(r.redactions).not.toContain("google-api-key");
  });

  // --- Stripe key ---
  test("detects stripe-key (sk_test_)", () => {
    const r = scrubSecrets("sk_test_abcdefghijklmnopqrstuvwxyz12");
    expect(r.scrubbed).toContain("[REDACTED:stripe-key]");
    expect(r.redactions).toContain("stripe-key");
  });

  test("detects stripe-key (pk_live_)", () => {
    const r = scrubSecrets("pk_live_abcdefghijklmnopqrstuvwxyz12");
    expect(r.redactions).toContain("stripe-key");
  });

  // --- Slack token ---
  test("detects slack-token", () => {
    // Split to avoid triggering GitHub secret scanning on test fixtures
    const fakeToken = "xoxb" + "-123456789012-123456789012-abcdefghijklmnopqrstuvwx";
    const r = scrubSecrets(fakeToken);
    expect(r.scrubbed).toContain("[REDACTED:slack-token]");
    expect(r.redactions).toContain("slack-token");
  });

  test("no false positive for short slack-like token", () => {
    const r = scrubSecrets("xoxb-123");
    expect(r.redactions).not.toContain("slack-token");
  });

  // --- JWT ---
  test("detects jwt", () => {
    const r = scrubSecrets("token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
    expect(r.scrubbed).toContain("[REDACTED:jwt]");
    expect(r.redactions).toContain("jwt");
  });

  // --- Bearer token ---
  test("detects bearer-token", () => {
    const r = scrubSecrets("Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abc");
    expect(r.scrubbed).toContain("Bearer [REDACTED:bearer-token]");
    expect(r.redactions).toContain("bearer-token");
  });

  test("bearer-token case insensitive", () => {
    const r = scrubSecrets("authorization: BEARER abcdefghijklmnopqrstuvwxyz1234567890");
    expect(r.redactions).toContain("bearer-token");
  });

  // --- Connection string ---
  test("detects postgres connection-string", () => {
    const r = scrubSecrets("DATABASE_URL=postgres://user:password@localhost:5432/mydb");
    expect(r.scrubbed).toContain("[REDACTED:connection-string]");
    expect(r.redactions).toContain("connection-string");
  });

  test("detects mongodb connection-string", () => {
    const r = scrubSecrets("mongodb://admin:secret@mongo.example.com:27017/mydb");
    expect(r.redactions).toContain("connection-string");
  });

  test("no false positive for postgres without credentials", () => {
    const r = scrubSecrets("using postgres database");
    expect(r.redactions).not.toContain("connection-string");
  });

  // --- Private key ---
  test("detects private-key block", () => {
    const r = scrubSecrets("-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----");
    expect(r.scrubbed).toContain("[REDACTED:private-key]");
    expect(r.redactions).toContain("private-key");
  });

  test("detects EC private key", () => {
    const r = scrubSecrets("-----BEGIN EC PRIVATE KEY-----\nABCDEF==\n-----END EC PRIVATE KEY-----");
    expect(r.redactions).toContain("private-key");
  });

  // --- Generic API key ---
  test("detects generic api_key pattern", () => {
    const r = scrubSecrets(`config = { api_key: 'abcdefghijklmnopqrstuvwxyz1234' }`);
    expect(r.scrubbed).toContain("[REDACTED:generic-api-key]");
    expect(r.redactions).toContain("generic-api-key");
  });

  test("detects access_token pattern", () => {
    const r = scrubSecrets(`access_token = "abcdefghijklmnopqrstuvwxyz12345"`);
    expect(r.redactions).toContain("generic-api-key");
  });

  // --- Multiple secrets in one string ---
  test("detects multiple secrets in one string", () => {
    const r = scrubSecrets(
      "key=AKIAIOSFODNN7EXAMPLE and token=ghp_abcdefghijklmnopqrstuvwxyz1234567890AB"
    );
    expect(r.redactions).toContain("aws-access-key");
    expect(r.redactions).toContain("github-token");
    expect(r.scrubbed).toContain("[REDACTED:aws-access-key]");
    expect(r.scrubbed).toContain("[REDACTED:github-token]");
    expect(r.redactions.length).toBe(2);
  });

  // --- Deduplication ---
  test("redactions are deduplicated for repeated secrets", () => {
    const token = "ghp_abcdefghijklmnopqrstuvwxyz1234567890AB";
    const r = scrubSecrets(`token1=${token} token2=${token}`);
    expect(r.redactions.filter(x => x === "github-token").length).toBe(1);
  });
});
