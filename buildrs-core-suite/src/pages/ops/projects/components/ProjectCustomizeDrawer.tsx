
'use client'

import { useState } from 'react'
import { X, Plus, GripVertical, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

interface ProjectCustomizeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Phase {
  id: string
  name: string
  visible: boolean
  color: string
}

interface ViewConfig {
  phases: Phase[]
  grouping: 'week' | 'month' | 'quarter'
  showPerson: boolean
  showDate: boolean
  showProgress: boolean
  density: 'compact' | 'comfortable'
}

const defaultConfig: ViewConfig = {
  phases: [
    { id: '1', name: 'Brainstorming', visible: true, color: 'blue' },
    { id: '2', name: 'Execution', visible: true, color: 'amber' },
    { id: '3', name: 'Launch', visible: true, color: 'green' }
  ],
  grouping: 'month',
  showPerson: true,
  showDate: true,
  showProgress: true,
  density: 'comfortable'
}

const colorOptions = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' }
]

export function ProjectCustomizeDrawer({ open, onOpenChange }: ProjectCustomizeDrawerProps) {
  const [config, setConfig] = useState<ViewConfig>(defaultConfig)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Save to database/localStorage
      console.log('Saving config:', config)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const addPhase = () => {
    const newPhase: Phase = {
      id: Date.now().toString(),
      name: 'New Phase',
      visible: true,
      color: 'blue'
    }
    setConfig(prev => ({
      ...prev,
      phases: [...prev.phases, newPhase]
    }))
  }

  const updatePhase = (id: string, updates: Partial<Phase>) => {
    setConfig(prev => ({
      ...prev,
      phases: prev.phases.map(phase => 
        phase.id === id ? { ...phase, ...updates } : phase
      )
    }))
  }

  const removePhase = (id: string) => {
    setConfig(prev => ({
      ...prev,
      phases: prev.phases.filter(phase => phase.id !== id)
    }))
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>Customize view</DrawerTitle>
              <DrawerDescription>
                Configure phases, columns, and grouping for your project tracker
              </DrawerDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Phases */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Phases</h3>
              <Button onClick={addPhase} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Phase
              </Button>
            </div>
            
            <div className="space-y-3">
              {config.phases.map((phase) => (
                <div key={phase.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Button variant="ghost" size="sm" className="cursor-grab">
                    <GripVertical className="h-4 w-4" />
                  </Button>
                  
                  <Input 
                    value={phase.name}
                    onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                    className="flex-1"
                  />
                  
                  <Select 
                    value={phase.color} 
                    onValueChange={(color) => updatePhase(phase.id, { color })}
                  >
                    <SelectTrigger className="w-32">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colorOptions.find(c => c.value === phase.color)?.class}`} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color.class}`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updatePhase(phase.id, { visible: !phase.visible })}
                  >
                    {phase.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePhase(phase.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Grouping */}
          <div>
            <h3 className="text-lg font-medium mb-4">Grouping</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="grouping">Group by</Label>
                <Select 
                  value={config.grouping} 
                  onValueChange={(grouping: 'week' | 'month' | 'quarter') => 
                    setConfig(prev => ({ ...prev, grouping }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="quarter">Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Column Visibility */}
          <div>
            <h3 className="text-lg font-medium mb-4">Columns</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-person">Show Person</Label>
                <Switch 
                  id="show-person"
                  checked={config.showPerson}
                  onCheckedChange={(showPerson) => setConfig(prev => ({ ...prev, showPerson }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-date">Show Date</Label>
                <Switch 
                  id="show-date"
                  checked={config.showDate}
                  onCheckedChange={(showDate) => setConfig(prev => ({ ...prev, showDate }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-progress">Show Progress</Label>
                <Switch 
                  id="show-progress"
                  checked={config.showProgress}
                  onCheckedChange={(showProgress) => setConfig(prev => ({ ...prev, showProgress }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Density */}
          <div>
            <h3 className="text-lg font-medium mb-4">Density</h3>
            <Select 
              value={config.density} 
              onValueChange={(density: 'compact' | 'comfortable') => 
                setConfig(prev => ({ ...prev, density }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t p-6">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
