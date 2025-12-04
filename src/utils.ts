/**
 * Utility functions for Chaindoc Embed SDK
 */

import type { Environment } from "./types";

/**
 * Get the iframe base URL based on environment
 */
export function getIframeBaseUrl(
  environment: Environment,
  customBaseUrl?: string
): string {
  if (customBaseUrl) {
    return customBaseUrl;
  }

  switch (environment) {
    case "production":
      return "https://chaindoc-websdk-ui.vercel.app";
    case "staging":
      return "https://chaindoc-websdk-ui.vercel.app";
    case "development":
      return "https://chaindoc-websdk-ui.vercel.app";
    default:
      return "https://chaindoc-websdk-ui.vercel.app";
  }
}

/**
 * Get allowed origin for postMessage validation
 */
export function getAllowedOrigin(
  environment: Environment,
  customBaseUrl?: string
): string {
  const baseUrl = getIframeBaseUrl(environment, customBaseUrl);
  try {
    const url = new URL(baseUrl);
    return url.origin;
  } catch {
    return baseUrl;
  }
}

/**
 * Build iframe URL with query parameters
 */
export function buildIframeUrl(
  baseUrl: string,
  sessionId: string,
  email?: string,
  theme?: string
): string {
  // Session ID goes into the path, not as a query parameter
  const url = new URL(`/embed/sign/${sessionId}`, baseUrl);

  if (email) {
    url.searchParams.set("email", email);
  }

  if (theme) {
    url.searchParams.set("theme", theme);
  }

  return url.toString();
}

/**
 * Resolve container element from HTMLElement or selector string
 */
export function resolveContainer(container: HTMLElement | string): HTMLElement {
  if (typeof container === "string") {
    const element = document.querySelector<HTMLElement>(container);
    if (!element) {
      throw new Error(`Container element not found: ${container}`);
    }
    return element;
  }
  return container;
}

/**
 * Debug logger (only logs when debug mode is enabled)
 */
export class Logger {
  constructor(private debug: boolean) {}

  log(...args: unknown[]): void {
    if (this.debug) {
      console.log("[Chaindoc SDK]", ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.debug) {
      console.warn("[Chaindoc SDK]", ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.debug) {
      console.error("[Chaindoc SDK]", ...args);
    }
  }
}

/**
 * Type guard to check if a message is from Chaindoc iframe
 */
export function isChaindocMessage(
  message: unknown
): message is { source: "chaindoc-embed" } {
  return (
    typeof message === "object" &&
    message !== null &&
    "source" in message &&
    message.source === "chaindoc-embed"
  );
}
