
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { ChevronsUpDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MultiOption = { value: string; label: string }

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecteer…',
  disabled = false,
}: {
  options: MultiOption[]
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  const labelByValue = useMemo(() => new Map(options.map(o => [o.value, o.label])), [options])
  const selected = useMemo(() => value.map(v => ({ value: v, label: labelByValue.get(v) || v })), [value, labelByValue])

  function toggle(val: string) {
    if (disabled) return
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val))
    } else {
      onChange([...value, val])
    }
  }

  function remove(val: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    onChange(value.filter(v => v !== val))
  }

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={(v)=>{ if (!disabled) setOpen(v) }}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={open} 
            disabled={disabled}
            className={cn(
              "w-full justify-between items-start py-2 h-auto",
              selected.length > 0 ? "min-h-[44px] pb-2" : "min-h-[40px]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex flex-wrap gap-1 items-center flex-1 text-left">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selected.map(s => (
                  <Badge 
                    key={s.value} 
                    variant="secondary" 
                    className="flex items-center gap-1 whitespace-nowrap text-xs h-6"
                  >
                    <span className="max-w-[120px] truncate">{s.label}</span>
                    {!disabled && (
                      <button
                        type="button"
                        className="ml-1 h-3 w-3 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center"
                        onClick={(e) => remove(s.value, e)}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-background border shadow-lg z-50 max-h-[60vh]" 
          align="start"
        >
          <Command className="bg-background">
            <CommandInput placeholder="Zoek…" className="bg-background border-0" />
            <CommandList className="max-h-[50vh] overflow-y-auto bg-background">
              <CommandEmpty className="bg-background p-4 text-sm text-muted-foreground">
                Geen resultaten gevonden
              </CommandEmpty>
              <CommandGroup className="bg-background p-0">
                {options.map(o => (
                  <CommandItem 
                    key={o.value} 
                    value={o.label} 
                    onSelect={() => {
                      toggle(o.value)
                    }}
                    className="bg-background hover:bg-muted cursor-pointer px-3 py-2"
                  >
                    <Check 
                      className={cn(
                        'mr-2 h-4 w-4', 
                        value.includes(o.value) ? 'opacity-100' : 'opacity-0'
                      )} 
                    />
                    <span className="flex-1">{o.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
