"use client"

import AppLayout from "@/components/Applayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useTachiContract } from "@/context/TachiContractProvider"
import { useWalletUser } from "@/hooks/use-wallet-user"
import { useState, useEffect, useCallback } from "react"
import { formatEther, MarketData } from "@/lib/tachi-contract"
import { ethers } from "ethers"
import { AlertCircle, CheckCircle, Loader2, Shield, RefreshCw, Gavel, Clock } from "lucide-react"

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
  const [closedMarkets, setClosedMarkets] = useState<Array<{ id: number; data: MarketData; status: any }>>([])
  const [loadingClosedMarkets, setLoadingClosedMarkets] = useState(false)
  const [resolvingMarketId, setResolvingMarketId] = useState<number | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [resolveSuccess, setResolveSuccess] = useState<string | null>(null)
  const [selectedOutcome, setSelectedOutcome] = useState<Record<number, boolean | null>>({})
  const [manualMarketId, setManualMarketId] = useState<string>("")
  const [manualOutcome, setManualOutcome] = useState<boolean | null>(null)
  const [loadingMarketInfo, setLoadingMarketInfo] = useState(false)
  const [marketInfo, setMarketInfo] = useState<{ data: MarketData; status: any } | null>(null)
  const [manualResolving, setManualResolving] = useState(false)

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

  const fetchClosedMarkets = useCallback(async () => {
    if (!readOnlyContract) return

    try {
      setLoadingClosedMarkets(true)
      const marketCount = await readOnlyContract.getMarketCount()
      const markets: Array<{ id: number; data: MarketData; status: any }> = []

      for (let i = 0; i < marketCount; i++) {
        try {
          const [market, status] = await Promise.all([
            readOnlyContract.getMarket(i),
            readOnlyContract.getMarketStatus(i),
          ])

          if (status.isBettingClosed && !market.resolved) {
            markets.push({
              id: i,
              data: market,
              status,
            })
          }
        } catch (err) {
          continue
        }
      }

      markets.sort((a, b) => b.id - a.id)
      setClosedMarkets(markets)
    } catch (err) {
      console.error("Error fetching closed markets:", err)
    } finally {
      setLoadingClosedMarkets(false)
    }
  }, [readOnlyContract])

  useEffect(() => {
    if (isAdmin) {
      fetchClosedMarkets()
      const interval = setInterval(fetchClosedMarkets, 30000)
      return () => clearInterval(interval)
    }
  }, [isAdmin, fetchClosedMarkets])

  const handleResolveMarket = async (marketId: number) => {
    if (!contract || !isConnected) {
      setResolveError("Please connect your wallet")
      return
    }

    if (!isAdmin) {
      setResolveError("You are not authorized to resolve markets")
      return
    }

    const outcome = selectedOutcome[marketId]
    if (outcome === null || outcome === undefined) {
      setResolveError("Please select an outcome (YES or NO)")
      return
    }

    setResolvingMarketId(marketId)
    setResolveError(null)
    setResolveSuccess(null)

    try {
      console.log("🔨 Resolving market:", {
        marketId,
        outcome: outcome ? "YES" : "NO",
      })

      const txHash = await contract.resolveMarket(marketId, outcome)

      console.log("✅ Market resolved successfully:", txHash)
      setResolveSuccess(`Market ${marketId} resolved as ${outcome ? "YES" : "NO"}. TX: ${txHash.slice(0, 10)}...`)

      setTimeout(() => {
        fetchClosedMarkets()
        setSelectedOutcome((prev) => {
          const next = { ...prev }
          delete next[marketId]
          return next
        })
        setResolveSuccess(null)
      }, 3000)
    } catch (err: any) {
      console.error("❌ Error resolving market:", err)

      let errorMessage = "Failed to resolve market"

      if (err.message) {
        errorMessage = err.message
      } else if (err.reason) {
        errorMessage = err.reason
      } else if (err.data?.message) {
        errorMessage = err.data.message
      }

      if (errorMessage.includes("Already resolved")) {
        errorMessage = "This market has already been resolved"
      } else if (errorMessage.includes("Betting window not ended")) {
        errorMessage = "Cannot resolve market: betting window has not ended yet"
      } else if (errorMessage.includes("Only organizer")) {
        errorMessage = "Only the contract organizer can resolve markets"
      }

      setResolveError(errorMessage)
    } finally {
      setResolvingMarketId(null)
    }
  }

  const fetchMarketInfo = async (marketId: number) => {
    if (!readOnlyContract) {
      setResolveError("Contract not initialized")
      return
    }

    try {
      setLoadingMarketInfo(true)
      setMarketInfo(null)
      setResolveError(null)

      const marketCount = await readOnlyContract.getMarketCount()
      if (marketId >= marketCount) {
        setResolveError(`Market #${marketId} does not exist`)
        return
      }

      const [market, status] = await Promise.all([
        readOnlyContract.getMarket(marketId),
        readOnlyContract.getMarketStatus(marketId),
      ])

      setMarketInfo({ data: market, status })
    } catch (err: any) {
      console.error("Error fetching market info:", err)
      setResolveError(err.message || "Failed to fetch market information")
    } finally {
      setLoadingMarketInfo(false)
    }
  }

  const handleManualResolve = async () => {
    if (!contract || !isConnected) {
      setResolveError("Please connect your wallet")
      return
    }

    if (!isAdmin) {
      setResolveError("You are not authorized to resolve markets")
      return
    }

    const marketId = parseInt(manualMarketId)
    if (isNaN(marketId) || marketId < 0) {
      setResolveError("Please enter a valid market ID")
      return
    }

    if (manualOutcome === null) {
      setResolveError("Please select an outcome (YES or NO)")
      return
    }

    if (!marketInfo) {
      setResolveError("Please load market information first")
      return
    }

    if (!marketInfo.status.isBettingClosed) {
      setResolveError("Market is not closed yet. Cannot resolve.")
      return
    }

    if (marketInfo.data.resolved) {
      setResolveError("Market is already resolved")
      return
    }

    setManualResolving(true)
    setResolveError(null)
    setResolveSuccess(null)

    try {
      console.log("🔨 Manually resolving market:", {
        marketId,
        outcome: manualOutcome ? "YES" : "NO",
      })

      const txHash = await contract.resolveMarket(marketId, manualOutcome)

      console.log("✅ Market resolved successfully:", txHash)
      setResolveSuccess(`Market #${marketId} resolved as ${manualOutcome ? "YES" : "NO"}. TX: ${txHash.slice(0, 10)}...`)

      setTimeout(() => {
        setManualMarketId("")
        setManualOutcome(null)
        setMarketInfo(null)
        fetchClosedMarkets()
        setResolveSuccess(null)
      }, 3000)
    } catch (err: any) {
      console.error("❌ Error resolving market:", err)

      let errorMessage = "Failed to resolve market"

      if (err.message) {
        errorMessage = err.message
      } else if (err.reason) {
        errorMessage = err.reason
      } else if (err.data?.message) {
        errorMessage = err.data.message
      }

      if (errorMessage.includes("Already resolved")) {
        errorMessage = "This market has already been resolved"
      } else if (errorMessage.includes("Betting window not ended")) {
        errorMessage = "Cannot resolve market: betting window has not ended yet"
      } else if (errorMessage.includes("Only organizer")) {
        errorMessage = "Only the contract organizer can resolve markets"
      }

      setResolveError(errorMessage)
    } finally {
      setManualResolving(false)
    }
  }

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

          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-orange-400 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <Gavel className="h-8 w-8" />
              <h2 className="text-3xl font-black uppercase">RESOLVE MARKET BY ID</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="marketId" className="text-lg font-black uppercase mb-2 block">
                  MARKET ID
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="marketId"
                    type="number"
                    value={manualMarketId}
                    onChange={(e) => setManualMarketId(e.target.value)}
                    placeholder="Enter market ID (e.g., 0, 1, 2...)"
                    className="border-4 border-black bg-white font-bold text-lg p-4 flex-1"
                  />
                  <Button
                    onClick={() => {
                      const id = parseInt(manualMarketId)
                      if (!isNaN(id) && id >= 0) {
                        fetchMarketInfo(id)
                      } else {
                        setResolveError("Please enter a valid market ID")
                      }
                    }}
                    disabled={loadingMarketInfo || !readOnlyContract}
                    className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {loadingMarketInfo ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "LOAD MARKET"
                    )}
                  </Button>
                </div>
              </div>

              {marketInfo && (
                <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 bg-white">
                  <div className="mb-4">
                    <div className="text-sm font-black uppercase bg-orange-300 border-2 border-black px-3 py-1 inline-block mb-2">
                      MARKET #{manualMarketId}
                    </div>
                    <h3 className="text-xl font-black uppercase mt-2">{marketInfo.data.question}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-100 border-2 border-black p-3">
                      <div className="text-xs font-bold mb-1">YES POOL</div>
                      <div className="text-lg font-black text-green-600">
                        {formatEther(marketInfo.data.yesPool)} MON
                      </div>
                    </div>
                    <div className="bg-red-100 border-2 border-black p-3">
                      <div className="text-xs font-bold mb-1">NO POOL</div>
                      <div className="text-lg font-black text-red-600">
                        {formatEther(marketInfo.data.noPool)} MON
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-gray-100 border-2 border-black">
                    <div className="text-xs font-bold mb-1">STATUS</div>
                    <div className="text-sm font-black">
                      {marketInfo.data.resolved ? (
                        <span className="text-red-600">✓ Already Resolved ({marketInfo.data.outcome ? "YES" : "NO"})</span>
                      ) : marketInfo.status.isBettingClosed ? (
                        <span className="text-orange-600">✓ Closed - Ready to Resolve</span>
                      ) : (
                        <span className="text-yellow-600">⚠ Still Open</span>
                      )}
                    </div>
                    <div className="text-xs font-bold mt-2">
                      Participants: {marketInfo.data.participantCount}
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label className="text-sm font-black uppercase mb-2 block">
                      SELECT OUTCOME
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        onClick={() => setManualOutcome(true)}
                        disabled={manualResolving || marketInfo.data.resolved}
                        className={`border-4 border-black font-black uppercase ${
                          manualOutcome === true
                            ? "bg-green-500 text-white"
                            : "bg-green-100 text-black hover:bg-green-300"
                        } shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50`}
                      >
                        YES
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setManualOutcome(false)}
                        disabled={manualResolving || marketInfo.data.resolved}
                        className={`border-4 border-black font-black uppercase ${
                          manualOutcome === false
                            ? "bg-red-500 text-white"
                            : "bg-red-100 text-black hover:bg-red-300"
                        } shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50`}
                      >
                        NO
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleManualResolve}
                    disabled={
                      manualResolving ||
                      !contract ||
                      manualOutcome === null ||
                      marketInfo.data.resolved ||
                      !marketInfo.status.isBettingClosed
                    }
                    className="w-full bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {manualResolving ? (
                      <div className="flex items-center gap-2 justify-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        RESOLVING MARKET...
                      </div>
                    ) : (
                      `RESOLVE AS ${manualOutcome === true ? "YES" : manualOutcome === false ? "NO" : "..."}`
                    )}
                  </Button>
                </Card>
              )}

              {resolveError && (
                <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 bg-red-500">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-white" />
                    <p className="font-black uppercase text-white text-sm">{resolveError}</p>
                  </div>
                </Card>
              )}

              {resolveSuccess && (
                <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 bg-green-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-white" />
                    <p className="font-black uppercase text-white text-sm">{resolveSuccess}</p>
                  </div>
                </Card>
              )}
            </div>
          </Card>

          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-purple-400 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <Gavel className="h-8 w-8" />
              <h2 className="text-3xl font-black uppercase">RESOLVE CLOSED MARKETS</h2>
            </div>

            {resolveError && (
              <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 bg-red-500 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-white" />
                  <p className="font-black uppercase text-white text-sm">{resolveError}</p>
                </div>
              </Card>
            )}

            {resolveSuccess && (
              <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 bg-green-500 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-white" />
                  <p className="font-black uppercase text-white text-sm">{resolveSuccess}</p>
                </div>
              </Card>
            )}

            {loadingClosedMarkets ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xl font-black uppercase">LOADING CLOSED MARKETS...</span>
              </div>
            ) : closedMarkets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg font-bold">No closed markets available for resolution</p>
                <p className="text-sm font-bold text-gray-600 mt-2">
                  Markets will appear here once betting is closed and time has expired
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {closedMarkets.map((marketItem) => {
                  const market = marketItem.data
                  const status = marketItem.status
                  const totalPool = ethers.BigNumber.from(market.yesPool).add(ethers.BigNumber.from(market.noPool))
                  const isResolving = resolvingMarketId === marketItem.id

                  return (
                    <Card
                      key={marketItem.id}
                      className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 bg-white"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-sm font-black uppercase bg-purple-300 border-2 border-black px-3 py-1 inline-block mb-2">
                            MARKET #{marketItem.id}
                          </div>
                          <h3 className="text-xl font-black uppercase mt-2">{market.question}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <Clock className="h-4 w-4" />
                          <span>CLOSED</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-100 border-2 border-black p-3">
                          <div className="text-xs font-bold mb-1">YES POOL</div>
                          <div className="text-lg font-black text-green-600">
                            {formatEther(market.yesPool)} MON
                          </div>
                        </div>
                        <div className="bg-red-100 border-2 border-black p-3">
                          <div className="text-xs font-bold mb-1">NO POOL</div>
                          <div className="text-lg font-black text-red-600">
                            {formatEther(market.noPool)} MON
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 p-3 bg-gray-100 border-2 border-black">
                        <div className="text-xs font-bold mb-1">TOTAL POOL</div>
                        <div className="text-xl font-black">{formatEther(totalPool.toString())} MON</div>
                        <div className="text-xs font-bold mt-2">
                          Participants: {market.participantCount}
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label className="text-sm font-black uppercase mb-2 block">
                          SELECT OUTCOME
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            onClick={() =>
                              setSelectedOutcome((prev) => ({
                                ...prev,
                                [marketItem.id]: true,
                              }))
                            }
                            disabled={isResolving}
                            className={`border-4 border-black font-black uppercase ${
                              selectedOutcome[marketItem.id] === true
                                ? "bg-green-500 text-white"
                                : "bg-green-100 text-black hover:bg-green-300"
                            } shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50`}
                          >
                            YES
                          </Button>
                          <Button
                            type="button"
                            onClick={() =>
                              setSelectedOutcome((prev) => ({
                                ...prev,
                                [marketItem.id]: false,
                              }))
                            }
                            disabled={isResolving}
                            className={`border-4 border-black font-black uppercase ${
                              selectedOutcome[marketItem.id] === false
                                ? "bg-red-500 text-white"
                                : "bg-red-100 text-black hover:bg-red-300"
                            } shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50`}
                          >
                            NO
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleResolveMarket(marketItem.id)}
                        disabled={
                          isResolving ||
                          !contract ||
                          selectedOutcome[marketItem.id] === null ||
                          selectedOutcome[marketItem.id] === undefined
                        }
                        className="w-full bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResolving ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            RESOLVING MARKET...
                          </div>
                        ) : (
                          `RESOLVE AS ${selectedOutcome[marketItem.id] === true ? "YES" : selectedOutcome[marketItem.id] === false ? "NO" : "..."}`
                        )}
                      </Button>
                    </Card>
                  )
                })}
              </div>
            )}
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

