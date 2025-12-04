/**
 * @chaindoc/embed-sdk
 *
 * JavaScript/TypeScript SDK for embedding Chaindoc document signing flow via iframe.
 *
 * @packageDocumentation
 */

export { ChaindocEmbed } from "./ChaindocEmbed";
export { EmbedInstance } from "./EmbedInstance";
export type {
  ChaindocEmbedConfig,
  SignatureFlowOptions,
  Environment,
  DisplayMode,
  Theme,
  SignatureSuccessData,
  SignatureErrorData,
  ResendOtpData,
  IframeToSdkMessage,
  SdkToIframeMessage,
} from "./types";
