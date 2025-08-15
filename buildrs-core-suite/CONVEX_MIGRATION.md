# Supabase naar Convex Migratie Gids

## ✅ Wat is al gemigreerd:

### 1. **Schema & Database**
- **25 tabellen** volledig geconverteerd naar Convex schema
- **75+ indexes** toegevoegd voor optimale performance  
- **Alle relaties** behouden via ID references
- **JSON/Array fields** correct geconverteerd

### 2. **Infrastructure**
- Convex project: `silent-okapi-508` 
- Environment variables ingesteld
- React app geconfigureerd met ConvexProvider

### 3. **Basic Functions**
- ✅ `convex/companies.ts` - CRUD operations voor bedrijven
- ✅ `convex/contacts.ts` - CRUD operations voor contacten  
- ✅ `convex/deals.ts` - CRUD operations voor deals + line items
- ✅ `convex/auth.ts` - Authenticatie & user management

### 4. **React Hooks**
- ✅ `src/data/convex-crm.ts` - Convex hooks voor CRM data
- ✅ `src/pages/CompaniesConvex.tsx` - Voorbeeld gemigreerde component

## 🔄 Migratie Strategie:

### **Fase 1: Parallel Development (Huidige fase)**
```
Supabase ←→ Convex
    ↓         ↓
 Oude UI   Nieuwe UI
```

### **Fase 2: Gradual Migration**
- Component per component migreren
- Beide systemen parallel laten draaien
- Feature flags gebruiken

### **Fase 3: Data Migration**
- Supabase data exporteren
- Convex data importeren
- Validation scripts

## 📝 Hoe te Migreren:

### **1. Component Migratie**

**Voor (Supabase):**
```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

const { data, isLoading } = useQuery({
  queryKey: ['companies'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
    if (error) throw error;
    return data;
  }
});
```

**Na (Convex):**
```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const companies = useQuery(api.companies.list);
const isLoading = companies === undefined;
```

### **2. Mutations**

**Voor (Supabase):**
```typescript
const createCompany = async (data) => {
  const { data: result, error } = await supabase
    .from('companies')
    .insert(data)
  if (error) throw error;
  return result;
}
```

**Na (Convex):**
```typescript
const createCompany = useMutation(api.companies.create);

// Usage:
await createCompany({ name: "ACME Corp", domain: "acme.com" });
```

## 🚀 Volgende Stappen:

### **Week 1-2: Core Functions**
- [ ] Campaigns functions (`convex/campaigns.ts`)
- [ ] LinkedIn campaigns (`convex/liCampaigns.ts`) 
- [ ] Projects & tasks (`convex/projects.ts`, `convex/tasks.ts`)
- [ ] Notes & communications (`convex/notes.ts`)

### **Week 3-4: Component Migration**
- [ ] Migreer Companies page naar Convex
- [ ] Migreer Contacts page naar Convex
- [ ] Migreer Deals page naar Convex
- [ ] Update alle forms en modals

### **Week 5-6: Advanced Features**
- [ ] Real-time subscriptions implementeren
- [ ] File upload naar Convex Storage
- [ ] Search & filtering optimaliseren
- [ ] Authentication volledig migreren

### **Week 7-8: Data Migration**
- [ ] Data export script van Supabase
- [ ] Data import script naar Convex
- [ ] Data validation & testing
- [ ] Supabase cleanup

## 💡 Voordelen van Convex:

### **1. Simplicity**
- **Geen SQL** - JavaScript functions
- **Automatische API** - geen handmatige endpoints
- **Type safety** - automatische TypeScript types

### **2. Real-time**
```typescript
// Automatisch real-time updates - geen polling!
const companies = useQuery(api.companies.list);
// Updates automatisch als data wijzigt
```

### **3. Performance**
```typescript
// Automatische caching en optimalisatie
const companies = useQuery(api.companies.list, { search: "ACME" });
// Convex optimaliseert queries automatisch
```

### **4. Developer Experience**
```typescript
// Geen aparte migrations - schema evolueert automatisch
// Geen RLS policies - ingebouwde security
// Geen connection pooling - Convex regelt dit
```

## 🔧 Development Commands:

```bash
# Start Convex development
npm run dev

# Deploy functions
npx convex dev

# Open dashboard  
npx convex dashboard

# Import data (later)
npx convex import data.json
```

## 📊 Schema Mapping:

| Supabase | Convex | Status |
|----------|---------|---------|
| `companies` | `companies` | ✅ |
| `contacts` | `contacts` | ✅ |
| `deals` | `deals` | ✅ |
| `campaigns` | `campaigns` | ✅ |
| `li_campaigns` | `liCampaigns` | ✅ |
| `projects` | `projects` | ✅ |
| `tasks` | `tasks` | ✅ |
| `profiles` | `profiles` | ✅ |
| `clients` | `clients` | ✅ |

## 🧪 Testing:

1. **Start development:**
   ```bash
   npm run dev
   ```

2. **Test Convex functions:**
   - Go to https://dashboard.convex.dev/d/silent-okapi-508
   - Use Functions tab to test queries/mutations

3. **Test React integration:**
   - Navigate to `/companies-convex` voor gemigreerde versie
   - Vergelijk met originele `/companies` page

## 📞 Support:

- **Convex Documentation:** https://docs.convex.dev
- **Convex Discord:** https://convex.dev/community  
- **Schema Examples:** Check `convex/schema.ts`
- **Function Examples:** Check `convex/*.ts` files