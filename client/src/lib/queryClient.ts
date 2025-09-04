import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export const apiRequest = async (method: string, url: string, data?: any) => {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config).catch((networkError) => {
      console.error(`Network error for ${method} ${url}:`, networkError);
      throw new Error("Network connection failed. Please check your internet connection.");
    });

    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        errorMessage = `Server error (${response.status})`;
      }
      throw new Error(errorMessage);
    }

    return response;
  } catch (error: any) {
    console.error(`API request error for ${method} ${url}:`, error);
    throw error;
  }
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};

    // Add auth token if available
    const authToken = localStorage.getItem('bitvault_auth_token');
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(queryKey[0] as string, {
      credentials: "include", // Ensure cookies are sent with every request
      mode: "cors", // Enable CORS with credentials
      headers,
    }).catch((networkError) => {
      console.error(`Network error for GET ${queryKey[0]}:`, networkError);
      throw new Error("Network connection failed. Please check your internet connection.");
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 401 errors or network errors
        if (error?.message?.includes('401') || error?.message?.includes('Network')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    mutations: {
      retry: false,
      onError: (error) => {
        // Silently handle errors for mutations to prevent unhandled rejections
        console.warn('Mutation error:', error);
      },
    },
  },
});