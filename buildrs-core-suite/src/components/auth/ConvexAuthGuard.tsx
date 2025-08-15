import { useConvexAuth } from '@/hooks/useConvexAuth';
import { SignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { ReactNode } from 'react';

interface ConvexAuthGuardProps {
  children: ReactNode;
}

export function ConvexAuthGuard({ children }: ConvexAuthGuardProps) {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Buildrs Core Suite</h1>
              <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
            </div>
            <SignIn 
              routing="hash"
              signUpUrl="#/sign-up"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-lg",
                }
              }}
            />
          </div>
        </div>
      </SignedOut>
    </>
  );
}