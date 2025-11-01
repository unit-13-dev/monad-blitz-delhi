"use client"

import { useWalletUser } from "@/hooks/use-wallet-user"
import { useEffect } from "react"

export default function WalletUserProvider({ children }: { children: React.ReactNode }) {

  return <>{children}</>
}

