
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { useAuth } from '@/hooks/useAuth';
import { fetchEnrichedContacts } from '@/data/crm';

// Minimal type for the enriched view rows we render in this table
type EnrichedContact = {
  id: string
  contact_id?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  mobile_phone?: string | null
  status?: string | null
  company_name?: string | null
  domain?: string | null
  website?: string | null
  linkedin_url?: string | null
  job_title?: string | null
  function_group?: string | null
  industry?: string | null
  industry_label?: string | null
  subindustry_label?: string | null
  employee_count?: number | null
  company_size?: number | null
  city?: string | null
  state?: string | null
  country?: string | null
  company_city?: string | null
  company_state?: string | null
  company_country?: string | null
  contact_city?: string | null
  contact_state?: string | null
  contact_country?: string | null
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
  const { profile } = useAuth();

  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(25);
  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts-enriched', search, statusFilter, page, pageSize, profile?.client_id],
    queryFn: () => fetchEnrichedContacts(search, page, pageSize, profile?.client_id, 'created_at', 'desc'),
    enabled: !!profile?.client_id,
    placeholderData: (previousData) => previousData,
  });
  const contacts: EnrichedContact[] = (data as any)?.data ?? []
  const total = (data as any)?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const columns: ColumnDef<EnrichedContact>[] = [
    {
      accessorKey: "contactpersoon",
      header: "Contactpersoon",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        const initials = `${c.first_name?.[0] || ''}${c.last_name?.[0] || ''}` || 'C';
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Naamloos';
        return (
          <div className="flex items-center gap-3 w-[260px]">
            <input type="radio" name="contacts-select" className="h-4 w-4 text-primary" />
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs font-medium">
              {c.domain ? (
                <img src={`https://logo.clearbit.com/${c.domain}`} alt="logo" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link to={`/contacts/${(c.contact_id || c.id)}`} className="font-medium text-foreground truncate text-sm hover:underline">
                {fullName}
              </Link>
              <div className="text-xs truncate">
                {c.linkedin_url ? (
                  <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:underline">LinkedIn profiel</a>
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
        const c: EnrichedContact = row.original;
        return (
          <div className="w-[200px]">
            <div className="text-sm font-medium truncate text-foreground/90">{c.job_title || '—'}</div>
            {c.function_group && (
              <Badge variant="secondary" className="mt-1">{c.function_group}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "bedrijf",
      header: "Bedrijf",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        const url = c.domain || c.website || '';
  return (
          <div className="w-[220px]">
            <Link to={`/accounts/${(c as any).company_id || ''}`} className="text-sm font-medium text-foreground hover:underline truncate block">
              {c.company_name || '—'}
            </Link>
            <div className="text-xs truncate">
              {url ? (
                <a href={`https://${url}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:underline">{url}</a>
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
        const c: EnrichedContact = row.original;
        return <div className="text-sm text-foreground/80 truncate max-w-[200px]">{c.email ?? '—'}</div>;
      },
    },
    {
      accessorKey: "telefoon",
      header: "Telefoon",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        const phone = c.mobile_phone || (c as any).company_phone || '—';
        return <div className="text-sm text-muted-foreground">{phone}</div>;
      },
    },
    {
      accessorKey: "industrie",
      header: "Industrie",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        return (
          <div className="w-[200px]">
            <div className="text-sm font-medium text-foreground/90 truncate">{c.industry_label || c.industry || '—'}</div>
            {c.subindustry_label && (
              <Badge variant="secondary" className="mt-1">{c.subindustry_label}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "aantal_medewerkers",
      header: "Aantal medewerkers",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        return <div className="text-sm text-foreground/80">{c.company_size ?? c.employee_count ?? '—'}</div>;
      },
    },
    {
      accessorKey: "locatie",
      header: "Locatie",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        // Gebruik bedrijfs-locatie zoals op de bedrijvenpagina; val terug op contactlocatie uit de view
        const parts = [
          c.company_city ?? c.contact_city,
          c.company_state ?? c.contact_state,
          c.company_country ?? c.contact_country,
        ].filter(Boolean) as string[];
        return <div className="text-sm text-foreground/80 truncate max-w-[220px]">{parts.length ? parts.join(', ') : '—'}</div>;
      },
    },
    {
      id: "actie",
      header: "Actie",
      cell: () => (
        <div className="flex justify-end">
          <Button size="sm" className="h-8">Contact</Button>
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Error</h2>
          <p className="text-muted-foreground mt-2">Failed to load contacts.</p>
        </div>
          </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <div className="container mx-auto pt-6 pb-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Contacts</h1>
          <div className="space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <Input 
              type="search"
              placeholder="Search contacts..."
              className="max-w-md"
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-2">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter by Status
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
          <Table className="w-full">
            <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, idx) => {
                    return (
                      <TableHead 
                        key={header.id}
                        className={
                          idx === 0
                            ? 'w-[260px] font-semibold text-foreground/80 sticky left-0 bg-background'
                            : idx === headerGroup.headers.length - 1
                              ? 'w-[40px] text-center font-semibold text-foreground/80'
                              : 'font-semibold text-foreground/80'
                        }
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
                        className={
                          idx === 0
                            ? 'sticky left-0 z-10 w-[260px] bg-background group-hover:bg-muted'
                            : idx === row.getVisibleCells().length - 1
                              ? 'text-right'
                              : ''
                        }
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
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground font-medium">
            <div>
              {Math.min((page-1)*pageSize+1, total)}–{Math.min(page*pageSize, total)} van {total}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="h-8">Vorige</Button>
            <span>{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages, p+1))} className="h-8">Volgende</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
