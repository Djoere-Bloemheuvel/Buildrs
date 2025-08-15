
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/components/Layout';
import { FocusModeProvider } from '@/contexts/FocusModeContext';
import { FocusHeader } from '@/components/layout/FocusHeader';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Dashboard from '@/pages/Index';
import ContactsPage from '@/pages/Contacts';
import Contacts2Page from '@/pages/Contacts2';
import ContactDetail from '@/pages/ContactDetail';
import Companies from '@/pages/Companies';
import AccountDetail from '@/pages/AccountDetail';
import Deals from '@/pages/Deals';
import DealDetail from '@/pages/DealDetail';
import Activities from '@/pages/Activities';
import Offertes from '@/pages/Offertes';
import PropositionsPage from '@/pages/Propositions';
import OpsPage from '@/pages/Ops';
import OpsInboxPage from '@/pages/ops/inbox/page';
import OpsDashboardPage from '@/pages/ops/dashboard/page';
import OpsProjectsPage from '@/pages/ops/projects/page';
import OpsProjectDetailPage from '@/pages/ops/projects/detail/page';
import NotFound from '@/pages/NotFound';
import LeadDatabase from '@/pages/LeadDatabase';
import LeadABM from '@/pages/LeadABM';
import LeadLinkedIn from '@/pages/LeadLinkedIn';
import LinkedInCampaignEditor from '@/pages/LinkedInCampaignEditor';
import LeadEmail from '@/pages/LeadEmail';
import EmailCampaignEditor from '@/pages/EmailCampaignEditor';
import './App.css';

function App() {
  return (
    <>
      <AuthGuard>
        <FocusModeProvider>
          <FocusHeader />
          <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/contacts2" element={<Contacts2Page />} />
            <Route path="/contacts/:contactId" element={<ContactDetail />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/accounts/:companyId" element={<AccountDetail />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/deals/:dealId" element={<DealDetail />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/offertes" element={<Offertes />} />
            <Route path="/proposities" element={<PropositionsPage />} />
            <Route path="/ops" element={<OpsPage />} />
            <Route path="/ops/dashboard" element={<OpsDashboardPage />} />
            <Route path="/ops/projects" element={<OpsProjectsPage />} />
            <Route path="/ops/projects/:projectId" element={<OpsProjectDetailPage />} />
            <Route path="/ops/inbox" element={<OpsInboxPage />} />
            <Route path="/lead-engine/database" element={<LeadDatabase />} />
            <Route path="/lead-engine/abm" element={<LeadABM />} />
            <Route path="/lead-engine/linkedin" element={<LeadLinkedIn />} />
            <Route path="/lead-engine/linkedin/:campaignId" element={<LinkedInCampaignEditor />} />
            <Route path="/lead-engine/email" element={<LeadEmail />} />
            <Route path="/lead-engine/email/:campaignId" element={<EmailCampaignEditor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Layout>
        </FocusModeProvider>
      </AuthGuard>
      <Toaster />
    </>
  );
}

export default App;
