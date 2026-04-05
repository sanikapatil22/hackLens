import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'HackerBuddy - Website Security Analyzer',
  description: 'Friendly ethical hacker analysis of website security vulnerabilities. Learn about common security weaknesses in a fun, non-scary way.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-background text-foreground">
        <ClerkProvider>
          <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <Show when="signed-out">
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
              </Show>
              <Show when="signed-in">
                <UserButton afterSignOutUrl="/" />
              </Show>
            </div>
          </header>
          {children}
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  )
}
