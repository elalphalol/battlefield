// API Configuration
// This uses environment variable for production, falls back to localhost for development

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API endpoints
export const API_ENDPOINTS = {
  health: `${API_URL}/health`,
  users: `${API_URL}/api/users`,
  claims: `${API_URL}/api/claims`,
  claimsStatus: `${API_URL}/api/claims/status`,
  trades: `${API_URL}/api/trades`,
  leaderboard: `${API_URL}/api/leaderboard`,
  armyStats: `${API_URL}/api/army/stats`,
  config: `${API_URL}/api/config`,
};

// Helper function to build URL with parameters
export function buildUrl(endpoint: string, params?: Record<string, string | number>): string {
  if (!params) return endpoint;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  
  return `${endpoint}?${searchParams.toString()}`;
}

// Helper function for API calls
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP error! status: ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
