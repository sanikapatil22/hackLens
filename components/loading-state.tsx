export function LoadingState() {
  return (
    <div className="mt-16 flex flex-col items-center justify-center gap-6 py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-2 border-border/40 rounded-full"></div>
        <div
          className="absolute inset-0 border-2 border-transparent border-t-primary border-r-accent rounded-full animate-spin"
          style={{ animationDuration: '2s' }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border border-primary/30 rounded-lg"></div>
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-mono font-semibold text-foreground">
          Scanning target...
        </p>
        <p className="text-sm text-muted-foreground font-mono">Analyzing security posture</p>
      </div>
    </div>
  );
}
