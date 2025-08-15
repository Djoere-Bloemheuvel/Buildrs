# 🚀 Buildrs Core Suite - Development Guide

## 📋 Project Overview

**Buildrs Core Suite** is a modern CRM and lead generation platform built with React, TypeScript, and Convex. The application manages companies, contacts, deals, campaigns, and provides advanced analytics for business development teams.

### 🏗️ Architecture Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Convex (Real-time database + functions)
- **Authentication**: Clerk + Convex Auth
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: Convex React hooks

---

## 🎯 Key Features

### 🏢 **CRM Core**
- **Companies**: Company profiles with enrichment data
- **Contacts**: Contact management with relationship tracking
- **Deals**: Sales pipeline with stages and forecasting
- **Activities**: Complete activity timeline and logging

### 📧 **Campaign Management**
- **Email Campaigns**: Multi-step email sequences
- **LinkedIn Campaigns**: Professional outreach automation
- **ABM Campaigns**: Account-based marketing targeting
- **Performance Analytics**: Response rates, conversion tracking

### 📊 **Analytics & Insights**
- **Client Performance**: Comprehensive client dashboards
- **Campaign Effectiveness**: Response rates, ROI analysis
- **Pipeline Forecasting**: Deal probability and weighted values
- **Meeting Preparation**: Context-aware meeting briefings

---

## 🚀 Development Commands

### **Start Development Environment**
```bash
# Frontend (Vite) - runs on http://localhost:8081
npm run dev

# Backend (Convex) - real-time database + functions
npx convex dev

# Both simultaneously (recommended)
npm run dev & npx convex dev
```

### **Build & Production**
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Convex
npx convex deploy
```

### **Database Management**
```bash
# View Convex dashboard
npx convex dashboard

# Check environment variables
npx convex env list

# Reset/clear data (development only)
npx convex run clearData

# Import/export data
npx convex import
npx convex export
```

### **Authentication Setup**
```bash
# Set Clerk secret in Convex
npx convex env set CLERK_SECRET_KEY sk_test_your_key_here

# Check auth configuration
npx convex logs
```

---

## 🗄️ Database Schema (Convex)

### **Core Entities**

#### **Clients**
- Client organizations with subscription info
- Multi-tenant architecture support

#### **Companies** 
- Company profiles with enrichment data
- Industry, size, location metadata
- Keywords and targeting information

#### **Contacts**
- Individual contact records
- Job titles, seniority, function groups
- LinkedIn connection status and engagement

#### **Deals**
- Sales opportunities with pipeline stages
- Values, confidence scores, forecasting
- Contact and company relationships

#### **Campaigns**
- Email and LinkedIn outreach campaigns
- Targeting criteria and performance metrics
- Multi-step sequences and automation

#### **Communications**
- All communication history (email, LinkedIn)
- Open/click tracking, response data
- Campaign attribution and metrics

---

## 🔧 Complex Views & Business Logic

### **Candidate Selection Views** (`convex/candidateViews.ts`)

#### **ABM Candidates**
```typescript
// Get ABM-eligible companies with 2+ decision makers
const abmCandidates = await ctx.runQuery("candidateViews:abmCandidates", {
  minCompanySize: 25,
  excludeDoNotContact: true
});
```

**Business Rules:**
- Companies with ≥25 employees
- ≥2 decision makers from key function groups
- Time-based communication eligibility:
  - 0-2 campaigns: 30-day cooldown
  - 3-4 campaigns: 45-day cooldown
  - 5-6 campaigns: 60-day cooldown
  - 7+ campaigns: 90-day cooldown

#### **Cold Email Candidates**
```typescript
// Get contacts eligible for cold email outreach
const coldEmailCandidates = await ctx.runQuery("candidateViews:coldEmailCandidates", {
  includeAssignable: true
});
```

**Business Rules:**
- Status: "cold" contacts only
- Excludes ABM candidates (different strategy)
- No active campaigns (planned/active status)
- Same time-based eligibility as ABM

#### **LinkedIn Candidates**
```typescript
// Get contacts for LinkedIn outreach
const linkedinCandidates = await ctx.runQuery("candidateViews:linkedinCandidates", {
  minCompanySize: 5
});
```

**Business Rules:**
- Warm/cold contacts not yet LinkedIn connected
- Company size ≥5 employees
- Not in active LinkedIn campaigns
- No recent communications (14-day buffer)
- No active email campaigns

### **Timeline Views** (`convex/timelineViews.ts`)

#### **Full Timeline**
```typescript
// Get complete activity timeline for contact/company
const timeline = await ctx.runQuery("timelineViews:fullTimeline", {
  contactId: "...",
  fromDate: Date.now() - 90*24*60*60*1000, // 90 days
  limit: 100
});
```

**Includes:**
- All communications (email, LinkedIn)
- Campaign enrollments and status changes
- Deal creation and stage movements
- Activity log entries with metadata

#### **Meeting Preparation**
```typescript
// Get comprehensive meeting context
const meetingPrep = await ctx.runQuery("timelineViews:meetingPrep", {
  contactIds: ["contact1", "contact2"],
  companyId: "company123",
  includePastDays: 30
});
```

**Provides:**
- Attendee relationship scores
- Recent communications summary
- Active campaigns and deals
- Company intelligence metrics
- AI-generated talking points

### **Search & Analytics** (`convex/searchViews.ts`)

#### **Global Search**
```typescript
// Search across all entities with relevance scoring
const results = await ctx.runQuery("searchViews:globalSearch", {
  searchTerm: "buildrs",
  entityTypes: ["companies", "contacts", "deals"],
  limit: 20
});
```

#### **Advanced Contact Search**
```typescript
// Sophisticated contact filtering with facets
const searchResults = await ctx.runQuery("searchViews:advancedContactSearch", {
  functionGroups: ["Marketing Decision Makers"],
  industries: ["Technology"],
  companySizeMin: 50,
  responseRate: 10,
  sortBy: "responseRate",
  limit: 50
});
```

---

## 🔐 Authentication Flow (Clerk + Convex)

### **Setup Process**
1. **Clerk Project**: Create at https://dashboard.clerk.com
2. **Environment Variables**:
   ```bash
   # .env.local
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # Convex environment
   npx convex env set CLERK_SECRET_KEY sk_test_...
   ```

### **Implementation**
```typescript
// Custom auth hook
import { useConvexAuth } from '@/hooks/useConvexAuth';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useConvexAuth();
  
  if (!isAuthenticated) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome {user?.name}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### **Protected Convex Functions**
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

