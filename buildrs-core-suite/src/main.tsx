
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ConvexClientProvider } from '@/integrations/convex/client.tsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { StripeProvider } from '@/contexts/StripeContext'
import './index.css'
import './styles/premium-black.css'
import './styles/premium-jet-black.css'
import './styles/auth.override.css'
import './styles/auth.card.override.css'
import './styles/theme-premium-black.override.css'
import './styles/clerk-override.css'
import App from './App.tsx'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient()
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error("Missing Clerk Publishable Key")
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={clerkPubKey}
      afterSignInUrl="/"
      afterSignUpUrl="/"
      redirectUrl="/"
    >
      <StripeProvider>
        <ConvexClientProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <BrowserRouter>
                <App />
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                  }}
                />
              </BrowserRouter>
            </ThemeProvider>
          </QueryClientProvider>
        </ConvexClientProvider>
      </StripeProvider>
    </ClerkProvider>
  </StrictMode>,
)
