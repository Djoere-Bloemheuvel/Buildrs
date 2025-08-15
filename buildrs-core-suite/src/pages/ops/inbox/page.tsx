import { InboxHeader } from './components/InboxHeader'
import { InboxToolbar } from './components/InboxToolbar'
import { InboxTable } from './components/InboxTable'

export default function OpsInboxPage() {
  return (
    <main className="container mx-auto px-4 py-6 space-y-4 max-w-screen-xl">
      <InboxHeader />
      <InboxToolbar />
      <InboxTable />
    </main>
  );
}

