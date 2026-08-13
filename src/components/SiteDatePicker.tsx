'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar } from 'lucide-react'
import { useClickOutside } from '@/hooks/useClickOutside'

export function toDateValue(date: Date) {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  )
}

export function parseDateValue(value?: string | null): Date | null {
  if (!value) return null
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateLabel(value?: string | null, placeholder = 'Select date') {
  const date = parseDateValue(value)
  if (!date) return placeholder
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

type SiteDatePickerProps = {
  value?: string
  onChange: (value: string) => void
  minDate?: string
  disablePast?: boolean
  placeholder?: string
  label?: string
  className?: string
  buttonClassName?: string
  inline?: boolean
  disabled?: boolean
  helperText?: string
}

export default function SiteDatePicker({
  value,
  onChange,
  minDate,
  disablePast = true,
  placeholder = 'Select date',
  label,
  className = '',
  buttonClassName = '',
  inline = false,
  disabled = false,
  helperText,
}: SiteDatePickerProps) {
  const [open, setOpen] = useState(inline)
  const selected = parseDateValue(value)
  const [visibleMonth, setVisibleMonth] = useState(() => selected || new Date())
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selected) setVisibleMonth(selected)
  }, [value])

  useClickOutside(rootRef, open && !inline, () => setOpen(false))

  const minBound = useMemo(() => {
    const today = startOfDay(new Date())
    const min = parseDateValue(minDate)
    if (disablePast && min) return min.getTime() > today.getTime() ? min : today
    if (disablePast) return today
    return min ? startOfDay(min) : null
  }, [disablePast, minDate])

  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const todayValue = toDateValue(new Date())

  const calendar = (
    <div className={`${inline ? '' : 'absolute top-full left-0 right-0 mt-1 z-[130]'} text-black dark:text-white bg-white dark:bg-gray-800 border border-black/10 rounded-xl shadow-2xl p-3 sm:p-4 w-full max-w-full min-w-0 sm:min-w-[300px]`}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
          aria-label="Previous month"
        >
          ←
        </button>
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          type="button"
          onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-700 dark:text-gray-300 p-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = new Date(year, month, day)
          const dateValue = toDateValue(date)
          const isToday = dateValue === todayValue
          const isSelected = value === dateValue
          const isDisabled = Boolean(minBound && startOfDay(date).getTime() < minBound.getTime())

          return (
            <button
              key={day}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (isDisabled) return
                onChange(dateValue)
                if (!inline) setOpen(false)
              }}
              className={`p-2 text-sm rounded transition-colors ${
                isDisabled
                  ? 'text-gray-500 dark:text-gray-500 cursor-not-allowed'
                  : isSelected
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : isToday
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="mt-3 text-xs text-gray-700 dark:text-gray-300 text-center">
        {value ? 'Date selected' : 'Click to select a date'}
      </div>
    </div>
  )

  return (
    <div className={`relative min-w-0 w-full ${open ? 'z-[120]' : 'z-20'} ${className}`} ref={rootRef}>
      {label ? (
        <label className="block text-sm font-semibold text-[var(--ink)] mb-2">{label}</label>
      ) : null}
      {inline ? (
        calendar
      ) : (
        <div className="relative min-w-0 w-full">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((prev) => !prev)}
            className={
              buttonClassName ||
              'w-full min-w-0 pl-4 pr-10 py-3 text-left border border-black/10 rounded-xl bg-[var(--foam)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent cursor-pointer hover:border-[var(--lagoon)] transition-colors min-h-[44px] disabled:opacity-50'
            }
            aria-expanded={open}
          >
            <span className={value ? '' : 'text-[var(--ink-soft)]'}>{formatDateLabel(value, placeholder)}</span>
          </button>
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-soft)] pointer-events-none" />
          {open ? calendar : null}
        </div>
      )}
      {helperText ? <p className="text-xs text-[var(--ink-soft)] mt-1">{helperText}</p> : null}
    </div>
  )
}
