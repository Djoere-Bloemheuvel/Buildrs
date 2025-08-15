
export function InboxPreview() {
  const items: any[] = [];

  if (items.length === 0) {
    return <p className="text-muted-foreground">Alles onder controle 🎉</p>;
  }

  return (
    <div className="space-y-2">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border/40">
            <th className="px-2 py-2 text-left">Titel</th>
            <th className="px-2 py-2 text-left">Bron</th>
            <th className="px-2 py-2 text-left">Prioriteit</th>
            <th className="px-2 py-2 text-left">Leeftijd</th>
          </tr>
        </thead>
        <tbody>
          {items.map(row => (
            <tr key={row.id} className="border-b border-border/20">
              <td className="px-2 py-2">{row.title}</td>
              <td className="px-2 py-2">{row.source}</td>
              <td className="px-2 py-2">{row.priority}</td>
              <td className="px-2 py-2">{row.ageReadable}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pt-1">
        <a href="/ops/inbox" className="text-xs text-primary underline" aria-label="Open Inbox">Open Inbox</a>
      </div>
    </div>
  );
}
