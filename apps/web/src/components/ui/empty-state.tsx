type EmptyStateProps = Readonly<{
  title: string;
  description: string;
}>;

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">P</div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
