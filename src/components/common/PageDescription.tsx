interface PageDescriptionProps {
  children: React.ReactNode;
}

export function PageDescription({ children }: PageDescriptionProps) {
  return (
    <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
      {children}
    </p>
  );
}
