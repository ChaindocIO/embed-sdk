/**
 * Typed error codes of the embedded signing surface (added in 2.3.0).
 *
 * `SignatureErrorData.code` has always been a string. The codes below are the ones the embed reports for the
 * server's typed refusals (each is the backend's `errorKey`, verbatim). An unknown code still reaches `onError`
 * unchanged as a string: new server codes never break an integration.
 */

/** Codes the embed reported before 2.3.0. */
export const LEGACY_EMBED_ERROR_CODES = [
  "SESSION_EXPIRED",
  "SESSION_NOT_FOUND",
  "INVALID_OTP",
  "OTP_EXPIRED",
  "DOCUMENT_NOT_FOUND",
  "ALREADY_SIGNED",
  "NETWORK_ERROR",
  "UNAUTHORIZED",
  "RATE_LIMITED",
  "SIGNATURE_LIMIT_EXCEEDED",
  "SUBSCRIPTION_NOT_FOUND",
  "USER_NOT_FOUND",
  "EMAIL_MISMATCH",
  "SESSION_ALREADY_CONFIRMED",
  "NO_FILES_PROVIDED",
  "SERVER_ERROR",
  "UNKNOWN_ERROR",
] as const;

/** Typed refusals new in 2.3.0. */
export const TYPED_EMBED_ERROR_CODES = [
  "NOT_YOUR_TURN",
  "ACCOUNT_READ_ONLY",
  "KYC_WAITS_FOR_A_UNIT",
  "SIGNING_FIELDS_EMPTY",
  "SIGNING_METHOD_BELOW_REQUIREMENT",
  "INTEGRATIONS_NOT_IN_PLAN",
  "PAYMENT_PROVIDER_ERROR",
  "PAYMENT_PROVIDER_NOT_CONFIGURED",
  "EMBEDDED_PAYMENT_METHOD_NOT_REQUIRED",
  "EMBEDDED_PAYMENT_METHOD_ALREADY_LINKED",
  "EMBEDDED_SIGNING_REQUEST_CLOSED",
  "EMBEDDED_CONTRACT_NOT_SIGNABLE",
] as const;

export type LegacyEmbedErrorCode = (typeof LEGACY_EMBED_ERROR_CODES)[number];
export type TypedEmbedErrorCode = (typeof TYPED_EMBED_ERROR_CODES)[number];
export type KnownEmbedErrorCode = LegacyEmbedErrorCode | TypedEmbedErrorCode;

/**
 * Any error code. The known codes autocomplete; a code this SDK version does not know is still a `string`.
 */
export type EmbedErrorCode = KnownEmbedErrorCode | (string & Record<never, never>);

const KNOWN_CODES: readonly string[] = [
  ...LEGACY_EMBED_ERROR_CODES,
  ...TYPED_EMBED_ERROR_CODES,
];

/** True when `code` is one this SDK version knows by name. */
export function isKnownEmbedErrorCode(
  code: unknown,
): code is KnownEmbedErrorCode {
  return typeof code === "string" && KNOWN_CODES.includes(code);
}

/** True when `code` is one of the typed refusals added in 2.3.0. */
export function isTypedEmbedErrorCode(
  code: unknown,
): code is TypedEmbedErrorCode {
  return (
    typeof code === "string" &&
    (TYPED_EMBED_ERROR_CODES as readonly string[]).includes(code)
  );
}

/** One field a `SIGNING_FIELDS_EMPTY` refusal names. */
export interface SigningFieldProblem {
  /** Placement id of the field. */
  key: string;
  /** Field name for display (falls back to `key`). */
  name: string;
  /** `missing`: no value given; `invalid`: a value that does not fit the field. */
  problem: "missing" | "invalid";
}

/**
 * The fields a `SIGNING_FIELDS_EMPTY` error names, read from `error.details.fields`.
 * Returns `null` when the error is any other code. A malformed entry is dropped.
 */
export function getSigningFieldProblems(error: {
  code: string;
  details?: Record<string, unknown>;
}): SigningFieldProblem[] | null {
  if (error.code !== "SIGNING_FIELDS_EMPTY") return null;
  const raw = error.details?.fields;
  if (!Array.isArray(raw)) return [];

  const problems: SigningFieldProblem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { key, name, problem } = entry as Record<string, unknown>;
    if (typeof key !== "string" || key === "") continue;
    problems.push({
      key,
      name: typeof name === "string" && name !== "" ? name : key,
      problem: problem === "invalid" ? "invalid" : "missing",
    });
  }
  return problems;
}
