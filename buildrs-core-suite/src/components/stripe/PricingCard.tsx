import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PricingPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  features: string[]
  highlighted?: boolean
  stripePriceId: string
}

const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    currency: 'EUR',
    interval: 'maand',
    stripePriceId: 'price_starter_monthly',
    features: [
      '1,000 contacten',
      '5 actieve campaigns',
      'Email support',
      'Basis analytics',
      'CRM integratie'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    currency: 'EUR',
    interval: 'maand',
    stripePriceId: 'price_professional_monthly',
    highlighted: true,
    features: [
      '10,000 contacten',
      'Onbeperkte campaigns',
      'LinkedIn automation',
      'Geavanceerde analytics',
      'Priority support',
      'API toegang',
      'Custom integraties'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    currency: 'EUR',
    interval: 'maand',
    stripePriceId: 'price_enterprise_monthly',
    features: [
      'Onbeperkte contacten',
      'White-label oplossing',
      'Dedicated account manager',
      'Custom development',
      'SLA garanties',
      'On-premise optie',
      'Compliance ondersteuning'
    ]
  }
]

interface PricingCardProps {
  onSelectPlan?: (plan: PricingPlan) => void
}

export function PricingCard({ onSelectPlan }: PricingCardProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectPlan = async (plan: PricingPlan) => {
    setSelectedPlan(plan.id)
    setIsLoading(true)

    try {
      // Here we would create a Stripe checkout session
      // For now, just call the callback
      if (onSelectPlan) {
        onSelectPlan(plan)
      }
      toast.success(`${plan.name} plan geselecteerd!`)
    } catch (error) {
      toast.error('Fout bij selecteren van plan')
    }

    setIsLoading(false)
    setSelectedPlan(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
      {plans.map((plan) => (
        <Card 
          key={plan.id}
          className={`auth-card deep-card relative border-0 shadow-none bg-transparent ${
            plan.highlighted ? 'ring-2 ring-blue-500/20' : ''
          }`}
        >
          {plan.highlighted && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div 
                className="px-4 py-1 rounded-full text-xs font-medium text-white"
                style={{ 
                  background: `linear-gradient(135deg, #0a1e4e 0%, #0f2e5f 40%, #2347a3 70%, #3a6ff2 100%)` 
                }}
              >
                Meest Populair
              </div>
            </div>
          )}
          
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-white">€{plan.price}</span>
                <span className="text-white/60 text-sm">/{plan.interval}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSelectPlan(plan)}
              disabled={isLoading && selectedPlan === plan.id}
              className={`w-full h-12 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.01] disabled:scale-100 disabled:opacity-50 border-0 relative overflow-hidden ${
                plan.highlighted 
                  ? '' 
                  : 'bg-white/[0.008] border border-white/[0.03] hover:bg-white/[0.02]'
              }`}
              style={plan.highlighted ? { 
                background: `linear-gradient(135deg, #0a1e4e 0%, #0f2e5f 40%, #2347a3 70%, #3a6ff2 100%)`,
                boxShadow: `0 8px 25px rgba(58,111,242,0.25)`,
              } : undefined}
              onMouseEnter={plan.highlighted ? (e) => {
                e.currentTarget.style.boxShadow = `0 12px 35px rgba(58,111,242,0.30)`
                e.currentTarget.style.filter = 'brightness(1.1) saturate(1.1)'
              } : undefined}
              onMouseLeave={plan.highlighted ? (e) => {
                e.currentTarget.style.boxShadow = `0 8px 25px rgba(58,111,242,0.25)`
                e.currentTarget.style.filter = 'none'
              } : undefined}
            >
              {plan.highlighted && (
                <div 
                  className="absolute inset-0 blur-sm" 
                  style={{ 
                    background: `linear-gradient(135deg, rgba(99,168,255,0.20) 0%, rgba(35,71,163,0.20) 100%)` 
                  }} 
                />
              )}
              {isLoading && selectedPlan === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" />}
              {plan.highlighted && <Sparkles className="mr-2 h-4 w-4 relative z-10" />}
              <span className="relative z-10">
                {isLoading && selectedPlan === plan.id ? 'Verwerken...' : 'Kies Plan'}
              </span>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}