
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { Search, Building2, Users, Globe, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

type Company = {
  id: string
  name: string
  domain: string
  website: string
  industry_label: string
  subindustry_label: string
  city: string
  state: string
  country: string
  company_size: number
  created_at: string
}

export default function Companies() {
  const { profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const queryKey = useMemo(() => [
    'companies',
    { searchQuery, page, pageSize, clientId: profile?.client_id }
  ], [searchQuery, page, pageSize, profile?.client_id])

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('companies')
        .select('id,name,domain,website,industry_label,subindustry_label,city,state,country,company_size,created_at', { count: 'exact' })
        .range(from, to)
        .order('name')

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,domain.ilike.%${searchQuery}%,industry_label.ilike.%${searchQuery}%`)
      }

      const { data: companies, error, count } = await query
      if (error) throw error
      
      return { 
        companies: (companies as Company[]) || [], 
        total: count || 0 
      }
    },
    enabled: !!profile?.client_id,
    staleTime: 60_000,
  })

  const companies = data?.companies || []
  const total = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Quick stats
  const { data: stats } = useQuery({
    queryKey: ['companies-stats', profile?.client_id],
    queryFn: async () => {
      const { count: totalCompanies } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })

      const { data: sizeDistribution } = await supabase
        .from('companies')
        .select('company_size')
        .not('company_size', 'is', null)

      const avgSize = sizeDistribution && sizeDistribution.length > 0 
        ? Math.round(sizeDistribution.reduce((sum, c) => sum + (c.company_size || 0), 0) / sizeDistribution.length)
        : 0

      return {
        totalCompanies: totalCompanies || 0,
        avgSize,
      }
    },
    enabled: !!profile?.client_id,
    staleTime: 300_000, // 5 minutes
  })

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] overflow-hidden">
      {/* Header */}
      <div className="glass-surface backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Bedrijven
              </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {(stats?.totalCompanies || 0).toLocaleString()} bedrijven
                </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Ø {(stats?.avgSize || 0).toLocaleString()} werknemers
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setPage(1)
                  setSearchQuery(e.target.value)
                }}
                placeholder="Zoek bedrijven..."
                className="pl-10 h-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 border-b bg-muted/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totaal</p>
                  <p className="text-xl font-semibold">{(stats?.totalCompanies || 0).toLocaleString()}</p>
        </div>
      </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gem. grootte</p>
                  <p className="text-xl font-semibold">{(stats?.avgSize || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resultaten</p>
                  <p className="text-xl font-semibold">{companies.length}</p>
                </div>
        </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pagina</p>
                  <p className="text-xl font-semibold">{page} / {totalPages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Companies Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[260px] font-semibold text-foreground/80 sticky left-0 bg-background">Bedrijf</TableHead>
                <TableHead className="font-semibold text-foreground/80 w-[200px]">Industrie</TableHead>
                <TableHead className="font-semibold text-foreground/80 w-[120px] text-center">Grootte</TableHead>
                <TableHead className="font-semibold text-foreground/80 w-[200px]">Locatie</TableHead>
                <TableHead className="font-semibold text-foreground/80 w-[200px]">Website</TableHead>
                <TableHead className="font-semibold text-foreground/80 w-[120px]">Aangemaakt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className={`h-4 bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40 animate-pulse rounded ${j === 0 ? 'w-[200px]' : 'w-full'}`} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-destructive">
                    Fout bij laden van bedrijven
                  </TableCell>
                </TableRow>
              ) : companies.length ? (
                companies.map((company) => (
                  <TableRow 
                    key={company.id} 
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <TableCell className="sticky left-0 z-10 w-[260px] bg-background group-hover:bg-muted">
                      <div className="flex items-center gap-3 w-[260px]">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs font-medium">
                          {company.domain ? (
                            <img src={`https://logo.clearbit.com/${company.domain}`} alt="logo" className="h-full w-full object-cover" />
                          ) : (
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          )}
                          </div>
                        <div className="min-w-0 flex-1">
                          <Link to={`/accounts/${company.id}`} className="font-medium text-foreground truncate text-sm hover:underline">
                            {company.name}
                          </Link>
                          <div className="text-xs truncate text-muted-foreground">{company.domain || '—'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[200px]">
                        <div className="text-sm font-medium truncate text-foreground/90">{company.industry_label || '—'}</div>
                        {company.subindustry_label && (
                          <Badge variant="secondary" className="mt-1">{company.subindustry_label}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {company.company_size ? (
                        <Badge variant="secondary" className="font-mono">
                            {company.company_size.toLocaleString()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground/80 truncate max-w-[220px]">
                        {[company.city, company.state, company.country].filter(Boolean).join(', ') || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:underline text-sm truncate block max-w-[200px]"
                        >
                          {company.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(company.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Geen bedrijven gevonden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between text-sm">
          <div className="text-muted-foreground font-medium">
          {Math.min((page - 1) * pageSize + (companies.length ? 1 : 0), total)}–{Math.min(page * pageSize, total)} van {total.toLocaleString()}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            className="h-8"
          >
            Vorige
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page >= totalPages} 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            className="h-8"
          >
            Volgende
          </Button>
        </div>
      </div>
    </div>
  )
}
