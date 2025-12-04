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
# Install alpha version for testing
npm install @chaindoc_io/embed-sdk@alpha
```

Or using yarn:

```bash
yarn add @chaindoc_io/embed-sdk@alpha
```

> **⚠️ Alpha Release**: This is an early alpha version for testing purposes. API may change.

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

- [Implementation Guide](docs/SDK_IMPLEMENTATION_GUIDE.md)
- [API Documentation](#) _(coming soon)_
- [Examples](#) _(coming soon)_

## Development Status

⚠️ **Alpha Release** - This SDK is in early alpha testing. The API may change before stable release. Use in production at your own risk.

**Current Version**: `0.1.0-alpha.0`

**What works:**

- ✅ Modal and inline display modes
- ✅ PostMessage communication with iframe
- ✅ Event callbacks (onSuccess, onError, onCancel, etc.)
- ✅ Theme switching (light/dark)
- ✅ TypeScript support

**Known limitations:**

- ⚠️ Not fully tested with real Chaindoc iframe yet
- ⚠️ May contain bugs - please report issues!
- ⚠️ API may change in future versions

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- GitHub Issues: [Report a bug](https://github.com/idealogic-io/chaindoc-websdk-core/issues)
- Documentation: https://docs.chaindoc.io

---

Made with ❤️ by the Chaindoc team
