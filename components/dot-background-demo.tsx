import { cn } from "@/lib/utils";
import React from "react";

interface DotBackgroundDemoProps {
  children: React.ReactNode;
  className?: string;
}

export default function DotBackgroundDemo({ children, className }: DotBackgroundDemoProps) {
  return (
    <div className={cn("relative min-h-screen w-full bg-white dark:bg-black", className)}>
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
        )}
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="pointer-events-none absolute inset-0 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
