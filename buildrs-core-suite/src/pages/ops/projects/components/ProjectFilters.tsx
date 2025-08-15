
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Filter, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export function ProjectFilters() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(searchValue)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Update URL when debounced search changes
  useEffect(() => {
    updateFilters({ q: debouncedSearch || undefined })
  }, [debouncedSearch])

  const updateFilters = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    // Reset to page 1 when filtering
    if (Object.keys(updates).some(key => key !== 'page')) {
      params.set('page', '1')
    }
    
    navigate(`/ops/projects?${params.toString()}`)
  }, [searchParams, navigate])

  const currentStatus = searchParams.get('status')
  const currentPerson = searchParams.get('person')
  
  const activeFiltersCount = [
    searchParams.get('q'),
    currentStatus,
    currentPerson
  ].filter(Boolean).length

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-64 pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select value={currentStatus || 'all'} onValueChange={(value) => 
        updateFilters({ status: value === 'all' ? undefined : value })
      }>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="on_hold">On Hold</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      {/* Person Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <User className="h-4 w-4" />
            Person
            {currentPerson && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48" align="end">
          <div className="space-y-2">
            <Select value={currentPerson || 'all'} onValueChange={(value) => 
              updateFilters({ person: value === 'all' ? undefined : value })
            }>
              <SelectTrigger>
                <SelectValue placeholder="All People" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All People</SelectItem>
                <SelectItem value="me">Assigned to me</SelectItem>
                <SelectItem value="eva">Eva Janssen</SelectItem>
                <SelectItem value="thijs">Thijs Bakker</SelectItem>
                <SelectItem value="mila">Mila Hendriks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>

      {/* Advanced Filters */}
      {activeFiltersCount > 0 && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => updateFilters({ q: undefined, status: undefined, person: undefined })}
        >
          Clear ({activeFiltersCount})
        </Button>
      )}
    </div>
  )
}