---

## 📊 Performance Considerations

### **Query Optimization**
- Use indexed queries for large datasets
- Batch related data fetching
- Implement pagination for lists
- Cache expensive calculations

### **Real-time Updates**
```typescript
// Convex automatically handles real-time updates
const campaigns = useQuery("campaigns:list", { clientId });
// UI updates automatically when data changes
```

### **Data Loading Patterns**
```typescript
// Optimistic updates for better UX
const updateCampaign = useMutation("campaigns:update");

const handleUpdate = async (data) => {
  try {
    await updateCampaign({ id, ...data });
    toast.success("Campaign updated!");
  } catch (error) {
    toast.error("Update failed");
  }
};
```

---

## 🔧 Development Workflow

### **1. Feature Development**
```bash
# Create feature branch
git checkout -b feature/new-campaign-type

# Start development servers
npm run dev & npx convex dev

# Make changes and test
# Commit and push
```

### **2. Schema Changes**
```bash
# Update convex/schema.ts
# Deploy schema changes
npx convex deploy

# Update React components to use new schema
# Test migration with existing data
```

### **3. Data Migration**
```bash
# Create migration script in convex/migrations/
# Run migration
npx convex run migrations:migrateCampaignData

# Verify data integrity
npx convex dashboard
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **Convex Connection Issues**
```bash
# If you get "No access to project"
npx convex dev --configure=new

# If environment variables don't work
npx convex env list
npx convex env set CLERK_SECRET_KEY your_key_here
```

#### **Authentication Problems**
```bash
# Check Clerk configuration
# Verify publishable key in .env.local
# Ensure secret key is set in Convex
npx convex env list
```

#### **Real-time Updates Not Working**
```bash
# Check Convex connection status
npx convex logs

# Verify subscription patterns in React
# Check browser network tab for WebSocket connection
```

### **Performance Issues**
- Check query efficiency in Convex dashboard
- Implement pagination for large result sets
- Use indexes for filtered queries
- Consider data denormalization for complex views

---

## 📚 Key Files & Directories

### **Frontend Structure**
```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── ui/             # shadcn/ui components
│   └── forms/          # Form components
├── pages/              # Route components
│   ├── LeadLinkedIn.tsx # LinkedIn campaign management
│   ├── Companies.tsx    # Company management
│   └── Dashboard.tsx    # Main dashboard
├── hooks/              # Custom React hooks
│   └── useConvexAuth.tsx # Authentication hook
└── lib/                # Utilities and configuration
```

### **Backend Structure (Convex)**
```
convex/
├── schema.ts           # Database schema definition
├── auth.config.ts      # Clerk authentication config
├── companies.ts        # Company CRUD operations
├── contacts.ts         # Contact management
├── deals.ts           # Deal pipeline functions
├── campaigns.ts       # Campaign management
├── candidateViews.ts  # Complex candidate selection
├── timelineViews.ts   # Activity timeline functions
├── searchViews.ts     # Search and filtering
├── analyticsViews.ts  # Performance analytics
└── views.ts           # Enriched data views
```

---

## 🎯 Next Steps

### **Migration Tasks**
1. **Complete Clerk Setup**: Add API keys and test authentication
2. **Data Migration**: Transfer Supabase data to Convex
3. **Frontend Updates**: Replace Supabase hooks with Convex
4. **Testing**: Verify all features work with new backend

### **Feature Enhancements**
1. **Real-time Notifications**: Leverage Convex real-time capabilities
2. **Advanced Analytics**: Implement cohort analysis and forecasting
3. **AI Integration**: Add AI-powered insights and recommendations
4. **Mobile Support**: Optimize for mobile devices

---

## 📞 Support & Resources

- **Convex Docs**: https://docs.convex.dev
- **Clerk Docs**: https://docs.clerk.com
- **Project Issues**: Create GitHub issues for bugs/features
- **Development Questions**: Check Convex Discord or Stack Overflow

---

## 🔄 Migration Status

### ✅ **Completed**
- [x] Convex project setup and configuration
- [x] Complete database schema migration (25 tables, 75+ indexes)
- [x] Clerk authentication integration
- [x] Complex business logic views conversion
- [x] CRUD operations for all entities
- [x] Advanced search and filtering capabilities
- [x] Timeline and meeting preparation views
- [x] Analytics and performance tracking

### 🔄 **In Progress**
- [ ] Frontend component updates (replacing Supabase hooks)
- [ ] Authentication flow testing
- [ ] Data migration scripts

### 📋 **Pending**
- [ ] Complete data migration from Supabase
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Production deployment

---

*Last updated: 2025-08-15 | Convex migration complete, ready for frontend integration*