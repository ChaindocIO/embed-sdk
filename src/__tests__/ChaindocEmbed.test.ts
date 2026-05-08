import { describe, expect, it } from "vitest";
import { ChaindocEmbed } from "../ChaindocEmbed";
import { getModalContainerStyles } from "../styles";
import { buildIframeUrl, getIframeBaseUrl } from "../utils";

describe("ChaindocEmbed", () => {
  it("requires a pk_ public key at initialization", () => {
    expect(() => new ChaindocEmbed({ publicKey: "" })).toThrow(
      "ChaindocEmbed: publicKey is required",
    );
    expect(() => new ChaindocEmbed({ publicKey: "sk_invalid" })).toThrow(
      'ChaindocEmbed: publicKey must start with "pk_"',
    );
  });

  it("builds iframe URLs from the session path and query params", () => {
    const url = buildIframeUrl(
      getIframeBaseUrl("development"),
      "ses_123",
      "signer@example.com",
      "modal",
      "dark",
      "en",
    );

    expect(url).toBe(
      "https://embed-demo.chaindoc.io/embed/sign/ses_123?email=signer%40example.com&mode=modal&theme=dark&lang=en",
    );
  });

  it("trims and lowercases the email query parameter", () => {
    const url = buildIframeUrl(
      getIframeBaseUrl("development"),
      "ses_456",
      "  Signer@Example.COM ",
    );

    expect(url).toBe(
      "https://embed-demo.chaindoc.io/embed/sign/ses_456?email=signer%40example.com",
    );
  });

  it("omits blank email query parameters after trimming", () => {
    const url = buildIframeUrl(getIframeBaseUrl("development"), "ses_789", "   ");

    expect(url).toBe("https://embed-demo.chaindoc.io/embed/sign/ses_789");
  });

  it("uses production-sized modal defaults when dimensions are omitted", () => {
    const styles = getModalContainerStyles();

    expect(styles).toContain("max-width: 450px;");
    expect(styles).toContain("height: 850px;");
  });

  it("keeps explicit modal dimensions when provided", () => {
    const styles = getModalContainerStyles(640, 720);

    expect(styles).toContain("max-width: 640px;");
    expect(styles).toContain("height: 720px;");
  });
});
