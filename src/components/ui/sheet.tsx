'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetPortal = DialogPrimitive.Portal
const SheetClose = DialogPrimitive.Close

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

interface SheetContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  title?: string
}

function SheetContent({ className, children, title = 'Assistente de mercado', ...props }: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl outline-none dark:bg-[#0f2325] sm:w-[420px]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out duration-300',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          className,
        )}
        {...props}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <DialogPrimitive.Title className="text-sm font-semibold text-[var(--sea-ink)]">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="rounded-lg p-1 text-[var(--sea-ink-soft)] transition-colors hover:bg-black/5 hover:text-[var(--sea-ink)] dark:hover:bg-white/10">
            <X className="size-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

export { Sheet, SheetTrigger, SheetPortal, SheetOverlay, SheetClose, SheetContent }
