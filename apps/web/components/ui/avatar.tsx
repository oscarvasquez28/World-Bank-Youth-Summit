import * as React from 'react'

export default function Avatar({ initials = 'U' }: { initials?: string }) {
  return (
    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-800">
      {initials}
    </div>
  )
}
