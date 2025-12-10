/**
 * Type definitions for Chaindoc Embed SDK
 *
 * These types define the complete API surface and messaging protocol
 * for the SDK and iframe communication.
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Environment where the iframe is hosted
 */
export type Environment = "production" | "staging" | "development";

/**
 * Display mode for the signature flow
 */
export type DisplayMode = "modal" | "inline";

/**
 * Theme for the signature flow UI
 */
export type Theme = "light" | "dark";

/**
 * Supported language codes for UI localization
 */
export type Language =
  | "en"
  | "ru"
  | "uk"
  | "pl"
  | "de"
  | "es"
  | "pt"
  | "fr"
  | "et"
  | "kk"
  | "zh"
  | "hi"
  | "tr"
  | "vi";

/**
 * Main configuration for ChaindocEmbed instance
 */
export interface ChaindocEmbedConfig {
  /**
   * Public API key for authentication (starts with pk_)
   * @required
   */
  publicKey: string;

  /**
   * Environment to use for iframe URL
   * @default 'production'
   */
  environment?: Environment;

  /**
   * Enable debug logging to console
   * @default false
   */
  debug?: boolean;
}

/**
 * Options for opening a signature flow
 */
export interface SignatureFlowOptions {
  /**
   * Session ID from Chaindoc API (starts with ses_)
   * @required
   */
  sessionId: string;

  /**
   * Pre-fill email in OTP form (optional)
   */
  email?: string;

  /**
   * Display mode for the flow
   * @default 'modal'
   */
  mode?: DisplayMode;

  /**
   * Container element or selector for inline mode
   * Required when mode is 'inline'
   */
  container?: HTMLElement | string;

  /**
   * Theme for the UI
   * @default 'light'
   */
  theme?: Theme;

  /**
   * Language for the UI localization
   * @default 'en'
   */
  language?: Language;

  /**
   * Z-index for modal overlay
   * @default 999999
   */
  zIndex?: number;

  /**
   * Modal width in pixels (only for modal mode)
   * @default 800
   */
  modalWidth?: number;

  /**
   * Modal height in pixels (only for modal mode)
   * @default 600
   */
  modalHeight?: number;

  /**
   * Close modal when clicking outside (only for modal mode)
   * @default true
   */
  closeOnClickOutside?: boolean;

  /**
   * Close modal when pressing ESC key (only for modal mode)
   * @default true
   */
  closeOnEscape?: boolean;

  // Event callbacks
  /**
   * Called when iframe is ready
   */
  onReady?: () => void;

  /**
   * Called when document is successfully signed
   */
  onSuccess?: (data: SignatureSuccessData) => void;

  /**
   * Called when an error occurs
   */
  onError?: (error: SignatureErrorData) => void;

  /**
   * Called when user cancels the flow
   */
  onCancel?: () => void;

  /**
   * Called when iframe is closed
   */
  onClose?: () => void;

  /**
   * Called when user requests OTP resend
   */
  onResendOtp?: (data: ResendOtpData) => void;
}

// ============================================================================
// Event Data Types
// ============================================================================

/**
 * Data returned on successful signature
 */
export interface SignatureSuccessData {
  /**
   * Session ID that was signed
   */
  sessionId: string;

  /**
   * Document ID that was signed
   */
  documentId: string;

  /**
   * Signature ID
   */
  signatureId: string;

  /**
   * Timestamp of signature (ISO 8601)
   */
  signedAt: string;
}

/**
 * Data returned on error
 */
export interface SignatureErrorData {
  /**
   * Error code
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Additional error details
   */
  details?: Record<string, unknown>;
}

/**
 * Data sent when OTP is resent
 */
export interface ResendOtpData {
  /**
   * Email where OTP was sent
   */
  email: string;

  /**
   * Timestamp when OTP was sent (ISO 8601)
   */
  sentAt: string;
}

// ============================================================================
// PostMessage Protocol Types
// ============================================================================

/**
 * Messages sent FROM iframe TO SDK
 */
export type IframeToSdkMessage =
  | {
      source: "chaindoc-embed";
      type: "READY";
    }
  | {
      source: "chaindoc-embed";
      type: "RESIZE";
      data: {
        height: number;
      };
    }
  | {
      source: "chaindoc-embed";
      type: "SUCCESS";
      data: SignatureSuccessData;
    }
  | {
      source: "chaindoc-embed";
      type: "ERROR";
      data: SignatureErrorData;
    }
  | {
      source: "chaindoc-embed";
      type: "CANCEL";
    }
  | {
      source: "chaindoc-embed";
      type: "CLOSED";
    }
  | {
      source: "chaindoc-embed";
      type: "RESEND_OTP";
      data: ResendOtpData;
    };

/**
 * Messages sent FROM SDK TO iframe
 */
export type SdkToIframeMessage =
  | {
      source: "chaindoc-embed";
      type: "CLOSE";
    }
  | {
      source: "chaindoc-embed";
      type: "THEME_CHANGE";
      data: {
        theme: Theme;
      };
    };

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Internal state for EmbedInstance
 * @internal
 */
export interface InstanceState {
  sessionId: string;
  mode: DisplayMode;
  theme: Theme;
  isReady: boolean;
  isClosed: boolean;
}
