export type AccordionSection = {
  id: string
  title: string
  content: React.ReactNode
}

export type AccordionProps = {
  sections: AccordionSection[]
  allowMultiple?: boolean
  defaultOpenIds?: string[]
  onToggle?: (id: string, isOpen: boolean) => void
  className?: string
}
