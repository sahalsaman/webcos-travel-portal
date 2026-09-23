import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminPageSkeleton({ rows = 6, stats = false }: { rows?: number; stats?: boolean }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page content">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-[70vw]" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Card key={index}><CardContent className="space-y-3 p-5"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-32" /></CardContent></Card>
          ))}
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <div className="flex gap-6 border-b border-border p-4">
            {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-4 flex-1" />)}
          </div>
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex items-center gap-6 border-b border-border/50 p-4 last:border-0">
              <div className="flex min-w-40 flex-1 items-center gap-3"><Skeleton className="size-9 shrink-0 rounded-full" /><div className="w-full space-y-2"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-2/5" /></div></div>
              <Skeleton className="hidden h-4 flex-1 sm:block" />
              <Skeleton className="hidden h-4 flex-1 md:block" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="size-8 shrink-0 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
