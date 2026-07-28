export function ProfilIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.5 18C2.5 13.8579 5.85786 10.5 10 10.5C14.1421 10.5 17.5 13.8579 17.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
