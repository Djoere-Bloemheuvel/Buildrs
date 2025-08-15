
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { AuthLayout } from './AuthLayout'

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast.error('Fout: ' + error.message)
      } else {
        setIsEmailSent(true)
        toast.success('Wachtwoord reset email verstuurd!')
      }
    } catch (error) {
      toast.error('Er is een onverwachte fout opgetreden')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Auth card wrapper with enhanced glow effect */}
      <div className="auth-card-wrapper max-w-md">
        <Card className="auth-card relative border-0 shadow-none bg-transparent">
          <CardContent className="p-8 relative">
            {/* Back button */}
            <button
              onClick={onBack}
              className="flex items-center text-white/40 hover:text-white/70 mb-6 transition-colors duration-200 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar inloggen
            </button>

            {/* Logo and header */}
            <div className="text-center mb-8">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl shadow-2xl relative"
                style={{ 
                  background: `linear-gradient(135deg, #1e0a4e 0%, #2e0f5f 40%, #4723a3 70%, #6f3af2 100%)`,
                  boxShadow: `0 8px 30px rgba(111,58,242,0.25)`
                }}
              >
                <div 
                  className="absolute inset-0 rounded-2xl blur-sm" 
                  style={{ 
                    background: `linear-gradient(135deg, rgba(140,99,255,0.20) 0%, rgba(71,35,163,0.20) 100%)` 
                  }} 
                />
                {isEmailSent ? (
                  <CheckCircle className="w-8 h-8 text-white relative z-10" />
                ) : (
                  <Mail className="w-8 h-8 text-white relative z-10" />
                )}
              </div>
              
              {isEmailSent ? (
                <>
                  <h1 className="text-2xl font-bold text-white mb-2 font-sf">
                    Email verzonden!
                  </h1>
                  <p className="text-white/40 text-sm leading-relaxed">
                    We hebben een wachtwoord reset link gestuurd naar{' '}
                    <span 
                      className="transition-colors"
                      style={{ color: `rgba(111,58,242,0.60)` }}
                    >
                      {email}
                    </span>
                    <br />
                    Controleer uw inbox en volg de instructies.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-white mb-2 font-sf">
                    Wachtwoord vergeten?
                  </h1>
                  <p className="text-white/40 text-sm">
                    Geen zorgen. Voer uw email in en we sturen u een link om uw wachtwoord te herstellen.
                  </p>
                </>
              )}
            </div>

            {isEmailSent ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-500/5 border border-green-500/10 rounded-xl backdrop-blur-sm">
                  <p className="text-green-400/70 text-sm">
                    Controleer ook uw spam folder als u de email niet ziet.
                  </p>
                </div>

                <Button 
                  onClick={onBack}
                  className="w-full h-12 bg-white/[0.02] hover:bg-white/[0.04] text-white/70 border border-white/[0.05] font-medium rounded-xl transition-all duration-200 backdrop-blur-sm"
                >
                  Terug naar inloggen
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-white/60 font-medium">
                    Email adres
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="uw@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/[0.008] border border-white/[0.03] text-white placeholder:text-white/20 transition-all duration-200 h-12 rounded-xl backdrop-blur-sm"
                    style={{
                      '--focus-border': 'rgba(111,58,242,0.4)',
                      '--focus-ring': 'rgba(111,58,242,0.2)'
                    } as React.CSSProperties}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.01] disabled:scale-100 disabled:opacity-50 border-0 relative overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, #1e0a4e 0%, #2e0f5f 40%, #4723a3 70%, #6f3af2 100%)`,
                    boxShadow: `0 8px 25px rgba(111,58,242,0.25)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 12px 35px rgba(111,58,242,0.30)`
                    e.currentTarget.style.filter = 'brightness(1.1) saturate(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 8px 25px rgba(111,58,242,0.25)`
                    e.currentTarget.style.filter = 'none'
                  }}
                  disabled={isLoading}
                >
                  <div 
                    className="absolute inset-0 blur-sm" 
                    style={{ 
                      background: `linear-gradient(135deg, rgba(140,99,255,0.20) 0%, rgba(71,35,163,0.20) 100%)` 
                    }} 
                  />
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" />}
                  <Mail className="mr-2 h-4 w-4 relative z-10" />
                  <span className="relative z-10">Reset link versturen</span>
                </Button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/[0.02] text-center">
              <p className="text-white/20 text-xs font-medium">
                Slim. Snel. <span style={{ color: `rgba(111,58,242,0.50)` }}>Onzichtbaar</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
