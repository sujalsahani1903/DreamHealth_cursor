export function SkeletonCard() {
  return <div className="h-64 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800" />;
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
  );
}
