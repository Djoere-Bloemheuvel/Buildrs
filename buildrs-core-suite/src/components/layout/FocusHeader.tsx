'use client'

import { useFocusMode } from '@/contexts/FocusModeContext'
import { Pause, Play, Square } from 'lucide-react'

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function FocusHeader() {
  const { active, taskName, remainingMs, paused, pause, resume, stop } = useFocusMode()
  if (!active) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      <div className="relative">
        <div className="absolute inset-0 bg-background/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur-xl border-b border-border/50" />
        <div className="relative mx-auto max-w-screen-2xl px-4">
          <div className="flex h-10 items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-6 w-6 rounded-md bg-primary/15 text-primary flex items-center justify-center text-[10px] font-semibold">F</div>
              <div className="truncate">
                <span className="font-medium">{taskName || 'Focusmodus'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="tabular-nums text-muted-foreground">{formatRemaining(remainingMs)}</div>
              {paused ? (
                <button className="rounded-md px-2 py-1 bg-primary text-primary-foreground hover:opacity-90" onClick={resume} aria-label="Hervat">
                  <div className="flex items-center gap-1"><Play className="h-3.5 w-3.5" /><span>Hervat</span></div>
                </button>
              ) : (
                <button className="rounded-md px-2 py-1 bg-muted hover:bg-muted/80" onClick={pause} aria-label="Pauzeer">
                  <div className="flex items-center gap-1"><Pause className="h-3.5 w-3.5" /><span>Pauzeer</span></div>
                </button>
              )}
              <button className="rounded-md px-2 py-1 bg-destructive text-destructive-foreground hover:opacity-90" onClick={stop} aria-label="Stop">
                <div className="flex items-center gap-1"><Square className="h-3.5 w-3.5" /><span>Stop</span></div>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Spacer to push app content below header */}
      <div className="h-10" />
    </div>
  )
}

