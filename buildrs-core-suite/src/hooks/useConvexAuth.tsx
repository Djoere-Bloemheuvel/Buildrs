import { useUser } from "@clerk/clerk-react";

export function useConvexAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  
  // If Clerk is not loaded yet, return loading state
  if (!isLoaded) {
    return {
      user: null,
      clerkUser: null,
      isLoaded: false,
      isAuthenticated: false,
      signIn: async () => {},
      signOut: async () => {},
      getUserId: () => null,
      getEmail: () => null,
      getName: () => null,
    };
  }

  // If user is authenticated, return real data
  if (clerkUser) {
    const convexUser = {
      _id: clerkUser.id,
      name: clerkUser.fullName || clerkUser.firstName || 'User',
      email: clerkUser.primaryEmailAddress?.emailAddress || ''
    };

    return {
      user: convexUser,
      clerkUser,
      isLoaded: true,
      isAuthenticated: true,
      signIn: async () => {},
      signOut: async () => {},
      getUserId: () => convexUser._id,
      getEmail: () => convexUser.email,
      getName: () => convexUser.name,
    };
  }

  // If not authenticated, return null user
  return {
    user: null,
    clerkUser: null,
    isLoaded: true,
    isAuthenticated: false,
    signIn: async () => {},
    signOut: async () => {},
    getUserId: () => null,
    getEmail: () => null,
    getName: () => null,
  };
}