
import { useAuth } from '@/hooks/useAuth'
import { PremiumAuthForm } from './PremiumAuthForm'
import { AuthLayout } from './AuthLayout'
import { Loader2, Brain } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <AuthLayout>
        {/* Auth card wrapper with enhanced glow effect */}
        <div className="auth-card-wrapper">
          <div className="auth-card text-center space-y-6 p-8 bg-transparent">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/90 to-purple-600/90 shadow-2xl shadow-blue-500/25 animate-pulse relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-2xl blur-sm" />
              <Brain className="w-10 h-10 text-white relative z-10" />
            </div>
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400/60" />
              <h2 className="text-xl font-bold font-sf text-white">
                BUILDRS
              </h2>
              <p className="text-white/40">Laden...</p>
            </div>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (!user) {
    return <PremiumAuthForm />
  }

  return <>{children}</>
}
