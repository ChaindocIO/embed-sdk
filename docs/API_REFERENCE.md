# Chaindoc Embed SDK - API Reference

> **Version:** 0.1.0
> **Package:** `@chaindoc_io/embed-sdk` > **License:** MIT

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [ChaindocEmbed Class](#chaindocembed-class)
- [EmbedInstance Class](#embedinstance-class)
- [Configuration Reference](#configuration-reference)
- [Events Reference](#events-reference)
- [TypeScript Types](#typescript-types)
- [Error Codes](#error-codes)
- [Browser Compatibility](#browser-compatibility)

---

## Overview

Chaindoc Embed SDK enables seamless integration of document signing functionality into web applications. The SDK manages an iframe-based signing flow with secure communication between your application and the Chaindoc signing interface.

### Key Features

| Feature                | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| **Zero Dependencies**  | No external runtime dependencies                                 |
| **Type-Safe**          | Full TypeScript support with comprehensive type definitions      |
| **Framework Agnostic** | Works with React, Vue, Angular, Svelte, or vanilla JavaScript    |
| **Secure by Default**  | Origin validation, iframe sandboxing, no sensitive data exposure |
| **Lightweight**        | < 10KB gzipped                                                   |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your Application                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Create session via Server SDK (backend)                      │
│  2. Pass sessionId to frontend                                   │
│  3. Initialize ChaindocEmbed with publicKey                      │
│  4. Call openSignatureFlow({ sessionId })                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ postMessage (secure)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Chaindoc Iframe                                │
│              (app.chaindoc.io/embed/...)                        │
├─────────────────────────────────────────────────────────────────┤
│  • OTP verification                                              │
│  • Document preview                                              │
│  • Signature capture                                             │
│  • KYC verification (if required)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation

### npm

```bash
npm install @chaindoc_io/embed-sdk
```

### yarn

```bash
yarn add @chaindoc_io/embed-sdk
```

### pnpm

```bash
pnpm add @chaindoc_io/embed-sdk
```

### CDN (UMD)

```html
<script src="https://cdn.chaindoc.io/sdk/embed-sdk.umd.js"></script>
<script>
  const sdk = new ChaindocEmbed.ChaindocEmbed({ publicKey: "pk_..." });
</script>
```

---

## Quick Start

### Basic Usage

```typescript
import { ChaindocEmbed } from "@chaindoc_io/embed-sdk";

// 1. Initialize SDK (once per page)
const chaindoc = new ChaindocEmbed({
  publicKey: "pk_live_xxxxxxxxxxxxx",
  environment: "production",
});

// 2. Open signature flow (sessionId from your backend)
const instance = chaindoc.openSignatureFlow({
  sessionId: "ses_xxxxxxxxxxxxxxxx",

  onReady: () => {
    console.log("Signing interface loaded");
  },

  onSuccess: (data) => {
    console.log("Document signed:", data.signatureId);
    instance.close();
  },

  onError: (error) => {
    console.error("Signing failed:", error.code, error.message);
  },

  onCancel: () => {
    console.log("User cancelled");
    instance.close();
  },
});
```

### With React

```tsx
import { useCallback, useRef, useEffect } from "react";
import { ChaindocEmbed, EmbedInstance } from "@chaindoc_io/embed-sdk";

function SignatureButton({ sessionId }: { sessionId: string }) {
  const sdkRef = useRef<ChaindocEmbed | null>(null);
  const instanceRef = useRef<EmbedInstance | null>(null);

  useEffect(() => {
    sdkRef.current = new ChaindocEmbed({
      publicKey: process.env.REACT_APP_CHAINDOC_PUBLIC_KEY!,
    });

    return () => {
      sdkRef.current?.destroy();
    };
  }, []);

  const handleSign = useCallback(() => {
    if (!sdkRef.current) return;

    instanceRef.current = sdkRef.current.openSignatureFlow({
      sessionId,
      onSuccess: (data) => {
        // Handle success - refresh data, show confirmation, etc.
        instanceRef.current?.close();
      },
      onError: (error) => {
        // Handle error - show notification, retry, etc.
      },
      onCancel: () => {
        instanceRef.current?.close();
      },
    });
  }, [sessionId]);

  return <button onClick={handleSign}>Sign Document</button>;
}
```

### With Vue 3

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { ChaindocEmbed, type EmbedInstance } from "@chaindoc_io/embed-sdk";

const props = defineProps<{ sessionId: string }>();

let sdk: ChaindocEmbed | null = null;
let instance: EmbedInstance | null = null;

onMounted(() => {
  sdk = new ChaindocEmbed({
    publicKey: import.meta.env.VITE_CHAINDOC_PUBLIC_KEY,
  });
});

onUnmounted(() => {
  sdk?.destroy();
});

function openSignature() {
  if (!sdk) return;

  instance = sdk.openSignatureFlow({
    sessionId: props.sessionId,
    onSuccess: (data) => {
      instance?.close();
      // Handle success
    },
    onCancel: () => {
      instance?.close();
    },
  });
}
</script>

<template>
  <button @click="openSignature">Sign Document</button>
</template>
```

---

## ChaindocEmbed Class

The main SDK class. Create one instance per configuration.

### Constructor

```typescript
new ChaindocEmbed(config: ChaindocEmbedConfig)
```

#### Parameters

| Parameter | Type                  | Required | Description              |
| --------- | --------------------- | -------- | ------------------------ |
| `config`  | `ChaindocEmbedConfig` | Yes      | SDK configuration object |

#### Example

```typescript
const chaindoc = new ChaindocEmbed({
  publicKey: "pk_live_xxxxxxxxxxxxx",
  environment: "production",
  debug: false,
});
```

---

### Methods

#### `openSignatureFlow(options)`

Opens a new signature flow interface.

```typescript
openSignatureFlow(options: SignatureFlowOptions): EmbedInstance
```

##### Parameters

| Parameter | Type                   | Required | Description                      |
| --------- | ---------------------- | -------- | -------------------------------- |
| `options` | `SignatureFlowOptions` | Yes      | Flow configuration and callbacks |

##### Returns

`EmbedInstance` - Controller for the opened flow

##### Example

```typescript
const instance = chaindoc.openSignatureFlow({
  sessionId: "ses_abc123",
  mode: "modal",
  theme: "dark",
  onSuccess: (data) => {
    console.log("Signed!", data);
  },
});
```

---

#### `destroy()`

Destroys the SDK instance and all active flows.

```typescript
destroy(): void
```

##### Example

```typescript
// Clean up on component unmount
chaindoc.destroy();
```

---

### Static Properties

#### `version`

Returns the current SDK version.

```typescript
ChaindocEmbed.version: string
```

##### Example

```typescript
console.log(ChaindocEmbed.version); // "0.1.0"
```

---

## EmbedInstance Class

Controls a single signature flow. Created by `openSignatureFlow()`.

### Methods

#### `close()`

Closes the signature flow and cleans up resources.

```typescript
close(): void
```

##### Example

```typescript
instance.close();
```

---

#### `changeTheme(theme)`

Dynamically changes the UI theme.

```typescript
changeTheme(theme: Theme): void
```

##### Parameters

| Parameter | Type                  | Required | Description        |
| --------- | --------------------- | -------- | ------------------ |
| `theme`   | `'light'` \| `'dark'` | Yes      | New theme to apply |

##### Example

```typescript
// Switch to dark mode
instance.changeTheme("dark");
```

---

#### `isReady()`

Checks if the iframe has finished loading.

```typescript
isReady(): boolean
```

##### Returns

`boolean` - `true` if the iframe has sent the READY message

##### Example

```typescript
if (instance.isReady()) {
  console.log("Interface is ready");
}
```

---

#### `getSessionId()`

Returns the current session ID.

```typescript
getSessionId(): string
```

##### Returns

`string` - The session ID for this flow

##### Example

```typescript
console.log("Current session:", instance.getSessionId());
```

---

## Configuration Reference

### ChaindocEmbedConfig

SDK initialization configuration.

```typescript
interface ChaindocEmbedConfig {
  publicKey: string;
  environment?: Environment;
  debug?: boolean;
}
```

| Property      | Type          | Required | Default        | Description                          |
| ------------- | ------------- | -------- | -------------- | ------------------------------------ |
| `publicKey`   | `string`      | **Yes**  | -              | Your API public key (format: `pk_*`) |
| `environment` | `Environment` | No       | `'production'` | Target environment                   |
| `debug`       | `boolean`     | No       | `false`        | Enable debug logging to console      |

---

### SignatureFlowOptions

Configuration for opening a signature flow.

```typescript
interface SignatureFlowOptions {
  // Required
  sessionId: string;

  // Display options
  mode?: DisplayMode;
  container?: HTMLElement | string;
  theme?: Theme;
  zIndex?: number;
  modalWidth?: number;
  modalHeight?: number;

  // Behavior options
  email?: string;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;

  // Event callbacks
  onReady?: () => void;
  onSuccess?: (data: SignatureSuccessData) => void;
  onError?: (error: SignatureErrorData) => void;
  onCancel?: () => void;
  onClose?: () => void;
  onResendOtp?: (data: ResendOtpData) => void;
}
```

| Property              | Type                    | Required | Default   | Description                                               |
| --------------------- | ----------------------- | -------- | --------- | --------------------------------------------------------- |
| `sessionId`           | `string`                | **Yes**  | -         | Session ID from your backend (format: `ses_*`)            |
| `mode`                | `DisplayMode`           | No       | `'modal'` | Display mode: `'modal'` or `'inline'`                     |
| `container`           | `HTMLElement \| string` | No\*     | -         | Container for inline mode (\*required if `mode='inline'`) |
| `theme`               | `Theme`                 | No       | `'light'` | UI theme: `'light'` or `'dark'`                           |
| `zIndex`              | `number`                | No       | `999999`  | Modal z-index                                             |
| `modalWidth`          | `number`                | No       | `800`     | Modal width in pixels                                     |
| `modalHeight`         | `number`                | No       | `600`     | Modal height in pixels                                    |
| `email`               | `string`                | No       | -         | Pre-fill email in OTP form                                |
| `closeOnClickOutside` | `boolean`               | No       | `true`    | Close modal on overlay click                              |
| `closeOnEscape`       | `boolean`               | No       | `true`    | Close modal on ESC key                                    |
| `onReady`             | `() => void`            | No       | -         | Called when iframe is ready                               |
| `onSuccess`           | `(data) => void`        | No       | -         | Called on successful signing                              |
| `onError`             | `(error) => void`       | No       | -         | Called on error                                           |
| `onCancel`            | `() => void`            | No       | -         | Called when user cancels                                  |
| `onClose`             | `() => void`            | No       | -         | Called when flow closes                                   |
| `onResendOtp`         | `(data) => void`        | No       | -         | Called when OTP is resent                                 |

---

## Events Reference

### onReady

Fired when the signing interface has loaded and is ready for interaction.

```typescript
onReady?: () => void
```

#### Example

```typescript
onReady: () => {
  console.log("Interface loaded");
  // Hide loading spinner, enable UI, etc.
};
```

---

### onSuccess

Fired when the document is successfully signed.

```typescript
onSuccess?: (data: SignatureSuccessData) => void
```

#### SignatureSuccessData

```typescript
interface SignatureSuccessData {
  sessionId: string; // The session that was signed
  documentId: string; // The signed document ID
  signatureId: string; // The created signature ID
  signedAt: string; // ISO 8601 timestamp
}
```

#### Example

```typescript
onSuccess: (data) => {
  console.log("Document signed:", data.signatureId);
  console.log("Signed at:", new Date(data.signedAt));

  // Close the modal
  instance.close();

  // Refresh your application data
  await refreshDocuments();

  // Show success notification
  toast.success("Document signed successfully!");
};
```

---

### onError

Fired when an error occurs during the signing process.

```typescript
onError?: (error: SignatureErrorData) => void
```

#### SignatureErrorData

```typescript
interface SignatureErrorData {
  code: string; // Error code
  message: string; // Human-readable message
  details?: Record<string, unknown>; // Additional context
}
```

#### Example

```typescript
onError: (error) => {
  switch (error.code) {
    case "SESSION_EXPIRED":
      toast.error("Session expired. Please refresh and try again.");
      instance.close();
      break;

    case "OTP_INVALID":
      // Don't close - let user retry
      toast.warning("Invalid code. Please try again.");
      break;

    case "DOCUMENT_NOT_FOUND":
      toast.error("Document not found.");
      instance.close();
      break;

    default:
      toast.error(error.message);
  }
};
```

---

### onCancel

Fired when the user explicitly cancels the signing process.

```typescript
onCancel?: () => void
```

#### Example

```typescript
onCancel: () => {
  console.log("User cancelled signing");
  instance.close();

  // Optionally track cancellation
  analytics.track("signing_cancelled", { sessionId });
};
```

---

### onClose

Fired when the signing flow is closed (by any method).

```typescript
onClose?: () => void
```

#### Example

```typescript
onClose: () => {
  console.log("Signing flow closed");
  // Re-enable UI elements, cleanup, etc.
};
```

---

### onResendOtp

Fired when a new OTP is sent to the user.

```typescript
onResendOtp?: (data: ResendOtpData) => void
```

#### ResendOtpData

```typescript
interface ResendOtpData {
  email: string; // Email where OTP was sent
  sentAt: string; // ISO 8601 timestamp
}
```

#### Example

```typescript
onResendOtp: (data) => {
  toast.info(`New code sent to ${data.email}`);
};
```

---

## TypeScript Types

### Environment

```typescript
type Environment = "production" | "staging" | "development";
```

| Value           | Iframe URL                        |
| --------------- | --------------------------------- |
| `'production'`  | `https://app.chaindoc.io`         |
| `'staging'`     | `https://app-staging.chaindoc.io` |
| `'development'` | `http://localhost:3000`           |

---

### DisplayMode

```typescript
type DisplayMode = "modal" | "inline";
```

| Value      | Description                     |
| ---------- | ------------------------------- |
| `'modal'`  | Centered overlay with backdrop  |
| `'inline'` | Embedded in a container element |

---

### Theme

```typescript
type Theme = "light" | "dark";
```

---

## Error Codes

| Code                 | Description                  | Recommended Action             |
| -------------------- | ---------------------------- | ------------------------------ |
| `SESSION_EXPIRED`    | Signing session has expired  | Create new session and retry   |
| `SESSION_NOT_FOUND`  | Session ID is invalid        | Verify session ID from backend |
| `DOCUMENT_NOT_FOUND` | Document doesn't exist       | Contact support                |
| `OTP_INVALID`        | Entered OTP code is wrong    | Let user retry (don't close)   |
| `OTP_EXPIRED`        | OTP code has expired         | User can request new code      |
| `OTP_MAX_ATTEMPTS`   | Too many failed OTP attempts | Create new session             |
| `ALREADY_SIGNED`     | Document was already signed  | Refresh application state      |
| `SIGNATURE_FAILED`   | Signature creation failed    | Retry or contact support       |
| `NETWORK_ERROR`      | Network connectivity issue   | Check connection and retry     |
| `UNKNOWN_ERROR`      | Unexpected error             | Contact support with details   |

---

## Browser Compatibility

| Browser        | Minimum Version |
| -------------- | --------------- |
| Chrome         | 90+             |
| Edge           | 90+             |
| Firefox        | 88+             |
| Safari         | 14+             |
| Safari iOS     | 14+             |
| Chrome Android | 90+             |

### Required Browser APIs

The SDK uses the following browser APIs:

- `window.postMessage()` - Iframe communication
- `document.createElement()` - DOM manipulation
- `Element.querySelector()` - Container selection
- `KeyboardEvent` - ESC key handling

No polyfills are required for supported browsers.

---

## Display Modes

### Modal Mode (Default)

Opens a centered overlay with a semi-transparent backdrop.

```typescript
chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  mode: "modal",
  modalWidth: 800,
  modalHeight: 600,
  zIndex: 999999,
  closeOnClickOutside: true,
  closeOnEscape: true,
});
```

**Characteristics:**

- Fixed position, centered on screen
- Semi-transparent backdrop
- Scrolling disabled on body
- Closes on ESC key (configurable)
- Closes on backdrop click (configurable)
- Responsive: adapts to viewport

---

### Inline Mode

Embeds the signing interface within a container element.

```typescript
chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  mode: "inline",
  container: "#signing-container", // or HTMLElement
});
```

**Characteristics:**

- Renders inside specified container
- Takes full width of container
- Height adjusts automatically via RESIZE events
- Page scrolling remains enabled
- ESC/backdrop closing disabled

**HTML Setup:**

```html
<div id="signing-container" style="min-height: 400px;"></div>
```

---

## Security

### Origin Validation

All postMessage events are validated:

1. Origin must match expected Chaindoc domain
2. Source must be the SDK-created iframe
3. Message must have `source: 'chaindoc-embed'`

### Iframe Sandbox

The iframe uses restricted permissions:

```html
<iframe
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  allow="clipboard-write; camera; microphone; geolocation"
/>
```

### Data Handling

- **Public key only**: No secret keys in frontend code
- **No data storage**: SDK doesn't persist any data
- **HTTPS required**: Production enforces HTTPS

---

## Troubleshooting

### Common Issues

#### Iframe doesn't load

```typescript
// Enable debug mode to see detailed logs
const chaindoc = new ChaindocEmbed({
  publicKey: "pk_xxx",
  debug: true, // Check console for errors
});
```

#### Events not firing

Ensure callbacks are defined before calling `openSignatureFlow`:

```typescript
// Correct
const instance = chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  onSuccess: (data) => {
    /* ... */
  }, // Define callback here
});

// Incorrect - callbacks won't be registered
const instance = chaindoc.openSignatureFlow({ sessionId: "ses_xxx" });
instance.onSuccess = () => {}; // Too late!
```

#### Modal z-index conflicts

```typescript
chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  zIndex: 9999999, // Increase if needed
});
```

#### Container not found (inline mode)

```typescript
// Ensure container exists before calling
const container = document.getElementById("signing-container");
if (container) {
  chaindoc.openSignatureFlow({
    sessionId: "ses_xxx",
    mode: "inline",
    container: container,
  });
}
```

---

## Changelog

### 0.1.0-alpha.6 (Current)

- Initial alpha release
- Modal and inline display modes
- Light and dark themes
- TypeScript support
- React, Vue, Angular examples

---

## Support

- **Documentation**: [chaindoc.io/docs](https://chaindoc.io/docs)
- **GitHub Issues**: [github.com/ChaindocIO/embed-sdk](https://github.com/ChaindocIO/embed-sdk/)
- **Email**: contact@chaindoc.io
