"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { useAppKitAccount } from "@reown/appkit/react"
import { ethers } from "ethers"
import { TachiContract, getTachiContractReadOnly } from "@/lib/tachi-contract"

interface TachiContractContextType {
  contract: TachiContract | null
  readOnlyContract: TachiContract | null
  loading: boolean
  error: string | null
  isConnected: boolean
  contractAddress: string
  refresh: () => void
}

const TachiContractContext = createContext<TachiContractContextType | undefined>(undefined)

interface TachiContractProviderProps {
  children: ReactNode
  contractAddress: string
  readOnlyRpcUrl?: string
}

export function TachiContractProvider({
  children,
  contractAddress,
  readOnlyRpcUrl,
}: TachiContractProviderProps) {
  const { address, isConnected } = useAppKitAccount()
  const [contract, setContract] = useState<TachiContract | null>(null)
  const [readOnlyContract, setReadOnlyContract] = useState<TachiContract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!contractAddress) {
      setError("Contract address not provided")
      setLoading(false)
      return
    }

    try {
      if (readOnlyRpcUrl) {
        const readOnly = getTachiContractReadOnly(contractAddress, readOnlyRpcUrl)
        setReadOnlyContract(readOnly)
      } else {
        if (typeof window !== "undefined" && (window as any).ethereum) {
          try {
            const provider = new ethers.providers.Web3Provider((window as any).ethereum)
            const readOnly = new TachiContract(contractAddress, provider)
            setReadOnlyContract(readOnly)
          } catch (err) {
            console.warn("Could not initialize read-only contract")
          }
        }
      }
    } catch (err) {
      console.error("Error initializing read-only contract:", err)
    }
  }, [contractAddress, readOnlyRpcUrl])

  const initializeContract = useCallback(async () => {
    if (!isConnected || !address || !contractAddress) {
      setContract(null)
      setLoading(false)
      return
    }

    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("Wallet provider not available")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const ethersProvider = new ethers.providers.Web3Provider((window as any).ethereum)
      const signer = ethersProvider.getSigner(address)
      const contractInstance = new TachiContract(contractAddress, signer)
      setContract(contractInstance)
      setError(null)
    } catch (err: any) {
      console.error("Error initializing Tachi contract:", err)
      setError(err.message || "Failed to initialize contract")
      setContract(null)
    } finally {
      setLoading(false)
    }
  }, [isConnected, address, contractAddress])

  useEffect(() => {
    initializeContract()
  }, [initializeContract])

  const refresh = useCallback(() => {
    initializeContract()
  }, [initializeContract])

  const value: TachiContractContextType = {
    contract,
    readOnlyContract,
    loading,
    error,
    isConnected: !!isConnected && !!address,
    contractAddress: contractAddress || "",
    refresh,
  }

  return <TachiContractContext.Provider value={value}>{children}</TachiContractContext.Provider>
}

export function useTachiContract(): TachiContractContextType {
  const context = useContext(TachiContractContext)
  if (context === undefined) {
    throw new Error("useTachiContract must be used within a TachiContractProvider")
  }
  return context
}

