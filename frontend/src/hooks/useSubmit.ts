import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

interface UseSubmitOptions<T> {
  onSuccess?: (data: T) => void | Promise<void>;
  successMessage?: string;
  errorMessage?: string | ((err: unknown) => string);
  loadingMessage?: string;
}

interface UseSubmitReturn<T> {
  submit: (fn: () => Promise<T>) => Promise<T | undefined>;
  isSubmitting: boolean;
  error: string | null;
}

export function useSubmit<T = any>(options: UseSubmitOptions<T> = {}): UseSubmitReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safety check to prevent setting state on unmounted component
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const submit = async (fn: () => Promise<T>): Promise<T | undefined> => {
    if (isMounted.current) {
      setError(null);
      setIsSubmitting(true);
    }

    try {
      const result = await toast.promise(
        fn(),
        {
          loading: options.loadingMessage || 'Processing...',
          success: options.successMessage || 'Success!',
          error: (err: unknown) => {
            if (typeof options.errorMessage === 'function') {
              return options.errorMessage(err);
            }
            const message = err instanceof Error ? err.message : 'An error occurred';
            return options.errorMessage || message;
          },
        }
      );

      if (options.onSuccess) {
        await options.onSuccess(result);
      }

      return result;
    } catch (err) {
      if (isMounted.current) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      return undefined;
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  return { submit, isSubmitting, error };
}
