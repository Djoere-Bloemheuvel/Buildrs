import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function useConvexAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  const findOrCreateClient = useMutation(api.autoClientManager.findOrCreateClientForUser);
  const userClientInfo = useQuery(
    api.autoClientManager.getUserClientInfo,
    clerkUser ? { clerkUserId: clerkUser.id } : "skip"
  );
  
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

  // Automatically create/link client when user logs in
  useEffect(() => {
    console.log(`🔍 useConvexAuth debug - clerkUser: ${!!clerkUser}, isLoaded: ${isLoaded}, userClientInfo: ${!!userClientInfo}`);
    
    if (clerkUser) {
      console.log(`👤 Clerk user details:`, {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName || clerkUser.firstName
      });
    }
    
    if (userClientInfo) {
      console.log(`🏢 User client info:`, userClientInfo);
    }
    
    if (clerkUser && isLoaded && !userClientInfo) {
      const userEmail = clerkUser.primaryEmailAddress?.emailAddress;
      const userName = clerkUser.fullName || clerkUser.firstName;
      
      if (userEmail) {
        console.log(`🔄 Auto-creating/linking client for: ${userEmail}`);
        findOrCreateClient({
          userEmail,
          userName,
          clerkUserId: clerkUser.id,
        }).catch(error => {
          console.error("Failed to create/link client:", error);
        });
      }
    } else {
      console.log(`❌ Auto-creation skipped - clerkUser: ${!!clerkUser}, isLoaded: ${isLoaded}, userClientInfo: ${!!userClientInfo}`);
    }
  }, [clerkUser, isLoaded, userClientInfo, findOrCreateClient]);

  // If user is authenticated, return real data with client info
  if (clerkUser) {
    const convexUser = {
      _id: clerkUser.id,
      name: clerkUser.fullName || clerkUser.firstName || 'User',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      clientId: userClientInfo?.client?._id,
      client: userClientInfo?.client,
      role: userClientInfo?.userProfile?.role,
    };

    return {
      user: convexUser,
      clerkUser,
      isLoaded: true,
      isAuthenticated: true,
      userProfile: userClientInfo?.userProfile,
      client: userClientInfo?.client,
      isAdmin: userClientInfo?.isAdmin || false,
      signIn: async () => {},
      signOut: async () => {},
      getUserId: () => convexUser._id,
      getEmail: () => convexUser.email,
      getName: () => convexUser.name,
      getClientId: () => convexUser.clientId,
      getClient: () => convexUser.client,
      getRole: () => convexUser.role,
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