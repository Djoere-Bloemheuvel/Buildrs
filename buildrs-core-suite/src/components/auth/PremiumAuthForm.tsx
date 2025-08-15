
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Loader2, Brain, Sparkles } from 'lucide-react'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { AuthLayout } from './AuthLayout'

export function PremiumAuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { signInWithEmail, signUpWithEmail } = useAuth()

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await signInWithEmail(email, password)

    if (error) {
      toast.error('Fout bij inloggen: ' + error.message)
    } else {
      toast.success('Succesvol ingelogd!')
    }

    setIsLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const { error } = await signUpWithEmail(email, password, fullName)

    if (error) {
      toast.error('Fout bij registreren: ' + error.message)
    } else {
      toast.success('Account aangemaakt! Controleer uw email voor verificatie.')
    }

    setIsLoading(false)
  }

  if (showForgotPassword) {
    return (
      <ForgotPasswordForm 
        onBack={() => setShowForgotPassword(false)} 
      />
    )
  }

  return (
    <AuthLayout>
      {/* Auth card wrapper with enhanced glow effect */}
      <div className="auth-card-wrapper w-full max-w-md">
        <Card className="auth-card deep-card w-full relative border-0 shadow-none bg-transparent">
          <CardContent className="p-8 relative">
            {/* Logo and header */}
            <div className="text-center mb-8">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl shadow-2xl relative"
                style={{ 
                  background: `linear-gradient(135deg, #0a1e4e 0%, #0f2e5f 40%, #2347a3 70%, #3a6ff2 100%)`,
                  boxShadow: `0 8px 30px rgba(58,111,242,0.25)`
                }}
              >
                <div 
                  className="absolute inset-0 rounded-2xl blur-sm" 
                  style={{ 
                    background: `linear-gradient(135deg, rgba(99,168,255,0.20) 0%, rgba(35,71,163,0.20) 100%)` 
                  }} 
                />
                <Brain className="w-8 h-8 text-white relative z-10" />
              </div>
              <h1 className="text-3xl font-bold mb-2 font-sf text-white">
                BUILDRS
              </h1>
              <p className="text-white/30 text-sm font-medium">
                AI die werkt. Welkom bij uw CRM platform.
              </p>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/[0.01] border border-white/[0.02] p-1 rounded-xl backdrop-blur-sm">
                <TabsTrigger 
                  value="signin" 
                  className="rounded-lg text-white/50 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 font-medium"
                  data-active-bg="gradient"
                >
                  Inloggen
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="rounded-lg text-white/50 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 font-medium"
                  data-active-bg="gradient"
                >
                  Registreren
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/60 font-medium">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="uw@email.com"
                      required
                      className="bg-white/[0.008] border border-white/[0.03] text-white placeholder:text-white/20 transition-all duration-200 h-12 rounded-xl backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/60 font-medium">Wachtwoord</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="bg-white/[0.008] border border-white/[0.03] text-white placeholder:text-white/20 transition-all duration-200 h-12 rounded-xl backdrop-blur-sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm font-medium transition-colors duration-200"
                      style={{ 
                        color: `rgba(58,111,242,0.60)` 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = `rgba(99,168,255,0.80)`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = `rgba(58,111,242,0.60)`
                      }}
                    >
                      Wachtwoord vergeten?
                    </button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.01] disabled:scale-100 disabled:opacity-50 border-0 relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, #0a1e4e 0%, #0f2e5f 40%, #2347a3 70%, #3a6ff2 100%)`,
                      boxShadow: `0 8px 25px rgba(58,111,242,0.25)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 12px 35px rgba(58,111,242,0.30)`
                      e.currentTarget.style.filter = 'brightness(1.1) saturate(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 8px 25px rgba(58,111,242,0.25)`
                      e.currentTarget.style.filter = 'none'
                    }}
                    disabled={isLoading}
                  >
                    <div 
                      className="absolute inset-0 blur-sm" 
                      style={{ 
                        background: `linear-gradient(135deg, rgba(99,168,255,0.20) 0%, rgba(35,71,163,0.20) 100%)` 
                      }} 
                    />
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" />}
                    <Sparkles className="mr-2 h-4 w-4 relative z-10" />
                    <span className="relative z-10">Inloggen</span>
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white/60 font-medium">Volledige naam</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Uw volledige naam"
                      required
                      className="bg-white/[0.008] border border-white/[0.03] text-white placeholder:text-white/20 transition-all duration-200 h-12 rounded-xl backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white/60 font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="uw@email.com"
                      required
                      className="bg-white/[0.008] border border-white/[0.03] text-white placeholder:text-white/20 transition-all duration-200 h-12 rounded-xl backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white/60 font-medium">Wachtwoord</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      className="bg-white/[0.008] border border-white/[0.03] text-white placeholder:text-white/20 transition-all duration-200 h-12 rounded-xl backdrop-blur-sm"
                    />
                  </div>
                  
                  <div className="text-center text-xs text-white/30 leading-relaxed">
                    Door een account aan te maken, ga je akkoord met onze{' '}
                    <span 
                      className="cursor-pointer transition-colors"
                      style={{ color: `rgba(58,111,242,0.50)` }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = `rgba(99,168,255,0.70)`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = `rgba(58,111,242,0.50)`
                      }}
                    >
                      Servicevoorwaarden
                    </span>
                    {' '}en{' '}
                    <span 
                      className="cursor-pointer transition-colors"
                      style={{ color: `rgba(58,111,242,0.50)` }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = `rgba(99,168,255,0.70)`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = `rgba(58,111,242,0.50)`
                      }}
                    >
                      Privacybeleid
                    </span>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.01] disabled:scale-100 disabled:opacity-50 border-0 relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, #0a1e4e 0%, #0f2e5f 40%, #2347a3 70%, #3a6ff2 100%)`,
                      boxShadow: `0 8px 25px rgba(58,111,242,0.25)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 12px 35px rgba(58,111,242,0.30)`
                      e.currentTarget.style.filter = 'brightness(1.1) saturate(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 8px 25px rgba(58,111,242,0.25)`
                      e.currentTarget.style.filter = 'none'
                    }}
                    disabled={isLoading}
                  >
                    <div 
                      className="absolute inset-0 blur-sm" 
                      style={{ 
                        background: `linear-gradient(135deg, rgba(99,168,255,0.20) 0%, rgba(35,71,163,0.20) 100%)` 
                      }} 
                    />
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" />}
                    <Sparkles className="mr-2 h-4 w-4 relative z-10" />
                    <span className="relative z-10">Account aanmaken</span>
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/[0.02] text-center">
              <p className="text-white/20 text-xs font-medium">
                Slim. Snel. <span style={{ color: `rgba(58,111,242,0.50)` }}>Onzichtbaar</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
