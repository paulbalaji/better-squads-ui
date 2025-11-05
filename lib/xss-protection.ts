/**
 * XSS Protection Utilities
 *
 * This file provides utilities to prevent XSS attacks.
 * Note: React automatically escapes values in JSX, providing baseline XSS protection.
 * These utilities provide additional layers of defense.
 */

/**
 * Removes all HTML tags from a string
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Escapes HTML special characters
 * React does this automatically, but useful for edge cases
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitizes text by removing control characters and normalizing whitespace
 */
export function sanitizeText(text: string): string {
  return (
    text
      // Remove control characters (except newlines, tabs, carriage returns)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Validates that a URL is safe (no javascript: or data: protocols)
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const safeProtocols = ["https:", "http:", "wss:", "ws:"];
    return safeProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL, returning empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  return isSafeUrl(url) ? url : "";
}

/**
 * Content Security Policy violation reporter
 * Call this in a useEffect to log CSP violations
 */
export function setupCSPViolationReporter(): void {
  if (typeof window === "undefined") return;

  document.addEventListener("securitypolicyviolation", (e) => {
    console.error("CSP Violation:", {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy,
    });

    // In production, you might want to report this to an error tracking service
    // But be careful not to include sensitive data
  });
}

/**
 * Validates that an object doesn't contain dangerous patterns
 * Useful for validating data before storing in localStorage
 */
export function validateObject(obj: unknown): boolean {
  const json = JSON.stringify(obj);

  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers like onclick=
    /eval\(/i,
    /expression\(/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(json));
}

/**
 * HOC to sanitize all string props of a component
 * Useful for components that might render user-generated content
 */
export function sanitizeProps<T extends Record<string, any>>(props: T): T {
  const sanitized = { ...props };

  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeText(sanitized[key]) as T[Extract<
        keyof T,
        string
      >];
    }
  }

  return sanitized;
}

/**
 * Rate limiting to prevent automated XSS probing
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(
  identifier: string,
  maxRequests = 50,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

/**
 * Clean up old rate limit records periodically
 */
export function cleanupRateLimitRecords(): void {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(key);
    }
  }
}
