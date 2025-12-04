# Framework Integration Guides

Complete examples for integrating Chaindoc Embed SDK with popular JavaScript frameworks.

---

## Table of Contents

- [React](#react)
- [Next.js](#nextjs)
- [Vue 3](#vue-3)
- [Nuxt 3](#nuxt-3)
- [Angular](#angular)
- [Svelte](#svelte)
- [SvelteKit](#sveltekit)
- [Vanilla JavaScript](#vanilla-javascript)

---

## React

### Basic Hook

```tsx
// hooks/useChaindoc.ts
import { useRef, useEffect, useCallback } from "react";
import {
  ChaindocEmbed,
  EmbedInstance,
  SignatureFlowOptions,
} from "@chaindoc_io/embed-sdk";

export function useChaindoc(publicKey: string) {
  const sdkRef = useRef<ChaindocEmbed | null>(null);
  const instanceRef = useRef<EmbedInstance | null>(null);

  useEffect(() => {
    sdkRef.current = new ChaindocEmbed({ publicKey });

    return () => {
      sdkRef.current?.destroy();
    };
  }, [publicKey]);

  const openSignatureFlow = useCallback((options: SignatureFlowOptions) => {
    if (!sdkRef.current) {
      throw new Error("SDK not initialized");
    }

    // Close existing instance if any
    instanceRef.current?.close();

    instanceRef.current = sdkRef.current.openSignatureFlow(options);
    return instanceRef.current;
  }, []);

  const closeSignatureFlow = useCallback(() => {
    instanceRef.current?.close();
    instanceRef.current = null;
  }, []);

  return {
    openSignatureFlow,
    closeSignatureFlow,
    getInstance: () => instanceRef.current,
  };
}
```

### Component Example

```tsx
// components/SignDocumentButton.tsx
import { useState } from "react";
import { useChaindoc } from "../hooks/useChaindoc";

interface Props {
  documentId: string;
  signerEmail: string;
  onSigned?: (signatureId: string) => void;
}

export function SignDocumentButton({
  documentId,
  signerEmail,
  onSigned,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { openSignatureFlow, closeSignatureFlow } = useChaindoc(
    process.env.REACT_APP_CHAINDOC_PUBLIC_KEY!
  );

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create session via your backend
      const response = await fetch("/api/signing/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, signerEmail }),
      });

      if (!response.ok) {
        throw new Error("Failed to create signing session");
      }

      const { sessionId } = await response.json();

      // Open signing flow
      openSignatureFlow({
        sessionId,
        email: signerEmail,

        onReady: () => {
          setIsLoading(false);
        },

        onSuccess: (data) => {
          closeSignatureFlow();
          onSigned?.(data.signatureId);
        },

        onError: (err) => {
          setError(err.message);
          if (err.code === "SESSION_EXPIRED") {
            closeSignatureFlow();
          }
        },

        onCancel: () => {
          closeSignatureFlow();
        },
      });
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Loading..." : "Sign Document"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Inline Mode with React

```tsx
// components/InlineSignature.tsx
import { useEffect, useRef, useState } from "react";
import { ChaindocEmbed, EmbedInstance } from "@chaindoc_io/embed-sdk";

interface Props {
  sessionId: string;
  onSuccess?: (signatureId: string) => void;
  onError?: (error: string) => void;
}

export function InlineSignature({ sessionId, onSuccess, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<ChaindocEmbed | null>(null);
  const instanceRef = useRef<EmbedInstance | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    sdkRef.current = new ChaindocEmbed({
      publicKey: process.env.REACT_APP_CHAINDOC_PUBLIC_KEY!,
    });

    return () => {
      sdkRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!sdkRef.current || !containerRef.current || !sessionId) return;

    instanceRef.current = sdkRef.current.openSignatureFlow({
      sessionId,
      mode: "inline",
      container: containerRef.current,

      onReady: () => setIsReady(true),

      onSuccess: (data) => {
        onSuccess?.(data.signatureId);
      },

      onError: (err) => {
        onError?.(err.message);
      },
    });

    return () => {
      instanceRef.current?.close();
    };
  }, [sessionId, onSuccess, onError]);

  return (
    <div>
      {!isReady && <div className="loading">Loading signing interface...</div>}
      <div
        ref={containerRef}
        style={{
          minHeight: "500px",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
        }}
      />
    </div>
  );
}
```

---

## Next.js

### App Router (Next.js 13+)

```tsx
// app/sign/[documentId]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChaindocEmbed } from "@chaindoc_io/embed-sdk";

export default function SignPage({
  params,
}: {
  params: { documentId: string };
}) {
  const router = useRouter();
  const sdkRef = useRef<ChaindocEmbed | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "signed" | "error"
  >("loading");

  useEffect(() => {
    // Initialize SDK
    sdkRef.current = new ChaindocEmbed({
      publicKey: process.env.NEXT_PUBLIC_CHAINDOC_PUBLIC_KEY!,
    });

    // Create session and open flow
    async function initSigning() {
      try {
        const res = await fetch("/api/signing/create-session", {
          method: "POST",
          body: JSON.stringify({ documentId: params.documentId }),
        });
        const { sessionId } = await res.json();

        sdkRef.current!.openSignatureFlow({
          sessionId,

          onReady: () => setStatus("ready"),

          onSuccess: (data) => {
            setStatus("signed");
            // Redirect after success
            setTimeout(() => {
              router.push(`/documents/${params.documentId}?signed=true`);
            }, 2000);
          },

          onError: (error) => {
            setStatus("error");
            console.error(error);
          },

          onCancel: () => {
            router.back();
          },
        });
      } catch (error) {
        setStatus("error");
      }
    }

    initSigning();

    return () => {
      sdkRef.current?.destroy();
    };
  }, [params.documentId, router]);

  if (status === "signed") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-600">
            Document Signed!
          </h1>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <button onClick={() => router.back()}>Go Back</button>
        </div>
      </div>
    );
  }

  return null; // SDK handles the modal
}
```

### API Route (App Router)

```typescript
// app/api/signing/create-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ChaindocServerClient } from "@chaindoc_io/server-sdk";

const chaindoc = new ChaindocServerClient({
  secretKey: process.env.CHAINDOC_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { documentId, signerEmail } = await request.json();

    const session = await chaindoc.sessions.create({
      documentId,
      signerEmail,
      expiresIn: 3600,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
```

### Pages Router (Legacy)

```tsx
// pages/sign/[documentId].tsx
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ChaindocEmbed } from "@chaindoc_io/embed-sdk";

export default function SignPage() {
  const router = useRouter();
  const { documentId } = router.query;
  const sdkRef = useRef<ChaindocEmbed | null>(null);

  useEffect(() => {
    if (!documentId || typeof documentId !== "string") return;

    sdkRef.current = new ChaindocEmbed({
      publicKey: process.env.NEXT_PUBLIC_CHAINDOC_PUBLIC_KEY!,
    });

    // ... same logic as App Router

    return () => {
      sdkRef.current?.destroy();
    };
  }, [documentId]);

  return null;
}
```

---

## Vue 3

### Composable

```typescript
// composables/useChaindoc.ts
import { ref, onMounted, onUnmounted } from "vue";
import {
  ChaindocEmbed,
  EmbedInstance,
  SignatureFlowOptions,
} from "@chaindoc_io/embed-sdk";

export function useChaindoc(publicKey: string) {
  const sdk = ref<ChaindocEmbed | null>(null);
  const instance = ref<EmbedInstance | null>(null);
  const isReady = ref(false);

  onMounted(() => {
    sdk.value = new ChaindocEmbed({ publicKey });
  });

  onUnmounted(() => {
    sdk.value?.destroy();
  });

  function openSignatureFlow(options: SignatureFlowOptions) {
    if (!sdk.value) {
      throw new Error("SDK not initialized");
    }

    instance.value?.close();

    instance.value = sdk.value.openSignatureFlow({
      ...options,
      onReady: () => {
        isReady.value = true;
        options.onReady?.();
      },
    });

    return instance.value;
  }

  function closeSignatureFlow() {
    instance.value?.close();
    instance.value = null;
    isReady.value = false;
  }

  return {
    openSignatureFlow,
    closeSignatureFlow,
    isReady,
    getInstance: () => instance.value,
  };
}
```

### Component Example

```vue
<!-- components/SignDocumentButton.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useChaindoc } from "../composables/useChaindoc";

const props = defineProps<{
  documentId: string;
  signerEmail: string;
}>();

const emit = defineEmits<{
  signed: [signatureId: string];
  error: [message: string];
}>();

const isLoading = ref(false);
const error = ref<string | null>(null);

const { openSignatureFlow, closeSignatureFlow } = useChaindoc(
  import.meta.env.VITE_CHAINDOC_PUBLIC_KEY
);

async function handleSign() {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch("/api/signing/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: props.documentId,
        signerEmail: props.signerEmail,
      }),
    });

    const { sessionId } = await response.json();

    openSignatureFlow({
      sessionId,
      email: props.signerEmail,

      onReady() {
        isLoading.value = false;
      },

      onSuccess(data) {
        closeSignatureFlow();
        emit("signed", data.signatureId);
      },

      onError(err) {
        error.value = err.message;
        emit("error", err.message);
      },

      onCancel() {
        closeSignatureFlow();
      },
    });
  } catch (err) {
    isLoading.value = false;
    error.value = err instanceof Error ? err.message : "Unknown error";
  }
}
</script>

<template>
  <div>
    <button @click="handleSign" :disabled="isLoading">
      {{ isLoading ? "Loading..." : "Sign Document" }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
```

### Inline Mode with Vue

```vue
<!-- components/InlineSignature.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { ChaindocEmbed, EmbedInstance } from "@chaindoc_io/embed-sdk";

const props = defineProps<{
  sessionId: string;
}>();

const emit = defineEmits<{
  success: [signatureId: string];
  error: [message: string];
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const isReady = ref(false);

let sdk: ChaindocEmbed | null = null;
let instance: EmbedInstance | null = null;

onMounted(() => {
  sdk = new ChaindocEmbed({
    publicKey: import.meta.env.VITE_CHAINDOC_PUBLIC_KEY,
  });

  if (props.sessionId) {
    openFlow();
  }
});

onUnmounted(() => {
  sdk?.destroy();
});

watch(
  () => props.sessionId,
  (newSessionId) => {
    if (newSessionId) {
      instance?.close();
      openFlow();
    }
  }
);

function openFlow() {
  if (!sdk || !containerRef.value) return;

  instance = sdk.openSignatureFlow({
    sessionId: props.sessionId,
    mode: "inline",
    container: containerRef.value,

    onReady() {
      isReady.value = true;
    },

    onSuccess(data) {
      emit("success", data.signatureId);
    },

    onError(err) {
      emit("error", err.message);
    },
  });
}
</script>

<template>
  <div>
    <div v-if="!isReady" class="loading">Loading...</div>
    <div ref="containerRef" class="signature-container" />
  </div>
</template>

<style scoped>
.signature-container {
  min-height: 500px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
</style>
```

---

## Nuxt 3

### Plugin

```typescript
// plugins/chaindoc.client.ts
import { ChaindocEmbed } from "@chaindoc_io/embed-sdk";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const sdk = new ChaindocEmbed({
    publicKey: config.public.chaindocPublicKey,
  });

  return {
    provide: {
      chaindoc: sdk,
    },
  };
});
```

### Composable

```typescript
// composables/useSignDocument.ts
export function useSignDocument() {
  const { $chaindoc } = useNuxtApp();
  const isLoading = ref(false);

  async function signDocument(documentId: string, signerEmail: string) {
    isLoading.value = true;

    const { data } = await useFetch("/api/signing/create-session", {
      method: "POST",
      body: { documentId, signerEmail },
    });

    return new Promise((resolve, reject) => {
      const instance = $chaindoc.openSignatureFlow({
        sessionId: data.value!.sessionId,
        email: signerEmail,

        onReady() {
          isLoading.value = false;
        },

        onSuccess(data) {
          instance.close();
          resolve(data);
        },

        onError(error) {
          reject(error);
        },

        onCancel() {
          instance.close();
          reject(new Error("Cancelled"));
        },
      });
    });
  }

  return {
    signDocument,
    isLoading,
  };
}
```

---

## Angular

### Service

```typescript
// services/chaindoc.service.ts
import { Injectable, OnDestroy } from "@angular/core";
import {
  ChaindocEmbed,
  EmbedInstance,
  SignatureFlowOptions,
} from "@chaindoc_io/embed-sdk";
import { environment } from "../environments/environment";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ChaindocService implements OnDestroy {
  private sdk: ChaindocEmbed;
  private currentInstance: EmbedInstance | null = null;

  public success$ = new Subject<{ signatureId: string }>();
  public error$ = new Subject<{ code: string; message: string }>();
  public cancel$ = new Subject<void>();

  constructor() {
    this.sdk = new ChaindocEmbed({
      publicKey: environment.chaindocPublicKey,
    });
  }

  ngOnDestroy() {
    this.sdk.destroy();
  }

  openSignatureFlow(
    options: Omit<SignatureFlowOptions, "onSuccess" | "onError" | "onCancel">
  ) {
    this.currentInstance?.close();

    this.currentInstance = this.sdk.openSignatureFlow({
      ...options,

      onSuccess: (data) => {
        this.success$.next({ signatureId: data.signatureId });
      },

      onError: (error) => {
        this.error$.next({ code: error.code, message: error.message });
      },

      onCancel: () => {
        this.cancel$.next();
      },
    });

    return this.currentInstance;
  }

  closeSignatureFlow() {
    this.currentInstance?.close();
    this.currentInstance = null;
  }
}
```

### Component

```typescript
// components/sign-document/sign-document.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from "@angular/core";
import { ChaindocService } from "../../services/chaindoc.service";
import { HttpClient } from "@angular/common/http";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "app-sign-document",
  template: `
    <button (click)="openSigningFlow()" [disabled]="isLoading">
      {{ isLoading ? "Loading..." : "Sign Document" }}
    </button>
    <p *ngIf="error" class="error">{{ error }}</p>
  `,
})
export class SignDocumentComponent implements OnDestroy {
  @Input() documentId!: string;
  @Input() signerEmail!: string;
  @Output() signed = new EventEmitter<string>();

  isLoading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private chaindoc: ChaindocService, private http: HttpClient) {
    this.chaindoc.success$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.chaindoc.closeSignatureFlow();
      this.signed.emit(data.signatureId);
    });

    this.chaindoc.error$.pipe(takeUntil(this.destroy$)).subscribe((error) => {
      this.error = error.message;
    });

    this.chaindoc.cancel$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.chaindoc.closeSignatureFlow();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async openSigningFlow() {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await this.http
        .post<{ sessionId: string }>("/api/signing/create-session", {
          documentId: this.documentId,
          signerEmail: this.signerEmail,
        })
        .toPromise();

      this.chaindoc.openSignatureFlow({
        sessionId: response!.sessionId,
        email: this.signerEmail,
        onReady: () => {
          this.isLoading = false;
        },
      });
    } catch (err) {
      this.isLoading = false;
      this.error = "Failed to start signing flow";
    }
  }
}
```

---

## Svelte

### Store

```typescript
// stores/chaindoc.ts
import { writable } from "svelte/store";
import { ChaindocEmbed, EmbedInstance } from "@chaindoc_io/embed-sdk";

