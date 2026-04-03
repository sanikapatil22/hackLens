'use client'

import { Sparkles } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { SplineScene } from '@/components/ui/splite'
import { Spotlight } from '@/components/ui/spotlight'

export function SplineSceneBasic() {
  return (
    <Card className="relative h-125 w-full overflow-hidden border-neutral-800 bg-black/96">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1200&q=80')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      <div className="relative z-10 flex h-full">
        <div className="flex flex-1 flex-col justify-center p-8">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-neutral-100">
            <Sparkles className="h-3.5 w-3.5" />
            Live 3D Preview
          </div>

          <h1 className="bg-linear-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Interactive 3D
          </h1>
          <p className="mt-4 max-w-lg text-neutral-300">
            Bring your UI to life with beautiful 3D scenes. Create immersive
            experiences that capture attention and enhance your design.
          </p>
        </div>

        <div className="relative hidden flex-1 md:block">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full"
          />
        </div>
      </div>
    </Card>
  )
}
