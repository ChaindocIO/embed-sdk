# Chaindoc Embed SDK

**Official JavaScript/TypeScript SDK for embedding Chaindoc signature flows into web applications**

[![npm version](https://img.shields.io/npm/v/@chaindoc_io/embed-sdk.svg)](https://www.npmjs.com/package/@chaindoc_io/embed-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

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
