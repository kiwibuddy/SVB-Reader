import { useState, useEffect } from 'react';

interface LoadingStateConfig {
  initialDelay?: number;
  minLoadingTime?: number;
}

export const useLoadingState = (
  asyncFunction: () => Promise<any>,
  dependencies: any[] = [],
  config: LoadingStateConfig = {}
) => {
  const { initialDelay = 0, minLoadingTime = 300 } = config;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    const executeAsync = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Initial delay for better UX
        if (initialDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, initialDelay));
        }
        
        const startTime = Date.now();
        const result = await asyncFunction();
        
        // Ensure minimum loading time for smooth UX
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
        }
        
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          setIsLoading(false);
        }
      }
    };

    executeAsync();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { isLoading, error, data };
};

export const useDelayedLoading = (delay: number = 200) => {
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return showSkeleton;
};
