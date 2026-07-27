export interface PageTitleProps {
  title?: string;
  subtitle?: string;
}

export default function PageTitle({
  title = "Dashboard Admin Inisiasi Perubahan",
  subtitle = "Kelola seluruh permohonan inisiasi perubahan",
}: PageTitleProps) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold text-[#141D23] leading-8">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-[#424655] leading-5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
