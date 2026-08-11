/** Blok loading placeholder (animate-pulse). Dipakai saat data belum termuat. */
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />;
}
