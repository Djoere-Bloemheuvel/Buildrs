import { useState } from 'react';

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

export default function Contacts2Page() {
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user, getClientId } = useConvexAuth();
  // Use real client ID from authenticated user
  const profile = { client_id: getClientId() };

  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(25);
  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts-enriched-2', search, statusFilter, page, pageSize, profile?.client_id],
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
      header: "NAME",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        const initials = `${c.first_name?.[0] || ''}${c.last_name?.[0] || ''}` || 'C';
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Naamloos';
        return (
          <div className="flex items-center gap-3 py-4 px-4">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
              {c.domain ? (
                <img src={`https://logo.clearbit.com/${c.domain}`} alt="logo" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link to={`/contacts/${(c.contact_id || c.id)}`} className="font-semibold text-blue-600 hover:text-blue-700 text-sm block leading-tight">
                {fullName}
              </Link>
              <div className="text-xs text-gray-500 mt-1">
                {c.linkedin_url ? (
                  <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">View LinkedIn</a>
                ) : (
                  <span>--</span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "EMAIL",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        return (
          <div className="py-4 px-4">
            <div className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
              {c.email ?? '--'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "telefoon",
      header: "PHONE NUMBER",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        const phone = c.mobile_phone || (c as any).company_phone || '--';
        return (
          <div className="py-4 px-4">
            <div className="text-sm text-gray-900">{phone}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "lead_status",
      header: "LEAD STATUS",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        const status = c.status || 'unqualified';
        return (
          <div className="py-4 px-4">
            <Badge 
              variant="secondary" 
              className={`text-xs px-2 py-1 font-medium ${getStatusColor(status)}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "favorite_content",
      header: "FAVORITE CONTENT TOPIC",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        return (
          <div className="py-4 px-4">
            <div className="text-sm text-gray-900">--</div>
          </div>
        );
      },
    },
    {
      accessorKey: "preferred_channels",
      header: "PREFERRED CHANNELS",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        return (
          <div className="py-4 px-4">
            <div className="text-sm text-gray-900">--</div>
          </div>
        );
      },
    },
    {
      accessorKey: "create_date",
      header: "CREATE DATE (GMT+2)",
      cell: ({ row }: { row: any }) => {
        const c: EnrichedContact = row.original;
        return (
          <div className="py-4 px-4">
            <div className="text-sm text-gray-900">Aug 10, 2025 5:07 PM GMT+2</div>
          </div>
        );
      },
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <div className="text-sm text-gray-500">5 records</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
              Data Quality
            </Button>
            <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
              Actions
            </Button>
            <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
              Import
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Create contact
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mb-4">
          <Button variant="ghost" className="bg-blue-50 text-blue-700 border border-blue-200 text-sm px-4 py-2 h-8">
            All contacts
          </Button>
          <Button variant="ghost" className="text-gray-600 text-sm px-4 py-2 h-8 hover:bg-gray-50">
            Newsletter subscribers
          </Button>
          <Button variant="ghost" className="text-gray-600 text-sm px-4 py-2 h-8 hover:bg-gray-50">
            Unsubscribed
          </Button>
          <Button variant="ghost" className="text-gray-600 text-sm px-4 py-2 h-8 hover:bg-gray-50">
            All customers
          </Button>
          <Button variant="ghost" className="text-blue-600 text-sm px-4 py-2 h-8 ml-auto">
            + Add view (4/5)
          </Button>
          <Button variant="ghost" className="text-blue-600 text-sm px-4 py-2 h-8">
            All Views
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
                Contact owner
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All owners</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
                Create date
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
                Last activity date
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
                Lead status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All statuses</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
            + More
          </Button>

          <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 bg-blue-50">
            Advanced filters
          </Button>

          <div className="flex-1" />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search name, phone, email"
              className="pl-10 w-64 border-gray-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
            Export
          </Button>

          <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
            Edit columns
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-auto bg-white">
        <Table className="w-full">
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200">
                <TableCell className="w-4 py-3 px-4 border-r border-gray-200">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                </TableCell>
                {headerGroup.headers.map((header, idx) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-gray-600 uppercase tracking-wide py-3 px-4 border-r border-gray-200 last:border-r-0 bg-gray-50"
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-3 w-3" />
                      </button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="border-r border-gray-200">
                    <div className="h-4 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  {Array.from({ length: columns.length }).map((_, j) => (
                    <TableCell key={j} className="border-r border-gray-200 last:border-r-0">
                      <div className="h-4 bg-gray-200 animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="border-r border-gray-200 py-0 px-4">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                  </TableCell>
                  {row.getVisibleCells().map((cell, idx) => (
                    <TableCell
                      key={cell.id}
                      className="border-r border-gray-200 last:border-r-0 py-0"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center text-gray-500">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Pagination */}
      <div className="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <Button variant="ghost" size="sm" className="text-blue-600 p-0 h-auto font-normal">Prev</Button>
            <span className="mx-2">1</span>
            <Button variant="ghost" size="sm" className="text-blue-600 p-0 h-auto font-normal">Next</Button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-blue-600">
                25 per page
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>25 per page</DropdownMenuItem>
              <DropdownMenuItem>50 per page</DropdownMenuItem>
              <DropdownMenuItem>100 per page</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}