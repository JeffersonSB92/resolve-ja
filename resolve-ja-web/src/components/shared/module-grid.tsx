const modules = [
  'auth',
  'catalog',
  'addresses',
  'requests',
  'quotes',
  'providers',
  'attendance',
  'messages',
  'admin',
] as const;

export function ModuleGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((moduleName) => (
        <article key={moduleName} className="rounded-xl border border-border/70 bg-background/70 p-4">
          <h2 className="text-base font-medium capitalize">{moduleName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Estrutura pronta para integração com a API.</p>
        </article>
      ))}
    </div>
  );
}
