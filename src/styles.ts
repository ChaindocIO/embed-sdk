/**
 * CSS-in-JS styles for modal and inline modes
 */

/**
 * Get styles for modal overlay
 */
export function getOverlayStyles(zIndex: number): string {
  return `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: ${zIndex};
    padding: 20px;
  `.trim();
}

/**
 * Get styles for modal container
 */
export function getModalContainerStyles(
  width?: number,
  height?: number
): string {
  const modalWidth = width ?? 400;
  const modalHeight = height ?? 600;

  return `
    position: relative;
    width: 100%;
    max-width: ${modalWidth}px;
    height: ${modalHeight}px;
    max-height: 90vh;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  `.trim();
}

/**
 * Get styles for iframe (common for both modal and inline)
 */
export function getIframeStyles(mode: "modal" | "inline"): string {
  const baseStyles = `
    width: 100%;
    border: none;
    display: block;
  `.trim();

  if (mode === "modal") {
    return `
      ${baseStyles}
      height: 100%;
      min-height: 400px;
    `.trim();
  }

  // Inline mode
  return `
    ${baseStyles}
    height: 0;
  `.trim();
}

/**
 * Get styles for inline container wrapper
 */
export function getInlineContainerStyles(): string {
  return `
    position: relative;
    width: 100%;
  `.trim();
}
