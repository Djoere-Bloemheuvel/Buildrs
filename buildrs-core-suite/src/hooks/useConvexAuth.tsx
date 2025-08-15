import { useAuthActions, useCurrentUser } from "@convex-dev/auth/react";
import { useUser } from "@clerk/clerk-react";

export function useConvexAuth() {
  // Mock for development while Clerk keys are not set
  const isClerkConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && 
                                  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY !== 'pk_test_your_clerk_key_here');

  if (!isClerkConfigured) {
    // Return mock data when Clerk is not configured
    const mockUser = {
      _id: 'mock-user-id',
      name: 'Test User',
      email: 'test@example.com'
    };

    return {
      user: mockUser,
      clerkUser: mockUser,
      isLoaded: true,
      isAuthenticated: true,
      signIn: async () => {},
      signOut: async () => {},
      getUserId: () => mockUser._id,
      getEmail: () => mockUser.email,
      getName: () => mockUser.name,
    };
  }

  // Real implementation when Clerk is configured
  const { signIn, signOut } = useAuthActions();
  const convexUser = useCurrentUser();
  const { user: clerkUser, isLoaded } = useUser();

  return {
    user: convexUser,
    clerkUser,
    isLoaded,
    isAuthenticated: !!convexUser,
    signIn,
    signOut,
    getUserId: () => convexUser?._id,
    getEmail: () => clerkUser?.primaryEmailAddress?.emailAddress || convexUser?.email,
    getName: () => clerkUser?.fullName || convexUser?.name,
  };
}