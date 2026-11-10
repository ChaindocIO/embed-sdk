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
  Language,
  SignatureSuccessData,
  SignatureErrorData,
  ResendOtpData,
  DeclinedData,
  SignatureResult,
  SignatureResultKind,
  SignatureKind,
  IframeToSdkMessage,
  SdkToIframeMessage,
} from "./types";
export {
  LEGACY_EMBED_ERROR_CODES,
  TYPED_EMBED_ERROR_CODES,
  isKnownEmbedErrorCode,
  isTypedEmbedErrorCode,
  getSigningFieldProblems,
} from "./errors";
export type {
  EmbedErrorCode,
  KnownEmbedErrorCode,
  LegacyEmbedErrorCode,
  TypedEmbedErrorCode,
  SigningFieldProblem,
} from "./errors";
