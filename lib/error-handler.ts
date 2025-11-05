export interface ErrorPattern {
  keywords: string[];
  message: string;
  duration?: number;
}

export const RPC_ERROR_PATTERNS: ErrorPattern[] = [
  {
    keywords: ["RPC rate limit", "403", "429"],
    message:
      "RPC rate limit exceeded. Try using a custom RPC provider (configure in Chain Management).",
    duration: 5000,
  },
  {
    keywords: ["Squads V3"],
    message:
      "This appears to be a Squads V3 multisig. This app only supports Squads V4.",
    duration: 5000,
  },
  {
    keywords: ["not a multisig", "wrong network"],
    message:
      "This address is not a valid multisig. Check the address and ensure you're on the correct network (Mainnet/Devnet).",
    duration: 6000,
  },
  {
    keywords: ["not owned by", "Invalid multisig"],
    message:
      "Invalid multisig account. Please verify the address is a Squads V4 multisig.",
    duration: 5000,
  },
  {
    keywords: ["Account not found", "not found"],
    message:
      "Account not found. Please check the address and make sure you selected the correct network.",
    duration: 5000,
  },
];

export function matchErrorPattern(
  error: unknown,
  patterns: ErrorPattern[]
): ErrorPattern | null {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  for (const pattern of patterns) {
    if (
      pattern.keywords.some((keyword) =>
        lowerMessage.includes(keyword.toLowerCase())
      )
    ) {
      return pattern;
    }
  }

  return null;
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

export function getErrorMessage(
  error: unknown,
  patterns: ErrorPattern[] = RPC_ERROR_PATTERNS
): { message: string; duration?: number } {
  const pattern = matchErrorPattern(error, patterns);
  if (pattern) {
    return { message: pattern.message, duration: pattern.duration };
  }
  return { message: formatError(error), duration: 5000 };
}
