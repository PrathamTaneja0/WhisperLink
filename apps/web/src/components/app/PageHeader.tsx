interface PageHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export function PageHeader({ title, subtitle, centered = true }: PageHeaderProps) {
  return (
    <div className={centered ? 'mb-10 text-center' : 'mb-8'}>
      <h1 className="headline-display">{title}</h1>
      {subtitle && <p className="body-lg mt-4 max-w-xl mx-auto">{subtitle}</p>}
    </div>
  );
}
