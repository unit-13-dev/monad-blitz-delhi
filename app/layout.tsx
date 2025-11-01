import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AppKit } from '@/context/Appkit'
import { TachiContractProvider } from '@/context/TachiContractProvider'

export const metadata: Metadata = {
  title: 'Tachi - MicroBets Prediction Market',
  description: 'Tachi is a microbets prediction market platform built on the Monad blockchain.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <TachiContractProvider contractAddress={process.env.NEXT_PUBLIC_TACHI_CONTRACT_ADDRESS || ''} readOnlyRpcUrl={process.env.NEXT_PUBLIC_MONAD_RPC_URL}>
        <AppKit>{children}</AppKit>
        <Analytics />
        </TachiContractProvider>
      </body>
    </html>
  )
}
