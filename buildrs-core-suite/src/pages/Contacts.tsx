
import { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, Plus, Filter, Download, MoreHorizontal, User, Building2, Phone, Mail, Calendar, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { useConvexAuth } from '@/hooks/useConvexAuth';
import ApolloUploadDialog from '@/components/contacts/ApolloUploadDialog';

// Type for basic contacts from Convex database
type Contact = {
  _id: string
  _creationTime: number
  leadId: string
  clientId: string
  companyId: string
  purchasedAt: number
  status?: string
  lastCommunicationAt?: number
  optedIn?: boolean
  fullEnrichment?: boolean
  firstName?: string
  lastName?: string
  email?: string
  mobilePhone?: string
  linkedinUrl?: string
  jobTitle?: string
  functionGroup?: string
  name?: string
  website?: string
  companyLinkedinUrl?: string
  industryLabel?: string
  subindustryLabel?: string
  companySummary?: string
  shortCompanySummary?: string
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'hot':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'warm':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'cold':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'qualified':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'unqualified':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export default function ContactsPage() {
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user, getClientId } = useConvexAuth();
  // Use real client ID from authenticated user
  const clientId = getClientId();
  const profile = { client_id: clientId };

  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(25);
  
  // Get basic contacts data from Convex (simplified for debugging)
  const contactsData = useQuery(api.contacts.list, {
    clientId: profile?.client_id as any, // Use mock client ID for testing
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: pageSize,
  });

  const isLoading = contactsData === undefined;
  const contacts = contactsData || [];
  const totalContacts = contacts.length;
  
  // Use the total count from the enriched query for proper pagination
  const total = totalContacts;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: "contactpersoon",
      header: "Contactpersoon",
      cell: ({ row }: { row: any }) => {
        const c: Contact = row.original;
        const initials = `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}` || 'C';
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Naamloos';
        return (
          <div className="flex items-center gap-2 sm:gap-3 w-full min-w-[200px] sm:w-[260px]">
            <input type="radio" name="contacts-select" className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <Link to={`/contacts/${c._id}`} className="font-medium text-foreground truncate text-sm hover:underline block">
                {fullName}
              </Link>
              <div className="text-xs truncate hidden sm:block">
                {c.linkedinUrl ? (
                  <a href={c.linkedinUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:underline">LinkedIn profiel</a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "functie",
      header: "Functie",
      cell: ({ row }: { row: any }) => {
        const c: Contact = row.original;
        return (
          <div className="w-full min-w-[150px] sm:w-[200px]">
            <div className="text-sm font-medium truncate text-foreground/90">{c.jobTitle || '—'}</div>
            {c.functionGroup && (
              <Badge variant="secondary" className="mt-1 hidden sm:inline-flex">{c.functionGroup}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "bedrijf",
      header: "Bedrijf",
      cell: ({ row }: { row: any }) => {
        const c: Contact = row.original;
        return (
          <div className="w-full min-w-[150px] sm:w-[220px]">
            <Link to={`/accounts/${c.companyId || ''}`} className="text-sm font-medium text-foreground hover:underline truncate block">
              {c.name || 'Onbekend Bedrijf'}
            </Link>
            <div className="text-xs truncate hidden sm:block">
              {c.website ? (
                <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:underline">{c.website.replace(/https?:\/\//, '')}</a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "E-mail",
      cell: ({ row }: { row: any }) => {
        const c: Contact = row.original;
        return <div className="text-sm text-foreground/80 truncate max-w-[150px] sm:max-w-[200px]">{c.email || '—'}</div>;
      },
    },
    {
      accessorKey: "telefoon",
      header: () => <span className="hidden lg:inline">Telefoon</span>,
      cell: ({ row }: { row: any }) => {
        const c: Contact = row.original;
        return <div className="text-sm text-muted-foreground hidden lg:block">{c.mobilePhone || '—'}</div>;
      },
    },
    {
      accessorKey: "industrie",
      header: () => <span className="hidden md:inline">Industrie</span>,
      cell: ({ row }: { row: any }) => {
        const c: Contact = row.original;
        return (
          <div className="w-full min-w-[120px] sm:w-[200px] hidden md:block">
            <div className="text-sm font-medium text-foreground/90 truncate">{c.industryLabel || '—'}</div>
            {c.subindustryLabel && (
              <Badge variant="secondary" className="mt-1 hidden lg:inline-flex">{c.subindustryLabel}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "aantal_medewerkers",
      header: () => <span className="hidden xl:inline">Aantal medewerkers</span>,
      cell: ({ row }: { row: any }) => {
        const c: Contact = row.original;
        return <div className="text-sm text-foreground/80 hidden xl:block">—</div>;
      },
    },
    {
      accessorKey: "locatie",
      header: () => <span className="hidden xl:inline">Locatie</span>,
      cell: ({ row }: { row: any }) => {
        const c: Contact = row.original;
        return <div className="text-sm text-foreground/80 truncate max-w-[220px] hidden xl:block">—</div>;
      },
    },
    {
      id: "actie",
      header: "Actie",
      cell: () => (
        <div className="flex justify-end">
          <Button size="sm" className="h-8 text-xs px-2 sm:px-3">
            <span className="hidden sm:inline">Contact</span>
            <Mail className="h-3 w-3 sm:hidden" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: contacts || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!profile?.client_id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">No Access</h2>
          <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading Contacts...</h2>
          <p className="text-muted-foreground mt-2">Please wait while we fetch your contacts.</p>
        </div>
            </div>
    );
  }


  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <div className="container mx-auto pt-4 sm:pt-6 pb-2 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h1 className="text-2xl font-bold">Contacts</h1>
          <div className="flex flex-wrap gap-2">
            <ApolloUploadDialog />
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="sm:hidden">
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Contact</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <Input 
              type="search"
              placeholder="Search contacts..."
              className="w-full sm:max-w-md"
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Filter by Status</span>
                  <span className="sm:hidden">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  All
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('hot')}>
                  Hot
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('warm')}>
                  Warm
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('cold')}>
                  Cold
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('qualified')}>
                  Qualified
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('unqualified')}>
                  Unqualified
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <Table className="w-full min-w-[600px]">
            <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, idx) => {
                    return (
                      <TableHead 
                        key={header.id}
                        className={`font-semibold text-foreground/80 ${
                          idx === 0
                            ? 'w-[200px] sm:w-[260px] sticky left-0 bg-background'
                            : idx === headerGroup.headers.length - 1
                              ? 'w-[60px] sm:w-[80px] text-center'
                              : 'min-w-[100px]'
                        }`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                    {Array.from({ length: columns.length }).map((_, j) => (
                      <TableCell key={j}>
                        <div className={`h-4 bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40 animate-pulse rounded ${j === 0 ? 'w-[200px]' : 'w-full'}`} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell, idx) => (
                      <TableCell
                        key={cell.id}
                        className={`${
                          idx === 0
                            ? 'sticky left-0 z-10 w-[200px] sm:w-[260px] bg-background group-hover:bg-muted'
                            : idx === row.getVisibleCells().length - 1
                              ? 'text-right'
                              : ''
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </div>

      {/* Sticky Footer Pagination */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="text-muted-foreground font-medium">
            <div>
              {Math.min((page-1)*pageSize+1, total)}–{Math.min(page*pageSize, total)} van {total}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="h-8 text-xs px-2 sm:px-3">
            <span className="hidden sm:inline">Vorige</span>
            <span className="sm:hidden">←</span>
          </Button>
          <span className="text-xs sm:text-sm">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages, p+1))} className="h-8 text-xs px-2 sm:px-3">
            <span className="hidden sm:inline">Volgende</span>
            <span className="sm:hidden">→</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
