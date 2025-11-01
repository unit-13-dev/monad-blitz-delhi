"use client"

  import { useEffect, useState, useCallback } from "react"
import { useAppKitAccount } from "@reown/appkit/react"
import { ethers } from "ethers"

interface User {
  id: string
  walletAddress: string
  username: string
  wins: number
  losses: number
  winRate: number
  monWon: string
  nfts: number
  streak: number
  streakType: string
  balance: string
  balanceUpdatedAt: string | null
  createdAt: string
  updatedAt: string
}

export function useWalletUser() {
  const { address, isConnected } = useAppKitAccount()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>("0")
  const [balanceLoading, setBalanceLoading] = useState(false)

  // Function to fetch balance directly from wallet/AppKit
  const fetchBalanceFromWallet = useCallback(async (walletAddress: string): Promise<string> => {
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new ethers.providers.Web3Provider((window as any).ethereum)
        const balance = await provider.getBalance(walletAddress)
        const balanceStr = balance.toString()
        return balanceStr
      } else {
        throw new Error("No wallet provider available")
      }
    } catch (error) {
      console.error("❌ Error fetching balance from wallet:", error)
      throw error
    }
  }, [])

  const updateBalance = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return
    
    setBalanceLoading(true)
    try {
      // Fetch balance directly from wallet
      const freshBalance = await fetchBalanceFromWallet(walletAddress)
      setBalance(freshBalance)
      
      // Update in database (async, don't wait)
      fetch("/api/users/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress }),
      }).catch((err) => {
        console.error("❌ Failed to save balance to DB:", err)
        // Don't throw - we still have the fresh balance from wallet
      })
      
      // Update user state with new balance
      setUser((prevUser) => {
        if (prevUser) {
          return {
            ...prevUser,
            balance: freshBalance,
            balanceUpdatedAt: new Date().toISOString(),
          }
        }
        return prevUser
      })
    } catch (error) {
      console.error("❌ Error updating balance:", error)
    } finally {
      setBalanceLoading(false)
    }
  }, [fetchBalanceFromWallet])

  // Fetch or create user when wallet connects
  useEffect(() => {
    if (!isConnected || !address) {
      setUser(null)
      return
    }

    const fetchOrCreateUser = async () => {
      setLoading(true)
      setError(null)

      try {
        const checkResponse = await fetch(`/api/users?walletAddress=${address}`)
        
        if (checkResponse.ok) {
          const userData = await checkResponse.json()
          setUser(userData)
        } else if (checkResponse.status === 404) {
          const createResponse = await fetch("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ walletAddress: address }),
          })

          
          if (createResponse.ok) {
            const newUser = await createResponse.json()
            setUser(newUser)
          } else {
            const errorData = await createResponse.json().catch(() => ({ error: "Unknown error" }))
            console.error("❌ Failed to create user:", errorData)
            throw new Error(errorData.error || "Failed to create user")
          }
        } else {
          const errorText = await checkResponse.text().catch(() => "Unknown error")
          console.error("❌ Unexpected response status:", checkResponse.status, errorText)
          throw new Error("Failed to fetch user")
        }
      } catch (err) {
        console.error("❌ Error fetching/creating user:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchOrCreateUser()
  }, [isConnected, address])

  // Fetch balance directly from wallet when address changes
  useEffect(() => {
    if (isConnected && address) {
      // Initial balance fetch
      updateBalance(address)
    } else {
      setBalance("0")
    }
  }, [isConnected, address, updateBalance])

  // Periodic balance updates from wallet (every 30 seconds)
  useEffect(() => {
    if (!isConnected || !address) return

    const interval = setInterval(() => {
      updateBalance(address)
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [isConnected, address, updateBalance])

  return {
    user,
    loading,
    error,
    isConnected,
    address,
    balance, // Live balance from wallet
    balanceLoading,
    updateBalance: () => address && updateBalance(address),
  }
}

