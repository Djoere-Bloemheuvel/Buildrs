import { useQuery } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export interface AuthenticatedClient {
  clientId: Id<"clients"> | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * SECURE: Get authenticated client context
 * Replaces hard-coded client IDs with proper authentication
 */
export function useAuthenticatedClient(): AuthenticatedClient {
  const { user, isLoaded: userLoaded } = useUser();
  
  // Get or create client for the authenticated user
  const clientData = useQuery(
    api.clients.getOrCreateUserClient,
    userLoaded && user ? { userId: user.id } : "skip"
  );

  if (!userLoaded) {
    return {
      clientId: null,
      userId: null,
      isLoading: true,
      error: null,
    };
  }

  if (!user) {
    return {
      clientId: null,
      userId: null,
      isLoading: false,
      error: 'User not authenticated',
    };
  }

  if (clientData === undefined) {
    return {
      clientId: null,
      userId: user.id,
      isLoading: true,
      error: null,
    };
  }

  if (!clientData) {
    return {
      clientId: null,
      userId: user.id,
      isLoading: false,
      error: 'Failed to get or create client',
    };
  }

  return {
    clientId: clientData._id,
    userId: user.id,
    isLoading: false,
    error: null,
  };
}

/**
 * Hook for components that require authentication
 */
export function useRequireAuth(): AuthenticatedClient {
  const auth = useAuthenticatedClient();
  
  if (!auth.isLoading && !auth.clientId) {
    throw new Error(auth.error || 'Authentication required');
  }
  
  return auth;
}