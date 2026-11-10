# Chaindoc Embed SDK

**Official JavaScript/TypeScript SDK for embedding Chaindoc signature flows into web applications**

[![npm version](https://img.shields.io/npm/v/@chaindoc_io/embed-sdk.svg)](https://www.npmjs.com/package/@chaindoc_io/embed-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

What changed in November 2026 → server-sdk `docs/WHATS-CHANGED-2026-11.md`

## What is Chaindoc Embed SDK?

Chaindoc Embed SDK is a lightweight JavaScript library that allows you to seamlessly integrate document signing functionality into your web application. Instead of redirecting users to a separate signing page, you can embed the entire signing experience directly within your site using a modal dialog or inline container.

## Features

- **Zero Backend Integration** - SDK manages iframe lifecycle; your backend only creates signing sessions
- **Event-Driven Architecture** - Type-safe postMessage API for real-time communication
- **Multiple Display Modes** - Modal overlay or inline embedding
- **Framework Agnostic** - Works with React, Vue, Angular, vanilla JavaScript, or any web framework
- **TypeScript Support** - Full type definitions included
- **Secure by Default** - Origin validation and sandboxed iframe
- **Lightweight** - Zero runtime dependencies, <10KB gzipped
- **Auto-Responsive** - Iframe automatically resizes based on content

## Installation

```bash
npm install @chaindoc_io/embed-sdk
```

Or using yarn:

```bash
yarn add @chaindoc_io/embed-sdk
```

### CDN Usage

You can also use the SDK directly via CDN:

```html
<script src="https://unpkg.com/@chaindoc_io/embed-sdk"></script>
<script>
  const sdk = new ChaindocEmbed.ChaindocEmbed({
    publicKey: "pk_live_xxx",
    environment: "production",
  });
</script>
```

## Quick Start

```typescript
import { ChaindocEmbed } from "@chaindoc_io/embed-sdk";

// Initialize SDK
const sdk = new ChaindocEmbed({
  publicKey: "pk_live_xxx",
  environment: "production",
});

// Open signature flow in modal
const instance = sdk.openSignatureFlow({
  sessionId: "ses_xxx", // From your backend
  email: "user@example.com",
  mode: "modal",
  language: "en", // Optional: UI language (en, ru, uk, pl, de, es, pt, fr, et, kk, zh, hi, tr, vi)
  onSuccess: (data) => {
    console.log("Document signed!", data);
    instance.close();
  },
  onError: (error) => {
    console.error("Signing failed:", error);
  },
});
```

## `publicKey` today

`publicKey` is still required and validated on SDK initialization, but it is not currently forwarded to the iframe or used for runtime authentication. The real embedded auth flow is:

1. Your backend creates an embedded session
2. The signer verifies OTP
3. The iframe receives a short-lived JWT for `/api/v1/embedded/*`

The field remains in the API for backward compatibility and future productization, but for Phase 0 it should be understood as ceremonial rather than security-critical runtime auth.

## How It Works

1. Your backend creates a signing session via Chaindoc API
2. You pass the `sessionId` to the SDK
3. SDK opens an iframe with the Chaindoc signing UI
4. User completes OTP verification and signs the document
5. SDK receives success event and calls your callback
6. You can verify the signature on your backend

## Display Modes

### Modal Mode (Default)

Opens a centered modal dialog with overlay - perfect for most use cases.

### Inline Mode

Embeds the signing flow directly into a container element on your page - ideal for multi-step forms or dedicated signing pages.

## Message protocol

The iframe app posts messages to the host page with `window.parent.postMessage(message, hostOrigin)`. The SDK accepts a
message only when `event.origin` is the iframe's origin, `event.source` is that iframe's window, and
`message.source === "chaindoc-embed"`. Every message is `{ source: "chaindoc-embed", type, data? }`.

### Iframe to SDK

| `type` | `data` | Since | SDK callback |
| --- | --- | --- | --- |
| `READY` | none | 1.0 | `onReady` |
| `RESIZE` | `{ height: number }` | 1.0 | none (sets iframe height) |
| `SUCCESS` | `SignatureSuccessData` (below) | 1.0, extended 2.3.0 | `onSuccess` |
| `DECLINED` | `DeclinedData` (below) | 2.3.0 | `onDecline` |
| `ERROR` | `SignatureErrorData` (below) | 1.0, codes extended 2.3.0 | `onError` |
| `CANCEL` | none | 1.0 | `onCancel` (not after `SUCCESS` or `DECLINED`) |
| `CLOSED` | none | 1.0 | `onClose`, removes the iframe |
| `RESEND_OTP` | `{ email: string, sentAt: string }` | 1.0 | `onResendOtp` |
| `REQUEST_FULLSCREEN` / `EXIT_FULLSCREEN` | none | 1.0 | none |

SDK to iframe (unchanged): `CLOSE` (no data), `THEME_CHANGE` with `{ theme: "light" | "dark" }`.

### `SUCCESS` data

```ts
{
  sessionId: string;
  documentId: string;
  signatureId: string;
  signedAt: string;               // ISO 8601
  result?: { kind: string };      // 2.3.0. What finished.
  signatureKind?: string;         // 2.3.0. How it was signed.
}
```

- `result.kind`: `"document_signature"` (a document or signature request was signed) or `"contract_signature"` (a
  contract was signed). The iframe must send one of these; the SDK types a future kind as a plain string.
- `signatureKind`: `"simple"` or `"qualified"` (QES).
- Both new fields are optional. An iframe older than 2.3.0 sends neither, and the SDK delivers the rest exactly as before.

### `DECLINED` data (2.3.0)

```ts
{
  sessionId: string;
  documentId?: string;
  reason?: string;       // what the signer typed; omit it when they gave none
  declinedAt?: string;   // ISO 8601
}
```

Send `DECLINED` once, when the signer's decline was accepted by the server. Do not send `CANCEL` for the same decline
(the SDK suppresses a later `CANCEL`, but the iframe should not rely on it). The flow is not a success: no `SUCCESS`.

### `ERROR` data

```ts
{ code: string; message: string; details?: Record<string, unknown> }
```

`code` is the server's `errorKey` verbatim for a typed refusal. The SDK passes any code through; an unknown code stays a
string (`EmbedErrorCode` is `KnownEmbedErrorCode | (string & Record<never, never>)`).

| `code` | Since | Meaning | `details` |
| --- | --- | --- | --- |
| `SESSION_EXPIRED`, `SESSION_NOT_FOUND`, `INVALID_OTP`, `OTP_EXPIRED`, `DOCUMENT_NOT_FOUND`, `ALREADY_SIGNED`, `NETWORK_ERROR`, `UNAUTHORIZED`, `RATE_LIMITED`, `SIGNATURE_LIMIT_EXCEEDED`, `SUBSCRIPTION_NOT_FOUND`, `USER_NOT_FOUND`, `EMAIL_MISMATCH`, `SESSION_ALREADY_CONFIRMED`, `NO_FILES_PROVIDED`, `SERVER_ERROR`, `UNKNOWN_ERROR` | 1.0 | unchanged | none |
| `NOT_YOUR_TURN` | 2.3.0 | an earlier signer has not signed yet | none |
| `ACCOUNT_READ_ONLY` | 2.3.0 | the sender's account is read only | none |
| `KYC_WAITS_FOR_A_UNIT` | 2.3.0 | identity check cannot start: no KYC unit available | none |
| `SIGNING_FIELDS_EMPTY` | 2.3.0 | fields the signer must fill are empty or invalid | `{ fields: { key: string, name: string, problem: "missing" \| "invalid" }[] }` |
| `SIGNING_METHOD_BELOW_REQUIREMENT` | 2.3.0 | the document needs a qualified signature the embed cannot make | none |
| `INTEGRATIONS_NOT_IN_PLAN` | 2.3.0 | the account's plan has no integrations | none |
| `PAYMENT_PROVIDER_ERROR` | 2.3.0 | the payment provider failed | none |
| `PAYMENT_PROVIDER_NOT_CONFIGURED` | 2.3.0 | no payment provider is configured | none |
| `EMBEDDED_PAYMENT_METHOD_NOT_REQUIRED` | 2.3.0 | the contract asks for no payment method | none |
| `EMBEDDED_PAYMENT_METHOD_ALREADY_LINKED` | 2.3.0 | a payment method is already linked | none |
| `EMBEDDED_SIGNING_REQUEST_CLOSED` | 2.3.0 | the signing request is closed | `{ status: string }` (optional) |
| `EMBEDDED_CONTRACT_NOT_SIGNABLE` | 2.3.0 | the contract is no longer being signed | `{ status: string }` (optional) |

`getSigningFieldProblems(error)` reads the field list of `SIGNING_FIELDS_EMPTY` (null for another code; malformed
entries are dropped).

```ts
sdk.openSignatureFlow({
  sessionId,
  onSuccess: ({ result, signatureKind }) => console.log(result?.kind, signatureKind),
  onDecline: ({ reason }) => console.log("declined", reason),
  onError: (error) => {
    if (error.code === "SIGNING_FIELDS_EMPTY") console.log(getSigningFieldProblems(error));
  },
});
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Android 90+

## Documentation

For detailed documentation, API reference, and examples, visit:

- [Introduction](https://chaindoc.io/docs/introduction)
- [Quick Start](https://chaindoc.io/docs/quick-start)
- [API Documentation](https://chaindoc.io/docs/api-docs)
- [Chaindoc SDKs](https://chaindoc.io/docs/sdks)
- [Changelog](CHANGELOG.md) - Version history

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history and migration guides.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- GitHub Issues: [Report a bug](https://github.com/ChaindocIO/embed-sdk/issues)
- Documentation: https://chaindoc.io/docs

---

Made with ❤️ by the Chaindoc team
