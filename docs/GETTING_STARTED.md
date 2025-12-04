# Getting Started with Chaindoc Embed SDK

This guide will walk you through integrating Chaindoc's document signing into your web application in under 10 minutes.

---

## Prerequisites

Before you begin, ensure you have:

- [ ] A Chaindoc account with API access
- [ ] Your **Public Key** (`pk_live_...` or `pk_test_...`)
- [ ] Your **Secret Key** for backend integration (see [Server SDK](../../../chaindoc-websdk-server-sdk/docs/API_REFERENCE.md))
- [ ] Node.js 16+ (for npm installation)

---

## Step 1: Install the SDK

Choose your preferred package manager:

```bash
# npm
npm install @chaindoc_io/embed-sdk

# yarn
yarn add @chaindoc_io/embed-sdk

# pnpm
pnpm add @chaindoc_io/embed-sdk
```

---

## Step 2: Set Up Your Backend

The signing flow requires a **session** created by your backend. This ensures security - your secret key never touches the frontend.

### Backend Flow (Node.js example)

```typescript
// server/routes/signing.ts
import { ChaindocServerClient } from "@chaindoc_io/server-sdk";

const chaindoc = new ChaindocServerClient({
  secretKey: process.env.CHAINDOC_SECRET_KEY,
});

// Endpoint to create a signing session
app.post("/api/signing/create-session", async (req, res) => {
  const { documentId, signerEmail } = req.body;

  const session = await chaindoc.sessions.create({
    documentId,
    signerEmail,
    expiresIn: 3600, // 1 hour
  });

  // Return only the session ID to frontend
  res.json({ sessionId: session.id });
});
```

---

## Step 3: Initialize the SDK

In your frontend application:

```typescript
import { ChaindocEmbed } from "@chaindoc_io/embed-sdk";

// Initialize once (typically at app startup or component mount)
const chaindoc = new ChaindocEmbed({
  publicKey: "pk_live_xxxxxxxxxxxxx", // Your public key
});
```

> **Important:** Initialize the SDK once and reuse the instance. Don't create new instances for each signing flow.

---

## Step 4: Open the Signing Flow

When the user is ready to sign:

```typescript
async function handleSignDocument(documentId: string, signerEmail: string) {
  // 1. Get session from your backend
  const response = await fetch("/api/signing/create-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId, signerEmail }),
  });
  const { sessionId } = await response.json();

  // 2. Open the signing interface
  const instance = chaindoc.openSignatureFlow({
    sessionId,
    email: signerEmail, // Pre-fill email for OTP

    onReady: () => {
      console.log("Signing interface loaded");
    },

    onSuccess: (data) => {
      console.log("Document signed!", data.signatureId);
      instance.close();
      // Refresh your UI, show success message, etc.
    },

    onError: (error) => {
      console.error("Signing error:", error.code, error.message);
      // Handle specific errors
    },

    onCancel: () => {
      console.log("User cancelled");
      instance.close();
    },
  });
}
```

---

## Step 5: Handle the Result

After successful signing, you'll want to:

1. **Close the modal** - Call `instance.close()`
2. **Update your UI** - Refresh document status, show confirmation
3. **Verify on backend** (optional) - Fetch updated document status from your API

```typescript
onSuccess: async (data) => {
  // Close the signing interface
  instance.close();

  // Show success message
  toast.success("Document signed successfully!");

  // Refresh document list
  await fetchDocuments();

  // Navigate to signed document
  router.push(`/documents/${data.documentId}`);
};
```

---

## Complete Example

Here's a full working example:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Document Signing</title>
  </head>
  <body>
    <div id="app">
      <h1>Sign Your Contract</h1>
      <button id="sign-btn">Sign Document</button>
    </div>

    <script type="module">
      import { ChaindocEmbed } from "@chaindoc_io/embed-sdk";

      // Initialize SDK
      const chaindoc = new ChaindocEmbed({
        publicKey: "pk_test_xxxxxxxxxxxxx",
        environment: "staging", // Use 'production' for live
        debug: true, // Enable for development
      });

      // Handle sign button click
      document
        .getElementById("sign-btn")
        .addEventListener("click", async () => {
          // Get session from backend
          const res = await fetch("/api/signing/create-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentId: "doc_abc123",
              signerEmail: "user@example.com",
            }),
          });
          const { sessionId } = await res.json();

          // Open signing flow
          const instance = chaindoc.openSignatureFlow({
            sessionId,
            theme: "light",

            onSuccess: (data) => {
              alert(`Document signed! Signature ID: ${data.signatureId}`);
              instance.close();
            },

            onError: (error) => {
              alert(`Error: ${error.message}`);
            },

            onCancel: () => {
              instance.close();
            },
          });
        });
    </script>
  </body>
</html>
```

---

## Next Steps

Now that you have basic signing working:

- **[Framework Integration](./FRAMEWORK_GUIDES.md)** - React, Vue, Angular examples
- **[Advanced Usage](./ADVANCED_USAGE.md)** - Inline mode, theming, error handling
- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
- **[Server SDK](../../../chaindoc-websdk-server-sdk/docs/API_REFERENCE.md)** - Backend integration

---

## Common Issues

### "Invalid public key"

Ensure your public key:

- Starts with `pk_live_` (production) or `pk_test_` (sandbox)
- Is copied exactly without extra spaces
- Matches the environment you're using

### "Session not found"

The session may have:

- Expired (default: 1 hour)
- Already been used
- Been created for a different environment

### Modal doesn't appear

Check:

- Console for JavaScript errors
- That no other modal/overlay has higher z-index
- That the SDK is initialized before calling `openSignatureFlow`

### Events not firing

Ensure:

- Callbacks are passed in `openSignatureFlow()` options
- You're not blocking cross-origin communication
- The iframe URL matches the expected origin

---

## Environment Configuration

| Environment | Public Key Prefix | Use Case                          |
| ----------- | ----------------- | --------------------------------- |
| Production  | `pk_live_`        | Live transactions, real documents |
| Staging     | `pk_test_`        | Testing with test data            |
| Development | `pk_dev_`         | Local development                 |

```typescript
// Production
const chaindoc = new ChaindocEmbed({
  publicKey: "pk_live_xxxxx",
  environment: "production",
});

// Staging/Testing
const chaindoc = new ChaindocEmbed({
  publicKey: "pk_test_xxxxx",
  environment: "staging",
});

// Local Development
const chaindoc = new ChaindocEmbed({
  publicKey: "pk_dev_xxxxx",
  environment: "development",
});
```

---

## Support

- **Documentation**: [chaindoc.io/docs](https://chaindoc.io/docs)
- **GitHub Issues**: [github.com/ChaindocIO/embed-sdk](https://github.com/ChaindocIO/embed-sdk/)
- **Email**: contact@chaindoc.io
