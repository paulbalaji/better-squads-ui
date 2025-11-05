import { toast } from "sonner";

import { type ErrorPattern, getErrorMessage } from "./error-handler";

export async function withLoadingState<T>(
  setLoading: (loading: boolean) => void,
  operation: () => Promise<T>
): Promise<T | undefined> {
  setLoading(true);
  try {
    return await operation();
  } finally {
    setLoading(false);
  }
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorPatterns?: ErrorPattern[]
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    console.error(error);
    const { message, duration } = getErrorMessage(error, errorPatterns);
    toast.error(message, { duration });
    return undefined;
  }
}

export async function withLoadingAndErrorHandling<T>(
  setLoading: (loading: boolean) => void,
  operation: () => Promise<T>,
  errorPatterns?: ErrorPattern[]
): Promise<T | undefined> {
  return withLoadingState(setLoading, () =>
    withErrorHandling(operation, errorPatterns)
  );
}