let sdk: ChaindocEmbed | null = null;
let currentInstance: EmbedInstance | null = null;

export const isReady = writable(false);
export const error = writable<string | null>(null);

export function initChaindoc(publicKey: string) {
  if (sdk) return;
  sdk = new ChaindocEmbed({ publicKey });
}

export function destroyChaindoc() {
  sdk?.destroy();
  sdk = null;
}

export function openSignatureFlow(
  sessionId: string,
  options: {
    email?: string;
    onSuccess?: (signatureId: string) => void;
  } = {}
) {
  if (!sdk) throw new Error("SDK not initialized");

  currentInstance?.close();
  isReady.set(false);
  error.set(null);

  currentInstance = sdk.openSignatureFlow({
    sessionId,
    email: options.email,

    onReady: () => {
      isReady.set(true);
    },

    onSuccess: (data) => {
      currentInstance?.close();
      options.onSuccess?.(data.signatureId);
    },

    onError: (err) => {
      error.set(err.message);
    },

    onCancel: () => {
      currentInstance?.close();
    },
  });
}

export function closeSignatureFlow() {
  currentInstance?.close();
  currentInstance = null;
}
```

### Component

```svelte
<!-- SignDocument.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    initChaindoc,
    destroyChaindoc,
    openSignatureFlow,
    isReady,
    error,
  } from '../stores/chaindoc';

  export let documentId: string;
  export let signerEmail: string;

  let isLoading = false;

  onMount(() => {
    initChaindoc(import.meta.env.VITE_CHAINDOC_PUBLIC_KEY);
  });

  onDestroy(() => {
    destroyChaindoc();
  });

  async function handleSign() {
    isLoading = true;

    try {
      const response = await fetch('/api/signing/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, signerEmail }),
      });

      const { sessionId } = await response.json();

      openSignatureFlow(sessionId, {
        email: signerEmail,
        onSuccess: (signatureId) => {
          // Handle success
          console.log('Signed:', signatureId);
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
</script>

<button on:click={handleSign} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Sign Document'}
</button>

{#if $error}
  <p class="error">{$error}</p>
{/if}
```

---

## SvelteKit

### Server Endpoint

```typescript
// src/routes/api/signing/create-session/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { ChaindocServerClient } from "@chaindoc_io/server-sdk";
import { CHAINDOC_SECRET_KEY } from "$env/static/private";

const chaindoc = new ChaindocServerClient({
  secretKey: CHAINDOC_SECRET_KEY,
});

export const POST: RequestHandler = async ({ request }) => {
  const { documentId, signerEmail } = await request.json();

  const session = await chaindoc.sessions.create({
    documentId,
    signerEmail,
    expiresIn: 3600,
  });

  return json({ sessionId: session.id });
};
```

### Page Component

```svelte
<!-- src/routes/sign/[documentId]/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { ChaindocEmbed } from '@chaindoc_io/embed-sdk';
  import { PUBLIC_CHAINDOC_PUBLIC_KEY } from '$env/static/public';

  let sdk: ChaindocEmbed | null = null;

  onMount(async () => {
    sdk = new ChaindocEmbed({
      publicKey: PUBLIC_CHAINDOC_PUBLIC_KEY,
    });

    const response = await fetch('/api/signing/create-session', {
      method: 'POST',
      body: JSON.stringify({ documentId: $page.params.documentId }),
    });
    const { sessionId } = await response.json();

    sdk.openSignatureFlow({
      sessionId,
      onSuccess: (data) => {
        goto(`/documents/${$page.params.documentId}?signed=true`);
      },
      onCancel: () => {
        goto('/documents');
      },
    });
  });

  onDestroy(() => {
    sdk?.destroy();
  });
</script>
```

---

## Vanilla JavaScript

### ES Modules

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Document Signing</title>
  </head>
  <body>
    <button id="sign-btn">Sign Document</button>

    <script type="module">
      import { ChaindocEmbed } from "@chaindoc_io/embed-sdk";

      const chaindoc = new ChaindocEmbed({
        publicKey: "pk_live_xxxxxxxxxxxxx",
      });

      document
        .getElementById("sign-btn")
        .addEventListener("click", async () => {
          const response = await fetch("/api/signing/create-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentId: "doc_123",
              signerEmail: "user@example.com",
            }),
          });
          const { sessionId } = await response.json();

          const instance = chaindoc.openSignatureFlow({
            sessionId,
            onSuccess: (data) => {
              alert("Document signed: " + data.signatureId);
              instance.close();
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

### UMD (CDN)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Document Signing</title>
    <script src="https://cdn.chaindoc.io/sdk/embed-sdk.umd.js"></script>
  </head>
  <body>
    <button id="sign-btn">Sign Document</button>

    <script>
      // SDK available as global ChaindocEmbed
      var chaindoc = new ChaindocEmbed.ChaindocEmbed({
        publicKey: "pk_live_xxxxxxxxxxxxx",
      });

      document.getElementById("sign-btn").onclick = function () {
        // ... same logic
      };
    </script>
  </body>
</html>
```

---

## Best Practices

### 1. Initialize Once

```typescript
// Good: Single instance
const chaindoc = new ChaindocEmbed({ publicKey });

// Bad: New instance each time
function handleSign() {
  const chaindoc = new ChaindocEmbed({ publicKey }); // Memory leak!
}
```

### 2. Always Clean Up

```typescript
// React
useEffect(() => {
  const sdk = new ChaindocEmbed({ publicKey });
  return () => sdk.destroy(); // Clean up!
}, []);

// Vue
onUnmounted(() => sdk?.destroy());

// Angular
ngOnDestroy() { this.sdk.destroy(); }
```

### 3. Handle All Events

```typescript
chaindoc.openSignatureFlow({
  sessionId,
  onSuccess: () => {
    /* Always handle */
  },
  onError: () => {
    /* Always handle */
  },
  onCancel: () => {
    /* Always handle */
  },
});
```

### 4. Close Instance After Use

```typescript
onSuccess: (data) => {
  instance.close(); // Always close after success
  handleSuccess(data);
},
```
