import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import { createProjectField, deleteProjectField } from '../lib/mutations'
import type { ProjectField } from '../lib/types'

interface FieldCustomizerProps {
  projectId: string
  fields: ProjectField[]
  onClose: () => void
  onFieldsChange: () => void
}

export function FieldCustomizer({ projectId, fields, onClose, onFieldsChange }: FieldCustomizerProps) {
  const [newField, setNewField] = useState({
    key: '',
    label: '',
    type: 'text',
  })

  const handleCreateField = async () => {
    if (!newField.label || !newField.key) return
    
    try {
      await createProjectField(projectId, {
        key: newField.key,
        label: newField.label,
        type: newField.type,
      })
      
      setNewField({ key: '', label: '', type: 'text' })
      onFieldsChange()
    } catch (error) {
      console.error('Failed to create field:', error)
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    try {
      await deleteProjectField(fieldId)
      onFieldsChange()
    } catch (error) {
      console.error('Failed to delete field:', error)
    }
  }

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select' },
    { value: 'boolean', label: 'Checkbox' },
  ]

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize Fields</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Existing Fields */}
          <div>
            <h3 className="text-sm font-medium mb-3">Current Fields</h3>
            <div className="space-y-2">
              {fields.map((field) => (
                <div 
                  key={field.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{field.label}</div>
                    <div className="text-sm text-muted-foreground">{field.type}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteField(field.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Field */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-3">Add New Field</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  value={newField.label}
                  onChange={(e) => setNewField({ 
                    ...newField, 
                    label: e.target.value, 
                    key: e.target.value.toLowerCase().replace(/\s+/g, '_') 
                  })}
                  placeholder="Field Name"
                />
              </div>
              <div>
                <Select
                  value={newField.type}
                  onValueChange={(value) => setNewField({ ...newField, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleCreateField}
                disabled={!newField.label}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
