# 🔐 Clerk + Convex Authentication Setup

## ✅ Wat is al geconfigureerd:

### 1. **Packages geïnstalleerd:**
- ✅ `@clerk/clerk-react` - Clerk React components
- ✅ `@convex-dev/auth` - Convex authentication integration

### 2. **Code configuratie:**
- ✅ `src/main.tsx` - ClerkProvider + ConvexAuthProvider
- ✅ `convex/auth.config.ts` - Clerk provider configuratie  
- ✅ `src/hooks/useConvexAuth.tsx` - Custom auth hook
- ✅ `src/components/auth/ConvexAuthGuard.tsx` - Auth guard component

### 3. **Environment variables setup:**
- ✅ `.env.local` template aangemaakt

## 🚀 Wat je nog moet doen:

### **Stap 1: Clerk Project Aanmaken**
1. Ga naar https://dashboard.clerk.com
2. Maak een nieuw project aan: **"Buildrs Core Suite"**
3. Kies **"Email + Password"** of **"Google + GitHub"** als sign-in methoden

### **Stap 2: API Keys Kopiëren**
Na project aanmaak, kopieer deze keys van je Clerk dashboard:

```bash
# Update .env.local met echte values:
VITE_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### **Stap 3: Convex Environment Variables**
```bash
# Set Clerk secret in Convex (run dit in terminal):
npx convex env set CLERK_SECRET_KEY sk_test_your_actual_clerk_secret_key
```

### **Stap 4: Test de Setup**
```bash
# Start development server
npm run dev

# In nieuwe terminal:
npx convex dev
```

## 🔄 Hoe Authentication Werkt:

### **1. User Flow:**
```
1. User gaat naar app
2. ConvexAuthGuard checkt authentication
3. Als niet ingelogd → Clerk SignIn component
4. Na login → Convex krijgt user data van Clerk
5. App laadt met authenticated user
```

### **2. In Components:**
```typescript
import { useConvexAuth } from '@/hooks/useConvexAuth';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useConvexAuth();
  
  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>Welcome {user?.name}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### **3. In Convex Functions:**
```typescript
import { authenticatedQuery } from '@convex-dev/auth/server';

export const myQuery = authenticatedQuery({
  args: {},
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    // User is authenticated here
    return await ctx.db.query("companies").collect();
  },
});
```

## 🎨 UI Customization:

### **Clerk Components Styling:**
```typescript
<SignIn 
  appearance={{
    elements: {
      rootBox: "mx-auto",
      card: "shadow-lg border-0",
      headerTitle: "text-2xl font-bold text-gray-900",
      formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
    },
    variables: {
      colorPrimary: "#2563eb",
      borderRadius: "8px",
    }
  }}
/>
```

## 🔒 Security Features:

### **Automatische Features:**
- ✅ **Session Management** - Clerk handelt dit af
- ✅ **JWT Verification** - Convex verifieert automatisch
- ✅ **Multi-device sync** - Sessions sync tussen devices  
- ✅ **Security headers** - Automatisch toegevoegd

### **User Management:**
- ✅ **Password reset** - Via Clerk dashboard configureren
- ✅ **Email verification** - Automatisch enabled
- ✅ **2FA support** - Beschikbaar in Clerk
- ✅ **Social logins** - Google, GitHub, etc.

## 🔧 Development Commands:

```bash
# Start beide servers:
npm run dev          # Frontend (Vite)
npx convex dev       # Backend (Convex)

# Check Convex dashboard:
npx convex dashboard

# Check environment variables:
npx convex env list
```

## 📋 Migration Checklist:

- [ ] Clerk project aangemaakt
- [ ] API keys toegevoegd aan .env.local  
- [ ] Convex environment variables ingesteld
- [ ] Test login/logout flow
- [ ] Migreer AuthGuard van Supabase naar Clerk
- [ ] Update alle components die useAuth gebruiken
- [ ] Test verschillende user scenarios

## 🎯 Volgende Stappen:

1. **Setup Clerk** (vandaag)
2. **Migreer AuthGuard** (morgen)  
3. **Update alle auth hooks** (deze week)
4. **Data migration** (volgende week)

## 🆘 Troubleshooting:

### **Common Issues:**
```bash
# If you get "No access to project":
npx convex dev --configure=new

# If environment variables don't work:
npx convex env list
npx convex env set CLERK_SECRET_KEY your_key_here

# If Clerk components don't show:
# Check browser console for CORS errors
# Make sure publishable key is correct
```

### **Useful Links:**
- **Clerk Dashboard:** https://dashboard.clerk.com
- **Convex Dashboard:** https://dashboard.convex.dev
- **Clerk Docs:** https://docs.clerk.com
- **Convex Auth Docs:** https://docs.convex.dev/auth