/**
 * Instance class for managing individual signature flows
 */

import type {
  SignatureFlowOptions,
  Theme,
  IframeToSdkMessage,
  SdkToIframeMessage,
  InstanceState,
  Environment,
} from './types';
import {
  getIframeBaseUrl,
  getAllowedOrigin,
  buildIframeUrl,
  resolveContainer,
  isChaindocMessage,
  Logger,
} from './utils';
import {
  getOverlayStyles,
  getModalContainerStyles,
  getIframeStyles,
  getInlineContainerStyles,
} from './styles';

/**
 * Internal config interface for EmbedInstance
 */
interface InternalConfig {
  publicKey: string;
  environment: Environment;
  baseUrl?: string;
  debug: boolean;
}

/**
 * Represents a single signature flow instance
 *
 * @example
 * ```typescript
 * const instance = sdk.openSignatureFlow({ sessionId: 'ses_xxx' });
 * instance.changeTheme('dark');
 * instance.close();
 * ```
 */
export class EmbedInstance {
  private config: InternalConfig;
  private options: SignatureFlowOptions;
  private logger: Logger;

  private state: InstanceState;
  private iframe: HTMLIFrameElement;
  private overlay: HTMLDivElement | null = null;
  private container: HTMLElement | null = null;

  private allowedOrigin: string;
  private messageListener: (event: MessageEvent) => void;
  private previousOverflow: string = '';

  private internalEventHandlers: Map<string, Set<Function>> = new Map();

  constructor(
    config: InternalConfig,
    options: SignatureFlowOptions,
    logger: Logger
  ) {
    this.config = config;
    this.logger = logger;

    // Store options
    this.options = options;

    // Initialize state
    this.state = {
      sessionId: this.options.sessionId,
      mode: this.options.mode || 'modal',
      theme: this.options.theme || 'light',
      isReady: false,
      isClosed: false,
    };

    // Calculate allowed origin
    const baseUrl = getIframeBaseUrl(this.config.environment, this.config.baseUrl);
    this.allowedOrigin = getAllowedOrigin(this.config.environment, this.config.baseUrl);

    // Build iframe URL
    const iframeUrl = buildIframeUrl(
      baseUrl,
      this.options.sessionId,
      this.options.email,
      this.options.theme
    );

    // Create iframe
    this.iframe = this.createIframe(iframeUrl);

    // Setup message listener
    this.messageListener = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageListener);

    // Render based on mode
    if (this.state.mode === 'modal') {
      this.renderModal();
    } else {
      this.renderInline();
    }

