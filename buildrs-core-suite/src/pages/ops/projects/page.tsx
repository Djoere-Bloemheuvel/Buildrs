
import { Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProjectFilters } from './components/ProjectFilters'
import { ProjectTable } from './components/ProjectTable'
import { ProjectCustomizeDrawer } from './components/ProjectCustomizeDrawer'
import { NewProjectDialog } from './components/NewProjectDialog'
import { getProjects } from './lib/fetchers'
import { ProjectFilters as ProjectFiltersType } from './lib/types'
import { TableSkeleton } from './components/SectionSkeleton'
import { useQuery } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function ProjectsPage() {
  const [searchParams] = useSearchParams()
  const [customizeOpen, setCustomizeOpen] = useState(false)
  
  const filters: ProjectFiltersType = {
    q: searchParams.get('q') || undefined,
    status: searchParams.get('status') as any || undefined,
    priority: searchParams.get('priority') as any || undefined,
    pinned: searchParams.get('pinned') === 'true',
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: 50 // Increased for tracker view
  }
  
  const { data: projectsResult = { items: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => getProjects(filters)
  })

  const { items: projects } = projectsResult

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold text-foreground">Project tracker</h1>
              <div className="flex items-center gap-3">
                <ProjectFilters />
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <NewProjectDialog />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <TableSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Project tracker</h1>
            
            <div className="flex items-center gap-3">
              <ProjectFilters />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCustomizeOpen(true)}
                aria-label="Customize view"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <NewProjectDialog />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <ProjectTable projects={projects} />
      </div>

      <ProjectCustomizeDrawer 
        open={customizeOpen} 
        onOpenChange={setCustomizeOpen}
      />
    </div>
  )
}
