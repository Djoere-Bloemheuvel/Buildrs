import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { ReactNode } from 'react';
import { AuthForm } from './AuthForm';
import { AuthLayout } from './AuthLayout';

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
        <AuthLayout>
          <AuthForm />
        </AuthLayout>
      </SignedOut>
    </>
  );
}