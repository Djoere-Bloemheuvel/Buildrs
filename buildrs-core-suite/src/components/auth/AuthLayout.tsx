
import { useEffect } from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  useEffect(() => {
    // Add auth-route class to body for CSS targeting
    document.body.classList.add('auth-route')
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('auth-route')
    }
  }, [])

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-gradient-to-br from-black via-zinc-950 to-black relative auth-ambient auth-vignette">
      {/* Enhanced ambient background effects using exact primary gradient colors - blue */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Primary ambient glow - top left - using #3a6ff2 (blue) */}
        <div 
          className="absolute top-20 left-20 w-[600px] h-[400px] rounded-full blur-3xl animate-pulse" 
          style={{ 
            background: `radial-gradient(circle, rgba(58,111,242,0.08) 0%, rgba(58,111,242,0.02) 60%, transparent 100%)` 
          }} 
        />
        {/* Secondary ambient glow - bottom right - using #2347a3 (royal blue) */}
        <div 
          className="absolute bottom-20 right-20 w-[500px] h-[350px] rounded-full blur-3xl animate-pulse" 
          style={{ 
            background: `radial-gradient(circle, rgba(35,71,163,0.06) 0%, rgba(35,71,163,0.015) 60%, transparent 100%)`,
            animationDelay: '2s' 
          }} 
        />
        {/* Central soft glow - using #0f2e5f (navy blue) */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-2xl" 
          style={{ 
            background: `radial-gradient(circle, rgba(15,46,95,0.04) 0%, rgba(15,46,95,0.01) 60%, transparent 100%)` 
          }} 
        />
        {/* Additional subtle accent glows using gradient stops - blue */}
        <div 
          className="absolute top-1/4 right-1/3 w-[300px] h-[200px] rounded-full blur-3xl animate-pulse" 
          style={{ 
            background: `radial-gradient(circle, rgba(99,168,255,0.05) 0%, transparent 70%)`,
            animationDelay: '4s' 
          }} 
        />
        <div 
          className="absolute bottom-1/3 left-1/4 w-[250px] h-[180px] rounded-full blur-3xl animate-pulse" 
          style={{ 
            background: `radial-gradient(circle, rgba(10,30,78,0.04) 0%, transparent 70%)`,
            animationDelay: '6s' 
          }} 
        />
      </div>

      {/* Minimal floating particles using primary gradient colors - blue */}
      <div 
        className="fixed top-20 left-20 w-1 h-1 rounded-full animate-pulse" 
        style={{ background: `rgba(58,111,242,0.10)` }} 
      />
      <div 
        className="fixed top-40 right-32 w-0.5 h-0.5 rounded-full animate-pulse" 
        style={{ 
          background: `rgba(35,71,163,0.08)`,
          animationDelay: '3s' 
        }} 
      />
      <div 
        className="fixed bottom-32 left-32 w-1.5 h-1.5 rounded-full animate-pulse" 
        style={{ 
          background: `rgba(15,46,95,0.12)`,
          animationDelay: '1.5s' 
        }} 
      />
      <div 
        className="fixed top-3/4 right-20 w-0.5 h-0.5 rounded-full animate-pulse" 
        style={{ 
          background: `rgba(99,168,255,0.10)`,
          animationDelay: '5s' 
        }} 
      />

      {/* Content container with proper centering and z-index */}
      <div className="relative z-10 min-h-screen flex items-center justify-center auth-safe-area px-4 py-8">
        {children}
      </div>
    </div>
  )
}
