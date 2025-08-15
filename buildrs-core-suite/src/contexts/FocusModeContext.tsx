'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

type FocusModeState = {
  active: boolean
  taskName: string | null
  endAt: number | null // epoch ms
  paused: boolean
  remainingMs: number
}

type FocusModeActions = {
  start: (taskName: string, durationMinutes?: number) => void
  stop: () => void
  pause: () => void
  resume: () => void
  setTaskName: (name: string) => void
}

type FocusModeContextValue = FocusModeState & FocusModeActions

const FocusModeContext = createContext<FocusModeContextValue | undefined>(undefined)

const STORAGE_KEY = 'focus_mode_state_v1'

function loadFromStorage(): Partial<FocusModeState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveToStorage(state: Partial<FocusModeState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function FocusModeProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false)
  const [taskName, setTaskNameState] = useState<string | null>(null)
  const [endAt, setEndAt] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [remainingMs, setRemainingMs] = useState(0)
  const remainingWhenPaused = useRef<number | null>(null)

  // hydrate from storage
  useEffect(() => {
    const saved = loadFromStorage()
    if (saved) {
      setActive(!!saved.active)
      setTaskNameState(saved.taskName ?? null)
      setEndAt(saved.endAt ?? null)
      setPaused(!!saved.paused)
      if (typeof saved.remainingMs === 'number') setRemainingMs(saved.remainingMs)
    }
  }, [])

  // persist to storage
  useEffect(() => {
    saveToStorage({ active, taskName, endAt, paused, remainingMs })
  }, [active, taskName, endAt, paused, remainingMs])

  // ticking clock
  useEffect(() => {
    if (!active || !endAt) {
      setRemainingMs(0)
      return
    }
    if (paused) return
    const id = window.setInterval(() => {
      const now = Date.now()
      const ms = Math.max(0, endAt - now)
      setRemainingMs(ms)
      if (ms <= 0) {
        setActive(false)
        setTaskNameState(null)
        setEndAt(null)
        setPaused(false)
        remainingWhenPaused.current = null
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [active, endAt, paused])

  const start = useCallback((name: string, durationMinutes = 25) => {
    const end = Date.now() + durationMinutes * 60_000
    setActive(true)
    setTaskNameState(name)
    setEndAt(end)
    setPaused(false)
    remainingWhenPaused.current = null
    setRemainingMs(end - Date.now())
  }, [])

  const stop = useCallback(() => {
    setActive(false)
    setTaskNameState(null)
    setEndAt(null)
    setPaused(false)
    remainingWhenPaused.current = null
    setRemainingMs(0)
  }, [])

  const pause = useCallback(() => {
    if (!active || paused) return
    const nowRemaining = Math.max(0, (endAt ?? 0) - Date.now())
    remainingWhenPaused.current = nowRemaining
    setPaused(true)
    setRemainingMs(nowRemaining)
  }, [active, paused, endAt])

  const resume = useCallback(() => {
    if (!active || !paused) return
    const remain = remainingWhenPaused.current ?? remainingMs
    const newEnd = Date.now() + remain
    setEndAt(newEnd)
    setPaused(false)
    remainingWhenPaused.current = null
  }, [active, paused, remainingMs])

  const setTaskName = useCallback((name: string) => setTaskNameState(name), [])

  const value = useMemo<FocusModeContextValue>(() => ({
    active,
    taskName,
    endAt,
    paused,
    remainingMs,
    start,
    stop,
    pause,
    resume,
    setTaskName,
  }), [active, taskName, endAt, paused, remainingMs, start, stop, pause, resume, setTaskName])

  return (
    <FocusModeContext.Provider value={value}>{children}</FocusModeContext.Provider>
  )
}

export function useFocusMode() {
  const ctx = useContext(FocusModeContext)
  if (!ctx) throw new Error('useFocusMode must be used within FocusModeProvider')
  return ctx
}

