"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';

export function Header() {
  const { user, isLoaded, isSignedIn } = useUser();

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 border border-primary/50">
              <div className="text-sm font-mono text-primary font-bold">{'</>'}</div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground font-mono">HackerBuddy</h1>
              <p className="text-xs text-muted-foreground font-mono">
                security analysis toolkit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <span className="text-xs text-muted-foreground font-mono">System Active</span>
            </div>

            {!isLoaded || !isSignedIn ? (
              <>
                <span className="hidden md:inline text-xs text-muted-foreground font-mono">Guest Mode</span>
                <SignInButton mode="modal">
                  <button className="px-3 py-1.5 text-xs font-mono rounded-md border border-border hover:bg-muted transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-3 py-1.5 text-xs font-mono rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    Sign Up
                  </button>
                </SignUpButton>
              </>
            ) : (
              <>
                <span className="hidden md:inline text-xs text-muted-foreground font-mono">
                  Logged in as {user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || 'User'}
                </span>
                <UserButton afterSignOutUrl="/" />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
