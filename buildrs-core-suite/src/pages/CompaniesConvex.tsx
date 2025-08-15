// MIGRATED COMPANIES PAGE - Using Convex instead of Supabase
import { useState } from 'react'
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
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
import { Search, Building2, Users, Globe, MapPin, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CompaniesConvex() {
  const [searchQuery, setSearchQuery] = useState('')

  // Convex hook - much simpler than React Query + Supabase!
  const companies = useQuery(api.companies.list, { 
    search: searchQuery || undefined,
    limit: 50 
  });

  const isLoading = companies === undefined;
  const error = companies === null ? new Error("Failed to load companies") : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled automatically by Convex reactivity
    // No need to manually refetch like with React Query
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading companies: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">
            Manage your company database and relationships
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Companies
          </CardTitle>
          <CardDescription>
            Search by company name, domain, or industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Companies ({companies?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies && companies.length > 0 ? (
                    companies.map((company) => (
                      <TableRow key={company._id}>
                        <TableCell>
                          <div>
                            <Link 
                              to={`/companies/${company._id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {company.name}
                            </Link>
                            {company.domain && (
                              <p className="text-sm text-muted-foreground">
                                {company.domain}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {company.industryLabel && (
                              <Badge variant="secondary" className="mb-1">
                                {company.industryLabel}
                              </Badge>
                            )}
                            {company.subindustryLabel && (
                              <p className="text-sm text-muted-foreground">
                                {company.subindustryLabel}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {[company.city, company.state, company.country]
                                .filter(Boolean)
                                .join(', ') || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.companySize && (
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-3 w-3" />
                              <span>{company.companySize.toLocaleString()}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <Globe className="h-3 w-3" />
                              Visit
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchQuery ? 'No companies found' : 'No companies yet'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}