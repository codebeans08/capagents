'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import styles from './Accordion.module.css'
import type { AccordionProps } from './types'

function normalizeDefaultOpen(defaultOpenIds?: string[]): string[] {
  if (!defaultOpenIds) return []
  return Array.from(new Set(defaultOpenIds.filter(Boolean)))
}

export default function Accordion({
  sections,
  allowMultiple = false,
  defaultOpenIds,
  onToggle,
  className,
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>(() => normalizeDefaultOpen(defaultOpenIds))

  const headerRefs = useRef<Array<HTMLButtonElement | null>>([])
  const sectionCount = sections.length

  const isOpen = useCallback(
    (id: string) => openIds.includes(id),
    [openIds]
  )

  const toggle = useCallback(
    (id: string) => {
      setOpenIds(prev => {
        const currentlyOpen = prev.includes(id)
        let next: string[]
        if (allowMultiple) {
          next = currentlyOpen ? prev.filter(x => x !== id) : [...prev, id]
        } else {
          next = currentlyOpen ? [] : [id]
        }
        onToggle?.(id, !currentlyOpen)
        return next
      })
    },
    [allowMultiple, onToggle]
  )

  const onKeyDownHeader = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number, id: string) => {
      switch (event.key) {
        case 'Enter':
        case ' ': {
          event.preventDefault()
          toggle(id)
          break
        }
        case 'ArrowDown': {
          event.preventDefault()
          const nextIndex = (index + 1) % sectionCount
          headerRefs.current[nextIndex]?.focus()
          break
        }
        case 'ArrowUp': {
          event.preventDefault()
          const prevIndex = (index - 1 + sectionCount) % sectionCount
          headerRefs.current[prevIndex]?.focus()
          break
        }
        default:
          break
      }
    },
    [sectionCount, toggle]
  )

  const containerClassName = useMemo(() => {
    return [styles.accordion, className].filter(Boolean).join(' ')
  }, [className])

  return (
    <div className={containerClassName}>
      {sections.map((section, index) => {
        const panelId = `accordion-panel-${section.id}`
        const headerId = `accordion-header-${section.id}`
        const open = isOpen(section.id)
        return (
          <div className={styles.item} key={section.id}>
            <button
              ref={(el: HTMLButtonElement | null): void => {
                headerRefs.current[index] = el
              }}
              id={headerId}
              className={styles.header}
              aria-controls={panelId}
              aria-expanded={open}
              onClick={() => toggle(section.id)}
              onKeyDown={e => onKeyDownHeader(e, index, section.id)}
              type="button"
            >
              <span className={styles.title}>{section.title}</span>
              <span className={styles.icon} aria-hidden>
                {open ? '−' : '+'}
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              className={[styles.content, open ? styles.contentOpen : ''].join(' ')}
            >
              <div className={styles.contentInner}>{section.content}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
