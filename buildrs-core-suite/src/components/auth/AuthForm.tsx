
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSignIn, useSignUp, SignIn, SignUp } from '@clerk/clerk-react'
import { toast } from 'sonner'
import { Loader2, Brain, Sparkles } from 'lucide-react'
import { PricingCard } from '@/components/stripe/PricingCard'

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [useClerkComponents, setUseClerkComponents] = useState(false)
  const { signIn, setActive } = useSignIn()
  const { signUp, setActive: setActiveSignUp } = useSignUp()

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn?.create({
        identifier: email,
        password,
      })

      if (result?.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        toast.success('Succesvol ingelogd!')
      }
    } catch (error: any) {
      toast.error('Fout bij inloggen: ' + (error.errors?.[0]?.message || error.message))
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

    try {
      const result = await signUp?.create({
        emailAddress: email,
        password,
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' ') || '',
      })

      if (result?.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId })
        toast.success('Account aangemaakt!')
      } else {
        // Handle email verification
        toast.success('Account aangemaakt! Controleer uw email voor verificatie.')
      }
    } catch (error: any) {
      toast.error('Fout bij registreren: ' + (error.errors?.[0]?.message || error.message))
    }

    setIsLoading(false)
  }

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true)
    
    try {
      // Try signIn first for existing users
      if (signIn) {
        await signIn.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: `${window.location.origin}/`,
          redirectUrlComplete: `${window.location.origin}/`
        })
      } else if (signUp) {
        // Fallback to signUp for new users
        await signUp.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: `${window.location.origin}/`,
          redirectUrlComplete: `${window.location.origin}/`
        })
      }
    } catch (error: any) {
      console.error('Google auth error:', error)
      
      // If signIn fails because user doesn't exist, try signUp
      if (error.errors && error.errors.some((e: any) => e.code === 'form_identifier_not_found')) {
        try {
          if (signUp) {
            await signUp.authenticateWithRedirect({
              strategy: 'oauth_google',
              redirectUrl: `${window.location.origin}/`,
              redirectUrlComplete: `${window.location.origin}/`
            })
            return
          }
        } catch (signUpError: any) {
          console.error('Google signUp also failed:', signUpError)
        }
      }
      
      if (error.errors && error.errors.length > 0) {
        const errorCode = error.errors[0].code
        const errorMessage = error.errors[0].message
        
        if (errorCode === 'oauth_provider_not_enabled') {
          toast.error('Google OAuth moet eerst ingeschakeld worden in Clerk dashboard.')
        } else if (errorCode === 'oauth_access_denied') {
          toast.error('Google authenticatie geweigerd.')
        } else {
          toast.error(`Google authenticatie fout: ${errorMessage}`)
        }
      } else {
        toast.error('Google authenticatie mislukt. Probeer het opnieuw.')
      }
      
      setIsGoogleLoading(false)
    }
  }

  const handleForgotPasswordClick = () => {
    setShowForgotPassword(true)
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!signIn) return

    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      toast.success('Wachtwoord reset link verzonden naar uw email')
      setShowForgotPassword(false)
    } catch (error: any) {
      toast.error('Fout bij verzenden reset link: ' + (error.errors?.[0]?.message || error.message))
    }

    setIsLoading(false)
  }

  if (showForgotPassword) {
    return (
      <div className="auth-card-wrapper w-full max-w-5xl">
        <Card className="auth-card deep-card w-full relative border-0 shadow-none bg-transparent">
          <CardContent className="p-4 relative">
            {/* Logo and header */}
            <div className="text-center mb-4">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 mb-2 rounded-2xl shadow-2xl relative"
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
              <h1 className="text-3xl font-bold mb-1 font-sf text-white">
                WACHTWOORD VERGETEN
              </h1>
              <p className="text-white/30 text-sm font-medium">
                Vul uw email adres in om een reset link te ontvangen
              </p>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-white/60 font-medium">Email</Label>
                <Input
                  id="forgot-email"
                  name="email"
                  type="email"
                  placeholder="uw@email.com"
                  required
                  className="bg-white/[0.008] border border-white/[0.03] text-white placeholder:text-white/20 transition-all duration-200 h-12 rounded-xl backdrop-blur-sm"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 h-12 text-white font-medium rounded-xl transition-all duration-200 bg-white/[0.008] border border-white/[0.03] hover:bg-white/[0.02]"
                >
                  Terug
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.01] disabled:scale-100 disabled:opacity-50 border-0 relative overflow-hidden"
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
                  <span className="relative z-10">Reset Verzenden</span>
                </Button>
              </div>
            </form>

          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="auth-card-wrapper w-full max-w-5xl">
      <Card className="auth-card deep-card w-full relative border-0 shadow-none bg-transparent">
        <CardContent className="p-4 relative">
          {/* Logo and header */}
          <div className="text-center mb-4">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 mb-2 rounded-2xl shadow-2xl relative"
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
            <h1 className="text-3xl font-bold mb-1 font-sf text-white">
              BUILDRS
            </h1>
            <p className="text-white/30 text-sm font-medium">
              AI die werkt. Welkom bij uw CRM platform.
            </p>
          </div>

          {/* Google Auth Button */}
          <Button
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading}
            className="w-full h-10 mb-3 bg-white/[0.008] border border-white/[0.03] text-white hover:bg-white/[0.02] transition-all duration-200 rounded-xl backdrop-blur-sm"
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Doorgaan met Google
          </Button>

          {/* Divider */}
          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.02]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white/40">of</span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-3 bg-white/[0.01] border border-white/[0.02] p-1 rounded-xl backdrop-blur-sm">
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
              <TabsTrigger 
                value="pricing"
                className="rounded-lg text-white/50 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 font-medium"
                data-active-bg="gradient"
              >
                Plannen
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
                    onClick={handleForgotPasswordClick}
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
            
            <TabsContent value="pricing" className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Kies uw plan</h3>
                <p className="text-white/60 text-sm">Start uw reis naar betere lead generatie</p>
              </div>
              
              <div className="overflow-x-auto">
                <PricingCard onSelectPlan={(plan) => {
                  toast.success(`${plan.name} plan geselecteerd! Registreer eerst om door te gaan.`)
                }} />
              </div>
            </TabsContent>
          </Tabs>

        </CardContent>
      </Card>
    </div>
  )
}
