export default function EventCardSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="w-16 shrink-0 animate-pulse bg-paper-dim" />
      <div className="flex-1 space-y-3 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-paper-dim" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-paper-dim" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-paper-dim" />
        <div className="h-9 w-full animate-pulse rounded-full bg-paper-dim" />
      </div>
    </div>
  )
}
