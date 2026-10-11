interface SiteFooterProps {
  minimal?: boolean;
}

export function SiteFooter({ minimal = false }: SiteFooterProps) {
  if (minimal) return null;

  return (
    <footer className="px-5 py-[25px] sm:px-8 lg:px-16">
      <p className="mx-auto max-w-container text-center text-xs text-subtle">
        Sessions are ephemeral. We store nothing after they end.
      </p>
    </footer>
  );
}
