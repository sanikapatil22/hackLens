export function Hero() {
  return (
    <div className="text-center mb-16 space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-4">
        <div className="w-2 h-2 rounded-full bg-accent"></div>
        <span className="text-xs font-mono text-primary font-semibold">V 1.0 ACTIVE</span>
      </div>
      <h2 className="text-5xl md:text-6xl font-bold mb-6 text-balance font-mono tracking-tight">
        Analyze Security
        <br />
        <span className="text-primary">Like a Hacker</span>
      </h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
        Enter any website URL to scan for vulnerabilities. Get real-time insights 
        into security risks, performance issues, and compliance gaps. Learn from 
        interactive demonstrations and visual attack simulations.
      </p>
      <div className="flex justify-center gap-3 pt-4">
        <code className="text-xs bg-secondary/50 px-4 py-2 rounded font-mono text-accent border border-border">
          $ hackerbuddy --analyze
        </code>
      </div>
    </div>
  );
}
