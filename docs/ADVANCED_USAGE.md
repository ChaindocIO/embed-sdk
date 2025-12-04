# Advanced Usage Guide

This guide covers advanced configuration options, edge cases, and best practices for production deployments.

---

## Table of Contents

- [Display Modes](#display-modes)
- [Theming](#theming)
- [Error Handling Strategies](#error-handling-strategies)
- [Session Management](#session-management)
- [Multiple Signers Flow](#multiple-signers-flow)
- [Custom Styling](#custom-styling)
- [Performance Optimization](#performance-optimization)
- [Security Best Practices](#security-best-practices)
- [Testing](#testing)
- [Debugging](#debugging)

---

## Display Modes

### Modal Mode (Default)

Best for: Single action flows, confirmations, quick signing

```typescript
const instance = chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  mode: "modal",

  // Modal customization
  modalWidth: 800, // Width in pixels
  modalHeight: 600, // Height in pixels
  zIndex: 999999, // Stack order

  // Behavior
  closeOnClickOutside: true, // Click backdrop to close
  closeOnEscape: true, // ESC key closes modal
});
```

#### Modal Positioning

The modal is centered both horizontally and vertically. On mobile devices, it adapts to fill the screen with appropriate padding.

#### Scroll Locking

When the modal opens, body scrolling is automatically disabled. The original scroll position is restored when closed.

---

### Inline Mode

Best for: Embedded workflows, step-by-step processes, full-page signing experiences

```typescript
const instance = chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  mode: "inline",
  container: "#signing-container", // Required for inline mode
});
```

#### Container Requirements

```html
<!-- The container must exist before calling openSignatureFlow -->
<div id="signing-container" style="min-height: 500px;"></div>
```

| Requirement | Description                                            |
| ----------- | ------------------------------------------------------ |
| Must exist  | Container element must be in DOM before initialization |
| Min height  | Recommended: at least 400-500px minimum height         |
| Visible     | Container must not be `display: none`                  |

#### Auto-Resizing

The SDK automatically adjusts the iframe height based on content via `RESIZE` events from the iframe:

```typescript
// The iframe sends RESIZE messages when content changes
// SDK automatically handles this - no configuration needed
```

#### Container Selectors

```typescript
// CSS selector
container: "#my-container";
container: ".signing-area";
container: "[data-signing]";

// Direct element reference
container: document.getElementById("my-container");
container: containerRef.current; // React ref
```

---

## Theming

### Setting Theme on Initialization

```typescript
chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  theme: "dark", // 'light' | 'dark'
});
```

### Dynamic Theme Switching

Change theme after initialization:

```typescript
const instance = chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  theme: "light",
});

// Later - respond to user preference change
function handleThemeToggle(isDark: boolean) {
  instance.changeTheme(isDark ? "dark" : "light");
}
```

### System Preference Detection

```typescript
function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Initialize with system preference
chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  theme: getSystemTheme(),
});

// Listen for system changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    instance.changeTheme(e.matches ? "dark" : "light");
  });
```

---

## Error Handling Strategies

### Comprehensive Error Handler

```typescript
chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",

  onError: (error) => {
    // Log for debugging
    console.error("[Chaindoc Error]", error.code, error.message, error.details);

    switch (error.code) {
      // Session errors
      case "SESSION_EXPIRED":
      case "SESSION_NOT_FOUND":
        handleSessionError(error);
        break;

      // OTP errors
      case "OTP_INVALID":
      case "OTP_EXPIRED":
        handleOtpError(error);
        break;

      case "OTP_MAX_ATTEMPTS":
        handleMaxAttemptsError(error);
        break;

      // Document errors
      case "DOCUMENT_NOT_FOUND":
      case "ALREADY_SIGNED":
        handleDocumentError(error);
        break;

      // Signing errors
      case "SIGNATURE_FAILED":
        handleSignatureError(error);
        break;

      // Network errors
      case "NETWORK_ERROR":
        handleNetworkError(error);
        break;

      // Unknown
      default:
        handleUnknownError(error);
    }
  },
});

function handleSessionError(error) {
  instance.close();
  showNotification("error", "Session expired. Please try again.");
  // Optionally: auto-retry with new session
  // retryWithNewSession();
}

function handleOtpError(error) {
  // Don't close - let user retry
  showNotification("warning", "Invalid code. Please check and try again.");
}

function handleMaxAttemptsError(error) {
  instance.close();
  showNotification(
    "error",
    "Too many attempts. Please request a new signing link."
  );
}

function handleDocumentError(error) {
  instance.close();
  showNotification("error", error.message);
  refreshDocumentList();
}

function handleSignatureError(error) {
  showNotification("error", "Signing failed. Please try again.");
  // Allow retry within the same session
}

function handleNetworkError(error) {
  showNotification("warning", "Connection lost. Please check your internet.");
  // Don't close - connection might recover
}

function handleUnknownError(error) {
  instance.close();
  showNotification("error", "Something went wrong. Please try again.");
  // Report to error tracking
  Sentry.captureException(new Error(error.message), {
    extra: { code: error.code, details: error.details },
  });
}
```

### Retry Logic

```typescript
class SigningManager {
  private maxRetries = 3;
  private retryCount = 0;

  async startSigning(documentId: string) {
    this.retryCount = 0;
    await this.attemptSigning(documentId);
  }

  private async attemptSigning(documentId: string) {
    const sessionId = await this.createSession(documentId);

    chaindoc.openSignatureFlow({
      sessionId,

      onSuccess: (data) => {
        this.retryCount = 0; // Reset on success
        this.handleSuccess(data);
      },

      onError: (error) => {
        if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
          this.retryCount++;
          instance.close();
          setTimeout(() => this.attemptSigning(documentId), 1000);
        } else {
          this.handleFinalError(error);
        }
      },
    });
  }

  private shouldRetry(error: SignatureErrorData): boolean {
    const retryableCodes = [
      "SESSION_EXPIRED",
      "NETWORK_ERROR",
      "SIGNATURE_FAILED",
    ];
    return retryableCodes.includes(error.code);
  }
}
```

---

## Session Management

### Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Session Lifecycle                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Backend creates session                                     │
│         ↓                                                    │
│  Session ID sent to frontend                                 │
│         ↓                                                    │
│  SDK opens iframe with session                               │
│         ↓                                                    │
│  ┌─────────────────────────────────────────────┐            │
│  │ Session Active (default: 1 hour)            │            │
│  │   • User can verify OTP                     │            │
│  │   • User can view document                  │            │
│  │   • User can sign document                  │            │
│  └─────────────────────────────────────────────┘            │
│         ↓                                                    │
│  Session ends when:                                          │
│   • Document signed (SUCCESS)                                │
│   • Session expires (SESSION_EXPIRED error)                  │
│   • Max OTP attempts reached (OTP_MAX_ATTEMPTS error)        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Session Expiration Handling

```typescript
// Backend: Create session with custom expiration
const session = await chaindoc.sessions.create({
  documentId,
  signerEmail,
  expiresIn: 7200, // 2 hours
});

// Frontend: Handle expiration gracefully
chaindoc.openSignatureFlow({
  sessionId,

  onError: async (error) => {
    if (error.code === "SESSION_EXPIRED") {
      const confirmed = await showConfirmDialog(
        "Session Expired",
        "Your signing session has expired. Would you like to start again?"
      );

      if (confirmed) {
        instance.close();
        // Create new session and retry
        const newSession = await createSession(documentId);
        chaindoc.openSignatureFlow({ sessionId: newSession.id, ...options });
      }
    }
  },
});
```

### Pre-filling User Email

Speed up the flow by pre-filling the email:

```typescript
chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  email: "user@example.com", // Pre-fills OTP email field
});
```

---

## Multiple Signers Flow

### Sequential Signing

When multiple people need to sign the same document in order:

```typescript
// Backend tracks signing order
const signers = [
  { email: "signer1@example.com", order: 1, status: "pending" },
  { email: "signer2@example.com", order: 2, status: "waiting" },
  { email: "signer3@example.com", order: 3, status: "waiting" },
];

// Frontend: Only current signer can access
async function openSigningForCurrentSigner() {
  const currentSigner = await fetch("/api/documents/123/current-signer");

  if (currentSigner.email !== loggedInUserEmail) {
    showMessage("Waiting for previous signers to complete");
    return;
  }

  const session = await createSession(documentId, currentSigner.email);

  chaindoc.openSignatureFlow({
    sessionId: session.id,
    email: currentSigner.email,

    onSuccess: async (data) => {
      instance.close();
      // Backend updates status and notifies next signer
      await fetch("/api/documents/123/mark-signed", { method: "POST" });
      refreshDocumentStatus();
    },
  });
}
```

### Parallel Signing

When multiple people can sign independently:

```typescript
// Each signer gets their own session
// They can sign in any order
// Document is "complete" when all have signed

async function checkSigningStatus() {
  const status = await fetch("/api/documents/123/status");

  if (status.allSigned) {
    showMessage("Document fully executed!");
  } else {
    showMessage(
      `${status.signedCount}/${status.totalSigners} signatures collected`
    );
  }
}
```

---

## Custom Styling

### Z-Index Management

```typescript
// If your app has high z-index elements
chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  zIndex: 10000000, // Higher than your navbar/modals
});
```

### Container Styling (Inline Mode)

```css
/* Custom container styling */
.signing-container {
  min-height: 600px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .signing-container {
    min-height: 400px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
```

### Loading States

```typescript
const [isLoading, setIsLoading] = useState(true);

chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  mode: "inline",
  container: "#signing-container",

  onReady: () => {
    setIsLoading(false);
  },
});

// In JSX
{
  isLoading && <LoadingSpinner />;
}
<div id="signing-container" style={{ opacity: isLoading ? 0 : 1 }} />;
```

---

## Performance Optimization

### Lazy Loading

```typescript
// Don't initialize until needed
let chaindoc: ChaindocEmbed | null = null;

async function initSDKOnDemand() {
  if (!chaindoc) {
    const { ChaindocEmbed } = await import("@chaindoc_io/embed-sdk");
    chaindoc = new ChaindocEmbed({ publicKey });
  }
  return chaindoc;
}

async function handleSignClick() {
  const sdk = await initSDKOnDemand();
  sdk.openSignatureFlow({ sessionId });
}
```

### Preloading (for better UX)

```typescript
// Preload iframe in background when user is likely to sign
function preloadSigningInterface() {
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = "https://app.chaindoc.io";
  document.head.appendChild(link);
}

// Call on document list page load
useEffect(() => {
  if (hasUnsignedDocuments) {
    preloadSigningInterface();
  }
}, [hasUnsignedDocuments]);
```

### Memory Management

```typescript
// Always destroy SDK when component unmounts
useEffect(() => {
  const sdk = new ChaindocEmbed({ publicKey });

  return () => {
    sdk.destroy(); // Cleans up all instances and listeners
  };
}, []);

// Close instances when done
onSuccess: (data) => {
  instance.close(); // Removes iframe and listeners
  // ...
};
```

---

## Security Best Practices

### Public Key Storage

```typescript
// Good: Environment variables
const chaindoc = new ChaindocEmbed({
  publicKey: process.env.NEXT_PUBLIC_CHAINDOC_PUBLIC_KEY,
});

// Bad: Hardcoded in source
const chaindoc = new ChaindocEmbed({
  publicKey: "pk_live_abc123", // Don't do this!
});
```

### Session Validation

```typescript
// Backend: Always validate session ownership
app.post("/api/signing/create-session", async (req, res) => {
  const { documentId } = req.body;
  const userId = req.session.userId;

  // Verify user has access to document
  const document = await db.documents.findOne({
    id: documentId,
    // User must be owner or authorized signer
    $or: [{ ownerId: userId }, { "signers.email": req.session.userEmail }],
  });

  if (!document) {
    return res.status(403).json({ error: "Access denied" });
  }

  const session = await chaindoc.sessions.create({
    documentId,
    signerEmail: req.session.userEmail,
  });

  res.json({ sessionId: session.id });
});
```

### Content Security Policy

If your site uses CSP, add Chaindoc domains:

```
Content-Security-Policy:
  frame-src https://app.chaindoc.io https://app-staging.chaindoc.io;
  connect-src https://app.chaindoc.io https://app-staging.chaindoc.io;
```

---

## Testing

### Unit Testing

```typescript
// Mock the SDK for unit tests
jest.mock("@chaindoc_io/embed-sdk", () => ({
  ChaindocEmbed: jest.fn().mockImplementation(() => ({
    openSignatureFlow: jest.fn().mockReturnValue({
      close: jest.fn(),
      changeTheme: jest.fn(),
      isReady: () => true,
      getSessionId: () => "ses_test",
    }),
    destroy: jest.fn(),
  })),
}));

// Test component
describe("SignDocumentButton", () => {
  it("opens signature flow on click", async () => {
    render(<SignDocumentButton documentId="doc_123" />);

    await userEvent.click(screen.getByText("Sign Document"));

    expect(ChaindocEmbed).toHaveBeenCalledWith({
      publicKey: expect.stringMatching(/^pk_/),
    });
  });
});
```

### Integration Testing

```typescript
// Cypress E2E test
describe("Document Signing", () => {
  it("completes signing flow", () => {
    // Intercept session creation
    cy.intercept("POST", "/api/signing/create-session", {
      body: { sessionId: "ses_test123" },
    });

    cy.visit("/documents/123");
    cy.contains("Sign Document").click();

    // Verify iframe loaded
    cy.get('iframe[src*="chaindoc"]').should("be.visible");

    // Note: Can't interact with cross-origin iframe content
    // Test up to iframe presence, mock success callback for flow testing
  });
});
```

### Staging Environment Testing

```typescript
// Use staging for automated tests
const chaindoc = new ChaindocEmbed({
  publicKey: process.env.CHAINDOC_TEST_PUBLIC_KEY, // pk_test_...
  environment: "staging",
});
```

---

## Debugging

### Enable Debug Mode

```typescript
const chaindoc = new ChaindocEmbed({
  publicKey: "pk_xxx",
  debug: true, // Enables console logging
});
```

### Console Output

With debug mode enabled, you'll see:

```
[Chaindoc] SDK initialized with config: {...}
[Chaindoc] Opening signature flow with session: ses_xxx
[Chaindoc] Iframe created: https://app.chaindoc.io/embed/...
[Chaindoc] Received message: READY
[Chaindoc] Received message: RESIZE { height: 650 }
[Chaindoc] Received message: SUCCESS { signatureId: 'sig_xxx' }
[Chaindoc] Instance closed and cleaned up
```

### Common Issues

#### Iframe Not Loading

```typescript
// Check 1: Is session valid?
console.log("Session ID:", sessionId);

// Check 2: Is SDK initialized?
console.log("SDK version:", ChaindocEmbed.version);

// Check 3: Network tab - is iframe request failing?
// Look for requests to app.chaindoc.io/embed/...
```

#### Events Not Firing

```typescript
// Check 1: Are callbacks defined?
console.log("Callbacks:", { onSuccess, onError, onCancel });

// Check 2: Is CSP blocking postMessage?
// Console will show CSP violations

// Check 3: Is origin correct?
// Debug mode logs all received messages
```

#### Modal Behind Other Elements

```typescript
// Increase z-index
chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",
  zIndex: 99999999,
});

// Or check what's blocking it
document.querySelectorAll('[style*="z-index"]').forEach((el) => {
  console.log(el, getComputedStyle(el).zIndex);
});
```

### Error Reporting

```typescript
chaindoc.openSignatureFlow({
  sessionId: "ses_xxx",

  onError: (error) => {
    // Send to error tracking
    Sentry.captureMessage("Chaindoc signing error", {
      level: "error",
      tags: { errorCode: error.code },
      extra: {
        message: error.message,
        details: error.details,
        sessionId,
      },
    });
  },
});
```