    this.logger.log('Instance created', { sessionId: this.state.sessionId, mode: this.state.mode });
  }

  /**
   * Create iframe element
   */
  private createIframe(url: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.setAttribute('style', getIframeStyles(this.state.mode));
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
    // Permissions for KYC verification (camera/microphone for liveness check, geolocation optional)
    iframe.setAttribute('allow', 'clipboard-write; camera; microphone; geolocation');
    return iframe;
  }

  /**
   * Render modal mode
   */
  private renderModal(): void {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.setAttribute('style', getOverlayStyles(this.options.zIndex ?? 999999));
    this.overlay.setAttribute('data-chaindoc-overlay', 'true');

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.setAttribute(
      'style',
      getModalContainerStyles(this.options.modalWidth, this.options.modalHeight)
    );
    modalContainer.appendChild(this.iframe);

    // Add container to overlay
    this.overlay.appendChild(modalContainer);

    // Click outside to cancel and close (configurable, default: true)
    if (this.options.closeOnClickOutside !== false) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.logger.log('Clicked outside modal - closing');
          this.options.onCancel?.();
          this.close();
        }
      });
    }

    // ESC key to cancel and close (configurable, default: true)
    if (this.options.closeOnEscape !== false) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          this.logger.log('ESC key pressed - closing');
          this.options.onCancel?.();
          this.close();
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Store cleanup
      this._internalOn('close', () => {
        document.removeEventListener('keydown', handleEscape);
      });
    }

    // Lock body scroll (preserve previous value for restoration)
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Append to body
    document.body.appendChild(this.overlay);
  }

  /**
   * Render inline mode
   */
  private renderInline(): void {
    if (!this.options.container) {
      throw new Error('Container is required for inline mode');
    }

    // Resolve container
    this.container = resolveContainer(this.options.container);

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.setAttribute('style', getInlineContainerStyles());
    wrapper.setAttribute('data-chaindoc-inline', 'true');
    wrapper.appendChild(this.iframe);

    // Inject into container
    this.container.appendChild(wrapper);
  }

  /**
   * Handle incoming postMessage events
   */
  private handleMessage(event: MessageEvent): void {
    // Validate origin and source (ensure message comes from our iframe, not another iframe with same origin)
    if (event.origin !== this.allowedOrigin || event.source !== this.iframe.contentWindow) {
      return;
    }

    // Validate message structure
    if (!isChaindocMessage(event.data)) {
      return;
    }

    const message = event.data as IframeToSdkMessage;
    this.logger.log('Received message:', message.type, message);

    // Handle message by type
    switch (message.type) {
      case 'READY':
        this.state.isReady = true;
        this.options.onReady?.();
        break;

      case 'RESIZE':
        if ('data' in message) {
          this.iframe.style.height = `${message.data.height}px`;
        }
        break;

      case 'SUCCESS':
        if ('data' in message) {
          this.options.onSuccess?.(message.data);
        }
        break;

      case 'ERROR':
        if ('data' in message) {
          this.options.onError?.(message.data);
        }
        break;

      case 'CANCEL':
        this.options.onCancel?.();
        break;

      case 'CLOSED':
        this.cleanup();
        break;

      case 'RESEND_OTP':
        if ('data' in message) {
          this.options.onResendOtp?.(message.data);
        }
        break;

      default:
        this.logger.warn('Unknown message type:', message);
    }
  }

  /**
   * Send message to iframe
   */
  private sendMessage(message: SdkToIframeMessage): void {
    if (!this.iframe.contentWindow) {
      this.logger.error('Cannot send message: iframe contentWindow not available');
      return;
    }

    this.iframe.contentWindow.postMessage(message, this.allowedOrigin);
    this.logger.log('Sent message to iframe:', message.type);
  }

  /**
   * Close the signature flow
   */
  close(): void {
    if (this.state.isClosed) {
      this.logger.warn('Instance already closed');
      return;
    }

    this.logger.log('Closing instance');

    // Send CLOSE message to iframe
    this.sendMessage({
      source: 'chaindoc-embed',
      type: 'CLOSE',
    });

    // Force cleanup after timeout if iframe doesn't respond
    setTimeout(() => {
      if (!this.state.isClosed) {
        this.logger.warn('Iframe did not respond to CLOSE, forcing cleanup');
        this.cleanup();
      }
    }, 3000);
  }

  /**
   * Change theme
   */
  changeTheme(theme: Theme): void {
    this.logger.log('Changing theme to:', theme);

    this.state.theme = theme;

    this.sendMessage({
      source: 'chaindoc-embed',
      type: 'THEME_CHANGE',
      data: { theme },
    });
  }

  /**
   * Check if iframe is ready
   */
  isReady(): boolean {
    return this.state.isReady;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.state.sessionId;
  }

  /**
   * Internal event system (for cleanup tracking)
   * @internal
   */
  _internalOn(event: string, handler: Function): void {
    if (!this.internalEventHandlers.has(event)) {
      this.internalEventHandlers.set(event, new Set());
    }
    this.internalEventHandlers.get(event)!.add(handler);
  }

  private emit(event: string): void {
    const handlers = this.internalEventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler());
    }
  }

  /**
   * Cleanup all resources
   */
  private cleanup(): void {
    if (this.state.isClosed) {
      return;
    }

    this.logger.log('Cleaning up instance');

    this.state.isClosed = true;

    // Remove message listener
    window.removeEventListener('message', this.messageListener);

    // Remove DOM elements
    if (this.overlay) {
      this.overlay.remove();
      document.body.style.overflow = this.previousOverflow;
    }

    if (this.container) {
      const wrapper = this.container.querySelector('[data-chaindoc-inline]');
      wrapper?.remove();
    }

    // Call onClose callback
    this.options.onClose?.();

    // Emit internal close event
    this.emit('close');

    // Clear internal handlers
    this.internalEventHandlers.clear();
  }
}
