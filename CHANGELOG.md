# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-04-24

### Added

- **Iframe fullscreen protocol**: Two new inbound postMessage events (`REQUEST_FULLSCREEN` and `EXIT_FULLSCREEN`) let the embedded UI expand the iframe to cover the entire parent viewport and then restore it. The iframe's inline style is saved on enter and restored on exit, and `RESIZE` messages are ignored while fullscreen is active so the UI cannot clobber the expanded height. Works uniformly in modal and inline modes and on iOS Safari (no reliance on the native Fullscreen API, which does not work for arbitrary elements on iPhone). Scroll-chaining from the fullscreen iframe is handled inside the iframe via `overscroll-behavior: contain` on the embedded UI side, so no host-page state (e.g. `body.overflow`) is mutated and there is nothing to leak back if a restore path is ever missed.

## [2.0.0] - 2026-04-23

Version aligned with `@chaindoc_io/server-sdk` 2.0.0 so both SDKs share a matching major across the ecosystem. No breaking changes in the embed SDK itself — all changes below are additive and backward compatible with the 1.0.x API.

### Added

- **`closeOnEscape` option**: Control whether the embed modal can be closed via the Escape key. Passed to the iframe as a query parameter so the embedded UI stays in sync with the host decision.
- **Unit tests**: `ChaindocEmbed.test.ts` covering SDK initialization and the signature flow.

### Fixed

- **Downloads inside sandboxed iframe**: `allow-downloads` is now included in the iframe sandbox, so document downloads triggered from the embedded signing UI work in both modal and inline flows.
- **`onCancel` after success**: Closing the modal (click outside, Escape, or CANCEL postMessage) no longer fires `onCancel` after `onSuccess` has already fired. Prevents false cancel events when the user simply dismisses the success screen.
- **`mode` and `theme` params**: Now passed to the iframe URL as separate query parameters (`mode` from state, `theme` independent) so the embedded UI receives both consistently.

### Changed

- **`publicKey` documentation**: Clarified that `publicKey` is currently used only for SDK-side initialization validation — it is not sent to the iframe and is not used for runtime authentication. Embedded session auth is handled via OTP → JWT inside the embedded flow. The field is retained for forward compatibility (origin binding, usage logging, session policy).

---

## [1.0.0] - 2024-12-10

### Added
- **Stable Release** - First production-ready version of Chaindoc Embed SDK
- Modal and inline display modes for signature flows
- PostMessage-based secure communication with iframe
- Event callbacks: `onSuccess`, `onError`, `onCancel`, `onReady`, `onClose`
- Theme switching (light/dark mode)
- Localization support for 14 languages (en, ru, uk, pl, de, es, pt, fr, et, kk, zh, hi, tr, vi)
- Full TypeScript support with type definitions
- CDN distribution via unpkg and jsDelivr
- UMD, ESM, and CommonJS build outputs
- Zero runtime dependencies

### Changed
- Simplified SDK configuration - removed `baseUrl` property (environment-based URLs are now automatic)
- Updated embed domains for production, staging, and development environments

### Security
- Origin validation for postMessage communication
- Sandboxed iframe with minimal required permissions

---

[2.1.0]: https://github.com/ChaindocIO/embed-sdk/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/ChaindocIO/embed-sdk/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/ChaindocIO/embed-sdk/releases/tag/v1.0.0
