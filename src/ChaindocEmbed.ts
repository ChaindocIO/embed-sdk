/**
 * Main SDK class for Chaindoc Embed
 */

import { EmbedInstance } from "./EmbedInstance";
import type { ChaindocEmbedConfig, SignatureFlowOptions } from "./types";
import { Logger } from "./utils";

declare const __SDK_VERSION__: string;

/**
 * Main entry point for Chaindoc Embed SDK
 *
 * @example
 * ```typescript
 * const sdk = new ChaindocEmbed({
 *   publicKey: 'pk_test_xxx',
 *   environment: 'development',
 *   debug: true
 * });
 *
 * const instance = sdk.openSignatureFlow({
 *   sessionId: 'ses_xxx',
 *   onSuccess: (data) => console.log('Signed!', data)
 * });
 * ```
 */
/**
 * Internal config type with defaults applied
 */
interface InternalConfig {
  publicKey: string;
  environment: "production" | "staging" | "development";
  baseUrl?: string;
  debug: boolean;
}

export class ChaindocEmbed {
  private config: InternalConfig;
  private logger: Logger;
  private instances: Set<EmbedInstance> = new Set();

  /**
   * Create a new ChaindocEmbed instance
   *
   * @param config - SDK configuration
   * @throws {Error} If publicKey is missing or invalid
   */
  constructor(config: ChaindocEmbedConfig) {
    // Validate required config
    if (!config.publicKey) {
      throw new Error("ChaindocEmbed: publicKey is required");
    }

    if (!config.publicKey.startsWith("pk_")) {
      throw new Error('ChaindocEmbed: publicKey must start with "pk_"');
    }

    // Set defaults
    const internalConfig: InternalConfig = {
      publicKey: config.publicKey,
      environment: config.environment || "production",
      debug: config.debug || false,
    };

    // Only set baseUrl if provided
    if (config.baseUrl) {
      internalConfig.baseUrl = config.baseUrl;
    }

    this.config = internalConfig;

    this.logger = new Logger(this.config.debug);
    this.logger.log("SDK initialized", this.config);
  }

  /**
   * Open a signature flow
   *
   * @param options - Signature flow options
   * @returns EmbedInstance for controlling the flow
   * @throws {Error} If sessionId is missing or invalid
   * @throws {Error} If inline mode is used without container
   */
  openSignatureFlow(options: SignatureFlowOptions): EmbedInstance {
    // Validate required options
    if (!options.sessionId) {
      throw new Error("openSignatureFlow: sessionId is required");
    }

    if (!options.sessionId.startsWith("ses_")) {
      throw new Error('openSignatureFlow: sessionId must start with "ses_"');
    }

    const mode = options.mode || "modal";

    if (mode === "inline" && !options.container) {
      throw new Error(
        "openSignatureFlow: container is required for inline mode"
      );
    }

    this.logger.log("Opening signature flow", options);

    // Create instance
    const instance = new EmbedInstance(this.config, options, this.logger);

    // Track instance
    this.instances.add(instance);

    // Remove from tracking when closed
    instance._internalOn("close", () => {
      this.instances.delete(instance);
    });

    return instance;
  }

  /**
   * Destroy all instances and cleanup
   */
  destroy(): void {
    this.logger.log("Destroying SDK and all instances");

    for (const instance of this.instances) {
      instance.close();
    }

    this.instances.clear();
  }

  /**
   * Get SDK version
   */
  static get version(): string {
    return __SDK_VERSION__;
  }
}
