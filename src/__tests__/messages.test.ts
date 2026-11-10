import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmbedInstance } from "../EmbedInstance";
import { Logger, getAllowedOrigin } from "../utils";
import {
  getSigningFieldProblems,
  isKnownEmbedErrorCode,
  isTypedEmbedErrorCode,
  TYPED_EMBED_ERROR_CODES,
} from "../errors";
import type { SignatureFlowOptions } from "../types";

// The vitest environment is node: a minimal DOM stand-in is enough to drive the message listener.
const iframeWindow = {};
let listener: ((event: unknown) => void) | undefined;

function fakeElement() {
  return {
    style: {} as Record<string, string>,
    setAttribute: vi.fn(),
    appendChild: vi.fn(),
    addEventListener: vi.fn(),
    remove: vi.fn(),
    contentWindow: iframeWindow,
  };
}

beforeEach(() => {
  listener = undefined;
  vi.stubGlobal("window", {
    addEventListener: (_: string, fn: (event: unknown) => void) => {
      listener = fn;
    },
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("document", {
    createElement: () => fakeElement(),
    body: { style: {}, appendChild: vi.fn() },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function open(options: Partial<SignatureFlowOptions>) {
  return new EmbedInstance(
    { publicKey: "pk_test", environment: "development", debug: false },
    { sessionId: "ses_1", mode: "modal", ...options },
    new Logger(false),
  );
}

function post(data: unknown, source: unknown = iframeWindow) {
  listener?.({ origin: getAllowedOrigin("development"), source, data });
}

describe("iframe messages", () => {
  it("an old SUCCESS (no result, no signatureKind) still parses as before", () => {
    const onSuccess = vi.fn();
    open({ onSuccess });
    const data = {
      sessionId: "ses_1",
      documentId: "doc_1",
      signatureId: "sig_1",
      signedAt: "2026-11-10T10:00:00.000Z",
    };
    post({ source: "chaindoc-embed", type: "SUCCESS", data });
    expect(onSuccess).toHaveBeenCalledWith(data);
  });

  it("SUCCESS carries result.kind and signatureKind through", () => {
    const onSuccess = vi.fn();
    open({ onSuccess });
    post({
      source: "chaindoc-embed",
      type: "SUCCESS",
      data: {
        sessionId: "ses_1",
        documentId: "doc_1",
        signatureId: "sig_1",
        signedAt: "2026-11-10T10:00:00.000Z",
        result: { kind: "contract_signature" },
        signatureKind: "qualified",
      },
    });
    const got = onSuccess.mock.calls[0][0];
    expect(got.result.kind).toBe("contract_signature");
    expect(got.signatureKind).toBe("qualified");
  });

  it("DECLINED reaches onDecline with the reason, and does not call onCancel", () => {
    const onDecline = vi.fn();
    const onCancel = vi.fn();
    open({ onDecline, onCancel });
    post({
      source: "chaindoc-embed",
      type: "DECLINED",
      data: { sessionId: "ses_1", reason: "Wrong amount" },
    });
    post({ source: "chaindoc-embed", type: "CANCEL" });
    expect(onDecline).toHaveBeenCalledWith({
      sessionId: "ses_1",
      reason: "Wrong amount",
    });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("DECLINED without a reason is delivered without one", () => {
    const onDecline = vi.fn();
    open({ onDecline });
    post({
      source: "chaindoc-embed",
      type: "DECLINED",
      data: { sessionId: "ses_1" },
    });
    expect(onDecline.mock.calls[0][0].reason).toBeUndefined();
  });

  it("CANCEL still calls onCancel when nothing was declined", () => {
    const onCancel = vi.fn();
    open({ onCancel });
    post({ source: "chaindoc-embed", type: "CANCEL" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("ignores a message from another window", () => {
    const onDecline = vi.fn();
    open({ onDecline });
    post({ source: "chaindoc-embed", type: "DECLINED", data: {} }, {});
    expect(onDecline).not.toHaveBeenCalled();
  });

  it("passes a typed code and an unknown code to onError unchanged", () => {
    const onError = vi.fn();
    open({ onError });
    post({
      source: "chaindoc-embed",
      type: "ERROR",
      data: { code: "NOT_YOUR_TURN", message: "Wait" },
    });
    post({
      source: "chaindoc-embed",
      type: "ERROR",
      data: { code: "SOME_FUTURE_CODE", message: "New" },
    });
    expect(onError.mock.calls[0][0].code).toBe("NOT_YOUR_TURN");
    expect(onError.mock.calls[1][0].code).toBe("SOME_FUTURE_CODE");
  });
});

describe("error codes", () => {
  it("names every typed refusal of the embed", () => {
    for (const code of [
      "NOT_YOUR_TURN",
      "ACCOUNT_READ_ONLY",
      "KYC_WAITS_FOR_A_UNIT",
      "SIGNING_FIELDS_EMPTY",
      "INTEGRATIONS_NOT_IN_PLAN",
      "PAYMENT_PROVIDER_ERROR",
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      "EMBEDDED_PAYMENT_METHOD_NOT_REQUIRED",
      "EMBEDDED_PAYMENT_METHOD_ALREADY_LINKED",
      "EMBEDDED_SIGNING_REQUEST_CLOSED",
      "EMBEDDED_CONTRACT_NOT_SIGNABLE",
    ]) {
      expect(TYPED_EMBED_ERROR_CODES).toContain(code);
      expect(isTypedEmbedErrorCode(code)).toBe(true);
    }
  });

  it("does not claim to know an unknown code, and keeps old codes known", () => {
    expect(isKnownEmbedErrorCode("SOME_FUTURE_CODE")).toBe(false);
    expect(isTypedEmbedErrorCode("SESSION_EXPIRED")).toBe(false);
    expect(isKnownEmbedErrorCode("SESSION_EXPIRED")).toBe(true);
    expect(isKnownEmbedErrorCode(42)).toBe(false);
  });

  it("reads the field list of SIGNING_FIELDS_EMPTY and drops malformed entries", () => {
    const fields = getSigningFieldProblems({
      code: "SIGNING_FIELDS_EMPTY",
      details: {
        fields: [
          { key: "p1", name: "Company", problem: "missing" },
          { key: "p2", problem: "invalid" },
          { name: "no key" },
          "junk",
        ],
      },
    });
    expect(fields).toEqual([
      { key: "p1", name: "Company", problem: "missing" },
      { key: "p2", name: "p2", problem: "invalid" },
    ]);
  });

  it("returns null for any other code and [] when the list is absent", () => {
    expect(getSigningFieldProblems({ code: "NOT_YOUR_TURN" })).toBeNull();
    expect(getSigningFieldProblems({ code: "SIGNING_FIELDS_EMPTY" })).toEqual(
      [],
    );
  });
});
