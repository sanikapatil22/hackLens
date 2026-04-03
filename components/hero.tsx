import { SplineScene } from '@/components/ui/splite';

export function Hero() {
  return (
    <section className="relative mb-16 w-full overflow-hidden border border-border/60 bg-card/40">
      <div className="absolute inset-0 opacity-95 filter-[brightness(0.82)_contrast(1.22)_saturate(1.05)]">
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="h-full w-full translate-x-20 translate-y-12 scale-110 md:translate-x-40 md:translate-y-16 lg:translate-x-128 lg:translate-y-16"
        />
      </div>
      <div className="absolute inset-0 bg-linear-to-b from-background/30 via-background/55 to-background/90" />

      <div className="relative z-10 w-full space-y-6 px-6 py-12 text-left md:px-12 md:py-16 lg:px-20">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-xs font-mono font-semibold text-primary">V 1.0 ACTIVE</span>
        </div>
        <h2 className="mb-6 text-5xl font-bold text-balance font-mono tracking-tight md:text-6xl">
          Analyze Security
          <br />
          <span className="text-primary">Like a Hacker</span>
        </h2>
        <p className="w-full text-lg leading-relaxed text-muted-foreground text-balance">
          Enter any website URL to scan for vulnerabilities. Get real-time insights
          into security risks, performance issues, and compliance gaps. Learn from
          interactive demonstrations and visual attack simulations.
        </p>
      </div>
    </section>
  );
}
