"use client"

import AppLayout from "@/components/Applayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useTachiContract } from "@/context/TachiContractProvider"
import { useWalletUser } from "@/hooks/use-wallet-user"
import { useState, useEffect } from "react"
import { formatEther } from "@/lib/tachi-contract"
import { ethers } from "ethers"
import { AlertCircle, CheckCircle, Loader2, Shield, RefreshCw } from "lucide-react"

export default function AdminPage() {
  const { contract, readOnlyContract, loading: contractLoading, error: contractError, isConnected, contractAddress } = useTachiContract()
  const { address } = useWalletUser()

  const [question, setQuestion] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("")
  const [betAmount, setBetAmount] = useState("")
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<{ marketId: number; txHash: string } | null>(null)
  const [minBetAmount, setMinBetAmount] = useState<string>("")
  const [maxBetAmount, setMaxBetAmount] = useState<string>("")
  const [maxDuration, setMaxDuration] = useState(3600)
  const [organizerAddress, setOrganizerAddress] = useState<string>("")
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [networkId, setNetworkId] = useState<string>("")

  useEffect(() => {
    async function getNetworkId() {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const chainId = await (window as any).ethereum.request({ method: "eth_chainId" })
          setNetworkId(chainId)
        } catch (err) {
          console.error("Error getting network:", err)
        }
      }
    }
    getNetworkId()
  }, [])

  useEffect(() => {
    async function checkAdmin() {
      if (!readOnlyContract || !address) {
        setCheckingAdmin(false)
        setDebugInfo(`Read-only contract: ${readOnlyContract ? "✓" : "✗"}, Address: ${address || "Not connected"}`)
        return
      }

      try {
        const organizer = await readOnlyContract.getOrganizer()
        const organizerLower = organizer.toLowerCase()
        const addressLower = address.toLowerCase()
        const isAdminUser = organizerLower === addressLower
        
        setOrganizerAddress(organizer)
        setIsAdmin(isAdminUser)
        
        setDebugInfo(
          `Organizer: ${organizer}\n` +
          `Connected: ${address}\n` +
          `Match: ${isAdminUser ? "✓ YES" : "✗ NO"}\n` +
          `Contract: ${readOnlyContract ? "✓ Initialized" : "✗ Not initialized"}\n` +
          `Network ID: ${networkId || "Unknown"}`
        )
        
        if (!isAdminUser) {
          console.warn("⚠️ Admin check failed:", {
            organizer: organizerLower,
            connected: addressLower,
            match: isAdminUser
          })
        }
      } catch (err: any) {
        console.error("Error checking admin status:", err)
        setIsAdmin(false)
        setDebugInfo(`Error: ${err.message || "Failed to check admin status"}`)
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdmin()
  }, [readOnlyContract, address, networkId])

  useEffect(() => {
    async function loadConstants() {
      if (!readOnlyContract) return

      try {
        const min = await readOnlyContract.getMinBetAmount()
        const max = await readOnlyContract.getMaxBetAmount()
        setMinBetAmount(formatEther(min))
        setMaxBetAmount(formatEther(max))
      } catch (err) {
        console.error("Error loading constants:", err)
      }
    }

    loadConstants()
  }, [readOnlyContract])

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contract || !isConnected) {
      setCreateError("Please connect your wallet")
      return
    }

    if (!isAdmin) {
      setCreateError("You are not authorized to create markets")
      return
    }

    if (!question.trim()) {
      setCreateError("Question is required")
      return
    }

    const durationSeconds = parseInt(durationMinutes) * 60
    if (!durationMinutes || durationSeconds <= 0 || durationSeconds > maxDuration) {
      setCreateError(`Duration must be between 1 minute and ${maxDuration / 60} minutes (1 hour)`)
      return
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      setCreateError("Bet amount is required")
      return
    }

    const betAmountWei = ethers.utils.parseEther(betAmount)
    const minWei = ethers.utils.parseEther(minBetAmount || "0.1")
    const maxWei = ethers.utils.parseEther(maxBetAmount || "100")

    if (betAmountWei.lt(minWei)) {
      setCreateError(`Bet amount too low. Minimum: ${minBetAmount} MON`)
      return
    }

    if (betAmountWei.gt(maxWei)) {
      setCreateError(`Bet amount too high. Maximum: ${maxBetAmount} MON`)
      return
    }

    setCreating(true)
    setCreateError(null)
    setCreateSuccess(null)

    try {
      console.log("🚀 Creating market with:", {
        question: question.trim(),
        durationSeconds,
        betAmount,
        contract: contract ? "✓" : "✗",
        isAdmin
      })
      
      const result = await contract.createMarket(question.trim(), durationSeconds, betAmount)
      
      console.log("✅ Market created successfully:", result)
      setCreateSuccess(result)
      setQuestion("")
      setDurationMinutes("")
      setBetAmount("")
    } catch (err: any) {
      console.error("❌ Error creating market:", err)
      
      let errorMessage = "Failed to create market"
      
      if (err.message) {
        errorMessage = err.message
      } else if (err.reason) {
        errorMessage = err.reason
      } else if (err.data?.message) {
        errorMessage = err.data.message
      }
      
      if (errorMessage.includes("Only organizer")) {
        errorMessage = "Only the contract organizer can create markets. Make sure you're using the wallet that deployed the contract."
      } else if (errorMessage.includes("execution reverted")) {
        errorMessage = `Transaction failed: ${errorMessage}. Check console for details.`
      }
      
      setCreateError(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  if (contractLoading || checkingAdmin) {
    return (
      <AppLayout>
        <section className="bg-white min-h-screen py-12">
          <div className="mx-auto max-w-4xl px-4">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 bg-cyan-400">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xl font-black uppercase">LOADING ADMIN PANEL...</span>
              </div>
            </Card>
          </div>
        </section>
      </AppLayout>
    )
  }

  if (!isConnected) {
    return (
      <AppLayout>
        <section className="bg-white min-h-screen py-12">
          <div className="mx-auto max-w-4xl px-4">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 bg-yellow-400">
              <div className="text-center">
                <Shield className="h-16 w-16 mx-auto mb-4" />
                <h1 className="text-3xl font-black uppercase mb-4">WALLET NOT CONNECTED</h1>
                <p className="text-lg font-bold">Please connect your wallet to access the admin panel</p>
              </div>
            </Card>
          </div>
        </section>
      </AppLayout>
    )
  }

  if (isAdmin === false) {
    return (
      <AppLayout>
        <section className="bg-white min-h-screen py-12">
          <div className="mx-auto max-w-4xl px-4 space-y-6">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 bg-red-500">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-white" />
                <h1 className="text-3xl font-black uppercase mb-4 text-white">ACCESS DENIED</h1>
                <p className="text-lg font-bold text-white">You are not authorized to access this page</p>
                <p className="text-sm font-bold text-white mt-4">
                  Only the contract organizer can create markets
                </p>
              </div>
            </Card>
            
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-yellow-400">
              <h3 className="text-xl font-black uppercase mb-4">TROUBLESHOOTING</h3>
              <div className="space-y-3 text-sm font-bold">
                <div>
                  <p className="font-black mb-1">1. Check Contract Address:</p>
                  <p className="font-mono text-xs bg-black text-white p-2 break-all">
                    {contractAddress || "NOT SET"}
                  </p>
                  <p className="text-xs mt-1">Make sure this matches your deployed contract address in .env.local</p>
                </div>
                <div>
                  <p className="font-black mb-1">2. Contract Organizer Address:</p>
                  <p className="font-mono text-xs bg-black text-white p-2 break-all">
                    {organizerAddress || "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="font-black mb-1">3. Your Connected Address:</p>
                  <p className="font-mono text-xs bg-black text-white p-2 break-all">
                    {address || "Not connected"}
                  </p>
                </div>
                <div>
                  <p className="font-black mb-1">4. Network:</p>
                  <p className="font-mono text-xs bg-black text-white p-2">
                    Chain ID: {networkId || "Unknown"}
                  </p>
                  <p className="text-xs mt-1">Make sure you're on the same network where you deployed the contract</p>
                </div>
                {debugInfo && (
                  <div className="mt-4">
                    <p className="font-black mb-2">Debug Info:</p>
                    <pre className="text-xs font-mono bg-black text-green-400 p-3 overflow-auto max-h-32">
                      {debugInfo}
                    </pre>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <section className="bg-white min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-yellow-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8" />
                  <div>
                    <h1 className="text-4xl font-black uppercase">ADMIN PANEL</h1>
                    <p className="text-sm font-bold">CREATE NEW BETTING MARKETS</p>
                  </div>
                </div>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  REFRESH
                </Button>
              </div>
            </Card>
          </div>

          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-cyan-400">
            <h2 className="text-3xl font-black uppercase mb-6">CREATE NEW MARKET</h2>

            <form onSubmit={handleCreateMarket} className="space-y-6">
              <div>
                <Label htmlFor="question" className="text-lg font-black uppercase mb-2 block">
                  BETTING QUESTION
                </Label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., WILL THE FOUNDER STUTTER MORE THAN TWICE DURING THE PITCH?"
                  className="border-4 border-black bg-white font-bold text-lg p-4 min-h-[100px] resize-none"
                  required
                />
                <p className="text-sm font-bold mt-2 text-gray-700">
                  Enter the question that users will bet on
                </p>
              </div>

              <div>
                <Label htmlFor="duration" className="text-lg font-black uppercase mb-2 block">
                  DURATION (MINUTES)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="e.g., 30"
                  min="1"
                  max={maxDuration / 60}
                  className="border-4 border-black bg-white font-bold text-lg p-4"
                  required
                />
                <p className="text-sm font-bold mt-2 text-gray-700">
                  Market duration in minutes (Max: {maxDuration / 60} minutes / 1 hour)
                </p>
              </div>

              <div>
                <Label htmlFor="betAmount" className="text-lg font-black uppercase mb-2 block">
                  BET AMOUNT (MON)
                </Label>
                <Input
                  id="betAmount"
                  type="number"
                  step="0.001"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder={`e.g., ${minBetAmount || "0.1"}`}
                  min={minBetAmount}
                  max={maxBetAmount}
                  className="border-4 border-black bg-white font-bold text-lg p-4"
                  required
                />
                <p className="text-sm font-bold mt-2 text-gray-700">
                  Amount each user must bet (Min: {minBetAmount} MON, Max: {maxBetAmount} MON)
                </p>
              </div>

              {createError && (
                <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 bg-red-500">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-white" />
                    <p className="font-black uppercase text-white">{createError}</p>
                  </div>
                </Card>
              )}

              {createSuccess && (
                <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 bg-green-500">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-white mt-1" />
                    <div>
                      <p className="font-black uppercase text-white mb-2">
                        MARKET CREATED SUCCESSFULLY!
                      </p>
                      <p className="text-sm font-bold text-white">
                        Market ID: <span className="font-black">{createSuccess.marketId}</span>
                      </p>
                      <p className="text-sm font-bold text-white">
                        Transaction: <span className="font-black">{createSuccess.txHash.slice(0, 10)}...</span>
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <Button
                type="submit"
                disabled={creating || !contract}
                className="w-full bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase text-xl py-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    CREATING MARKET...
                  </div>
                ) : (
                  "CREATE MARKET"
                )}
              </Button>
            </form>
          </Card>

          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-pink-500 mt-6">
            <h3 className="text-2xl font-black uppercase mb-4">ADMIN INFORMATION</h3>
            <div className="space-y-2 text-sm font-bold">
              <div className="flex justify-between">
                <span>Connected Address:</span>
                <span className="font-mono">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</span>
              </div>
              <div className="flex justify-between">
                <span>Contract Organizer:</span>
                <span className="font-mono">{organizerAddress ? `${organizerAddress.slice(0, 6)}...${organizerAddress.slice(-4)}` : "Loading..."}</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Status:</span>
                <span className={isAdmin ? "text-green-600 font-black" : isAdmin === false ? "text-red-600 font-black" : "text-gray-600"}>
                  {isAdmin === null ? "Checking..." : isAdmin ? "✓ AUTHORIZED" : "✗ NOT AUTHORIZED"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Contract Address:</span>
                  <span className="font-mono text-xs">{contractAddress || "Not set"}</span>
                </div>
                {contractAddress && (
                  <div className="text-xs font-bold text-gray-600 break-all">
                    {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <span>Contract Ready:</span>
                <span className={contract ? "text-green-600 font-black" : "text-red-600 font-black"}>
                  {contract ? "✓ YES" : "✗ NO"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Min Bet Amount:</span>
                <span>{minBetAmount || "Loading..."} MON</span>
              </div>
              <div className="flex justify-between">
                <span>Max Bet Amount:</span>
                <span>{maxBetAmount || "Loading..."} MON</span>
              </div>
              <div className="flex justify-between">
                <span>Max Duration:</span>
                <span>{maxDuration / 60} minutes</span>
              </div>
            </div>
          </Card>

          {contractError && (
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-red-500 mt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-white" />
                <p className="font-black uppercase text-white">
                  Contract Error: {contractError}
                </p>
              </div>
            </Card>
          )}
        </div>
      </section>
    </AppLayout>
  )
}

