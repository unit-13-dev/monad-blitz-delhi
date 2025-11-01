"use client"

import type React from "react"
import LandingHeader from "@/components/LandingHeader"
import AppHeader from "@/components/AppHeader"
import WalletUserProvider from "@/components/WalletUserProvider"
import { TachiContractProvider } from "@/context/TachiContractProvider"

interface LayoutProps {
  children: React.ReactNode
  isLanding?: boolean
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TACHI_CONTRACT_ADDRESS || ""

export default function AppLayout({ children, isLanding }: LayoutProps) {
  return (
    <WalletUserProvider>
      <TachiContractProvider
        contractAddress={CONTRACT_ADDRESS}
        readOnlyRpcUrl={process.env.NEXT_PUBLIC_MONAD_RPC_URL}
      >
        <div className="min-h-screen bg-white">
          {isLanding ? <LandingHeader /> : <AppHeader />}
          {children}
          <footer className="bg-black text-white border-t-4 border-white py-12">
            <div className="mx-auto max-w-6xl px-4">
              <div className="border-t-4 border-white mt-6 pt-2 text-center font-bold uppercase">
                © 2025 TACHI - PREDICT. EARN. WIN. POWERED BY MONAD BLOCKCHAIN
              </div>
            </div>
          </footer>
        </div>
      </TachiContractProvider>
    </WalletUserProvider>
  )
}
