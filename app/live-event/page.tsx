"use client"

import AppLayout from "@/components/Applayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useTachiContract } from "@/context/TachiContractProvider"
import { useWalletUser } from "@/hooks/use-wallet-user"
import { useState, useEffect, useCallback } from "react"
import { formatEther, formatTimeRemaining, calculateOdds, MarketData } from "@/lib/tachi-contract"
import { ethers } from "ethers"
import { useAppKitAccount } from "@reown/appkit/react"

interface RecentBet {
  username: string
  address: string
  choice: "YES" | "NO"
  amount: string
  timestamp: string
}

interface LeaderboardEntry {
  rank: number
  address: string
  username: string
  totalBets: number
  wins: number
  winRate: string
}

export default function LiveEventPage() {
  const { contract, readOnlyContract, loading: contractLoading, isConnected } = useTachiContract()
  const { address, user, balance: walletBalance } = useWalletUser()
  const { isConnected: walletConnected } = useAppKitAccount()
  
  const [marketId, setMarketId] = useState<number | null>(null)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [marketStatus, setMarketStatus] = useState<any>(null)
  const [userBet, setUserBet] = useState<any>(null)
  const [recentBets, setRecentBets] = useState<RecentBet[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [question, setQuestion] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [betError, setBetError] = useState<string | null>(null)
  const [betSuccess, setBetSuccess] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [availableMarkets, setAvailableMarkets] = useState<number[]>([])
  const [validatingAmount, setValidatingAmount] = useState(false)

  const fetchAvailableMarkets = useCallback(async () => {
    if (!readOnlyContract) return

    try {
      const marketCount = await readOnlyContract.getMarketCount()
      const markets: number[] = []
      
      for (let i = 0; i < marketCount; i++) {
        try {
          const status = await readOnlyContract.getMarketStatus(i)
          if (!status.isResolved || !status.isBettingClosed) {
            markets.push(i)
          }
        } catch {
          continue
        }
      }
      
      setAvailableMarkets(markets.reverse())
    } catch (err) {
      console.error("Error fetching available markets:", err)
    }
  }, [readOnlyContract])

  const fetchLatestMarket = useCallback(async () => {
    if (!readOnlyContract) return

    try {
      const marketCount = await readOnlyContract.getMarketCount()
      if (marketCount === 0) {
        setLoading(false)
        return
      }

      const targetMarketId = marketId !== null && marketId < marketCount ? marketId : marketCount - 1
      if (marketId === null || marketId >= marketCount) {
        setMarketId(targetMarketId)
      }
      
      const [market, status] = await Promise.all([
        readOnlyContract.getMarket(targetMarketId),
        readOnlyContract.getMarketStatus(targetMarketId),
      ])

      setMarketData(market)
      setMarketStatus(status)

      if (status.isBettingOpen && !market.resolved) {
        const remaining = formatTimeRemaining(status.secondsRemaining)
        setTimeRemaining(remaining)
      } else {
        setTimeRemaining("Closed")
      }

        const questionText = market.question || status.question || `Market #${targetMarketId}`
      setQuestion(questionText)

      if (address) {
        try {
          const bet = await readOnlyContract.getUserBet(targetMarketId, address)
          setUserBet(bet)
        } catch (err) {
          console.error("Error fetching user bet:", err)
        }
      }
    } catch (err) {
      console.error("Error fetching market:", err)
    } finally {
      setLoading(false)
    }
  }, [readOnlyContract, address, marketId])

  const fetchRecentBets = useCallback(async () => {
    if (!marketId || !readOnlyContract) return

    try {
      const contractInstance = readOnlyContract.getContract()
      const filter = contractInstance.filters.BetPlaced(marketId)
      const events = await contractInstance.queryFilter(filter)
      
      const betsData: RecentBet[] = []
      
      for (let i = events.length - 1; i >= Math.max(0, events.length - 20); i--) {
        const event = events[i]
        const participantAddress = event.args?.user || event.args?.[1]
        const prediction = event.args?.prediction || event.args?.[2]
        const amount = event.args?.amount || event.args?.[3]
        
        if (!participantAddress) continue
        
        try {
          const userResponse = await fetch(`/api/users?walletAddress=${participantAddress}`)
          let username = `${participantAddress.slice(0, 6)}...${participantAddress.slice(-4)}`
          
          if (userResponse.ok) {
            const userData = await userResponse.json()
            username = userData.username || username
          }
          
          betsData.push({
            username,
            address: participantAddress,
            choice: prediction ? "YES" : "NO",
            amount: formatEther(amount?.toString() || "0"),
            timestamp: new Date((event.blockNumber || 0) * 1000).toISOString(),
          })
        } catch (err) {
          continue
        }
      }

      setRecentBets(betsData.slice(0, 10))
    } catch (err) {
      console.error("Error fetching recent bets:", err)
    }
  }, [marketId, readOnlyContract])

  const fetchLeaderboard = useCallback(async () => {
    if (!readOnlyContract) return

    try {
      const participants = await readOnlyContract.getAllParticipants()
      
      const leaderboardData: LeaderboardEntry[] = []
      
      for (const participantAddress of participants) {
        try {
          const stats = await readOnlyContract.getUserStats(participantAddress)
          if (stats.totalBets > 0) {
            const userResponse = await fetch(`/api/users?walletAddress=${participantAddress}`)
            let username = `${participantAddress.slice(0, 6)}...${participantAddress.slice(-4)}`
            
            if (userResponse.ok) {
              const userData = await userResponse.json()
              username = userData.username || username
            }

            leaderboardData.push({
              rank: 0,
              address: participantAddress,
              username,
              totalBets: stats.totalBets,
              wins: stats.wonBets,
              winRate: stats.totalBets > 0 ? `${((stats.wonBets * 100) / stats.totalBets).toFixed(0)}%` : "0%",
            })
          }
        } catch (err) {
          continue
        }
      }

      leaderboardData.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.totalBets - a.totalBets
      })

      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1
      })

      setLeaderboard(leaderboardData.slice(0, 20))
    } catch (err) {
      console.error("Error fetching leaderboard:", err)
    }
  }, [readOnlyContract])

  useEffect(() => {
    fetchAvailableMarkets()
  }, [fetchAvailableMarkets])

  useEffect(() => {
    fetchLatestMarket()
  }, [fetchLatestMarket])

  useEffect(() => {
    if (marketId !== null) {
      fetchRecentBets()
      const interval = setInterval(() => {
        fetchRecentBets()
        fetchLatestMarket()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [marketId, fetchRecentBets, fetchLatestMarket])

  useEffect(() => {
    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [fetchLeaderboard])

  useEffect(() => {
    if (marketStatus && marketStatus.isBettingOpen) {
      const interval = setInterval(() => {
        if (readOnlyContract && marketId !== null) {
          readOnlyContract.getMarketStatus(marketId).then((status) => {
            setMarketStatus(status)
            setTimeRemaining(formatTimeRemaining(status.secondsRemaining))
          })
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [marketStatus, readOnlyContract, marketId])

  const handlePlaceBet = async (prediction: boolean) => {
    if (!contract || !isConnected || marketId === null) {
      setBetError("Please connect your wallet")
      return
    }

    if (!walletConnected || !address) {
      setBetError("Wallet not connected. Please connect your wallet first.")
      return
    }

    if (userBet?.hasBet) {
      setBetError("You have already placed a bet on this market")
      return
    }

    if (!marketStatus?.isBettingOpen) {
      setBetError("Betting is closed for this market")
      return
    }

    setPlacing(true)
    setValidatingAmount(true)
    setBetError(null)
    setBetSuccess(false)

    try {
      console.log("🎲 Starting bet placement process...", {
        marketId,
        prediction: prediction ? "YES" : "NO",
        userAddress: address,
      })

      if (!readOnlyContract) {
        throw new Error("Contract not initialized")
      }

      const currentTimestamp = await readOnlyContract.getCurrentTimestamp()
      console.log("⏰ Current blockchain time:", new Date(currentTimestamp * 1000).toISOString())

      const freshMarketStatus = await readOnlyContract.getMarketStatus(marketId)
      console.log("📊 Fresh market status:", {
        isBettingOpen: freshMarketStatus.isBettingOpen,
        isBettingClosed: freshMarketStatus.isBettingClosed,
        isResolved: freshMarketStatus.isResolved,
        secondsRemaining: freshMarketStatus.secondsRemaining,
      })

      if (!freshMarketStatus.isBettingOpen || freshMarketStatus.isBettingClosed) {
        throw new Error("Betting is closed for this market. Please refresh and try another market.")
      }

      const freshMarket = await readOnlyContract.getMarket(marketId)
      const requiredBetAmount = ethers.BigNumber.from(freshMarket.betAmount)
      const requiredBetAmountFormatted = formatEther(requiredBetAmount)
      
      console.log("💰 Required bet amount:", {
        wei: requiredBetAmount.toString(),
        formatted: `${requiredBetAmountFormatted} MON`,
      })

      if (walletBalance) {
        const userBalance = ethers.BigNumber.from(walletBalance)
        console.log("💵 User wallet balance:", {
          wei: userBalance.toString(),
          formatted: `${formatEther(userBalance)} MON`,
        })

        if (userBalance.lt(requiredBetAmount)) {
          const shortfall = requiredBetAmount.sub(userBalance)
          throw new Error(
            `Insufficient balance. Required: ${requiredBetAmountFormatted} MON, Your balance: ${formatEther(userBalance)} MON. Shortfall: ${formatEther(shortfall)} MON`
          )
        }
      }

      const freshUserBet = await readOnlyContract.getUserBet(marketId, address)
      if (freshUserBet.hasBet) {
        throw new Error("You have already placed a bet on this market")
      }

      console.log("✅ Pre-transaction validation passed")
      console.log("🚀 Sending transaction with:", {
        marketId,
        prediction,
        value: requiredBetAmount.toString(),
        valueFormatted: `${requiredBetAmountFormatted} MON`,
      })

      setValidatingAmount(false)

      console.log("📡 Calling contract.placeBet...")
      const txHash = await contract.placeBet(marketId, prediction)
      
      console.log("✅ Bet placed successfully! Transaction hash:", txHash)
      setBetSuccess(true)
      
      setTimeout(() => {
        fetchLatestMarket()
        fetchRecentBets()
        if (address) {
          readOnlyContract?.getUserBet(marketId, address).then(setUserBet).catch(console.error)
        }
      }, 2000)
    } catch (err: any) {
      console.error("❌ Error placing bet:", err)
      console.error("Error details:", {
        message: err.message,
        reason: err.reason,
        code: err.code,
        data: err.data,
        error: err.error,
      })

      let errorMsg = "Failed to place bet"
      let isKnownError = false

      if (err.message) {
        errorMsg = err.message
      } else if (err.reason) {
        errorMsg = err.reason
      } else if (err.data?.message) {
        errorMsg = err.data.message
      } else if (err.error?.message) {
        errorMsg = err.error.message
      }

      const errorString = JSON.stringify(err).toLowerCase()

      if (errorString.includes("already bet") || errorString.includes("already placed")) {
        errorMsg = "You have already placed a bet on this market"
        isKnownError = true
      } else if (errorString.includes("betting closed") || errorString.includes("betting time ended")) {
        errorMsg = "Betting is closed for this market. Please refresh and try another market."
        isKnownError = true
      } else if (errorString.includes("betting window still open")) {
        errorMsg = "Contract error: Betting window is still open (this is a known contract issue). Please wait a moment and try again, or contact support."
        isKnownError = true
      } else if (errorString.includes("incorrect bet amount") || errorString.includes("bet amount")) {
        errorMsg = `Incorrect bet amount. Required: ${marketData ? formatEther(marketData.betAmount) : "?"} MON. Please refresh and try again.`
        isKnownError = true
      } else if (errorString.includes("insufficient") || errorString.includes("balance")) {
        errorMsg = err.message || "Insufficient balance. Please check your wallet balance."
        isKnownError = true
      } else if (errorString.includes("user rejected") || errorString.includes("user denied")) {
        errorMsg = "Transaction rejected. Please approve the transaction in your wallet."
        isKnownError = true
      } else if (errorString.includes("gas") || errorString.includes("unpredictable_gas_limit")) {
        const revertReason = err.reason || err.data?.message || err.error?.data?.message
        if (revertReason) {
          errorMsg = revertReason
        } else if (errorString.includes("betting window still open") || errorString.includes("betting time ended")) {
          errorMsg = "Betting time has ended for this market. Please refresh and try another market."
        } else if (errorString.includes("betting closed") || errorString.includes("already closed")) {
          errorMsg = "Betting is closed for this market. Please refresh and try another market."
        } else {
          errorMsg = "Transaction failed. Please ensure you have enough balance for gas fees and the bet amount."
        }
        isKnownError = true
      } else if (errorString.includes("execution reverted")) {
        const revertReason = err.reason || err.data?.message || err.error?.data?.message || err.error?.message
        if (revertReason) {
          errorMsg = revertReason
        } else {
          errorMsg = "Transaction was reverted by the contract. Please check the market status and try again."
        }
        isKnownError = true
      } else if (!isKnownError) {
        errorMsg = `Transaction failed: ${errorMsg}. Please check your wallet and try again.`
      }
      
      setBetError(errorMsg)
    } finally {
      setPlacing(false)
      setValidatingAmount(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  if (contractLoading || loading) {
    return (
      <AppLayout>
        <section className="bg-white min-h-screen py-12">
          <div className="mx-auto max-w-7xl px-4">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 bg-cyan-400">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xl font-black uppercase">LOADING MARKET DATA...</span>
              </div>
            </Card>
          </div>
        </section>
      </AppLayout>
    )
  }

  if (!marketData || marketId === null) {
    return (
      <AppLayout>
        <section className="bg-white min-h-screen py-12">
          <div className="mx-auto max-w-7xl px-4">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 bg-yellow-400">
              <div className="text-center">
                <h1 className="text-3xl font-black uppercase mb-4">NO ACTIVE MARKETS</h1>
                <p className="text-lg font-bold">There are no markets available at the moment</p>
                <p className="text-sm font-bold mt-4">Create a market in the admin panel to get started</p>
              </div>
            </Card>
          </div>
        </section>
      </AppLayout>
    )
  }

  const totalPool = ethers.BigNumber.from(marketData.yesPool).add(ethers.BigNumber.from(marketData.noPool))
  const odds = calculateOdds(marketData.yesPool, marketData.noPool, totalPool.toString())
  const totalBets = marketData.participantCount
  const betAmountFormatted = formatEther(marketData.betAmount)

  return (
    <AppLayout>
      <section className="bg-white min-h-screen py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-[65%] space-y-6">
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-cyan-400">
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-sm font-black uppercase bg-yellow-400 border-2 border-black px-3 py-1 w-fit">
                      MARKET #{marketId}
                    </div>
                    {availableMarkets.length > 1 && (
                      <select
                        value={marketId || ""}
                        onChange={(e) => {
                          const newMarketId = parseInt(e.target.value)
                          setMarketId(newMarketId)
                          setLoading(true)
                        }}
                        className="border-4 border-black bg-white font-black uppercase text-sm px-3 py-1 cursor-pointer"
                      >
                        {availableMarkets.map((id) => (
                          <option key={id} value={id}>
                            Market #{id}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <h1 className="text-4xl font-black uppercase mb-4 mt-4">
                    {marketData?.question || question || `Market #${marketId}`}
                  </h1>
                  <div className="flex items-center gap-4 text-sm font-bold">
                    <span className="bg-white border-2 border-black px-3 py-1">
                      TOTAL BETS: {totalBets}
                    </span>
                    <span className="bg-white border-2 border-black px-3 py-1">
                      TIME LEFT: {timeRemaining}
                    </span>
                    <span className="bg-white border-2 border-black px-3 py-1">
                      BET AMOUNT: {betAmountFormatted} MON
                    </span>
                  </div>
                </div>

                {betError && (
                  <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 bg-red-500 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-white" />
                      <p className="font-black uppercase text-white text-sm">{betError}</p>
                    </div>
                  </Card>
                )}

                {betSuccess && (
                  <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 bg-green-500 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-white" />
                      <p className="font-black uppercase text-white text-sm">BET PLACED SUCCESSFULLY!</p>
                    </div>
                  </Card>
                )}

                {userBet?.hasBet && (
                  <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 bg-yellow-300 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-black" />
                      <p className="font-black uppercase text-black">
                        You bet: {userBet.prediction ? "YES" : "NO"} - {formatEther(userBet.amount)} MON
                      </p>
                  </div>
                  </Card>
                )}

                <div className="mt-6 p-4 bg-yellow-100 border-4 border-black">
                  <div className="text-sm font-black uppercase mb-2">BETTING INFORMATION</div>
                  <div className="space-y-1 text-xs font-bold">
                    <div className="flex justify-between">
                      <span>Required Amount:</span>
                      <span className="font-black">{betAmountFormatted} MON</span>
                    </div>
                    {walletBalance && (
                      <div className="flex justify-between">
                        <span>Your Balance:</span>
                        <span className={parseFloat(walletBalance) >= parseFloat(marketData?.betAmount || "0") ? "text-green-600 font-black" : "text-red-600 font-black"}>
                          {formatEther(walletBalance)} MON
                        </span>
                      </div>
                    )}
                    {walletBalance && parseFloat(walletBalance) < parseFloat(marketData?.betAmount || "0") && (
                      <div className="text-red-600 font-black mt-2">
                        ⚠️ Insufficient balance for this bet
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <Button
                    onClick={() => handlePlaceBet(true)}
                    disabled={
                      placing || 
                      validatingAmount ||
                      !isConnected || 
                      !walletConnected ||
                      userBet?.hasBet || 
                      !marketStatus?.isBettingOpen ||
                      (walletBalance && parseFloat(walletBalance) < parseFloat(marketData?.betAmount || "0"))
                    }
                    className="bg-green-500 hover:bg-green-600 text-white border-4 border-black font-black uppercase text-xl py-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {placing || validatingAmount ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{validatingAmount ? "Validating..." : "Placing..."}</span>
                      </div>
                    ) : (
                      <>
                        YES
                        <div className="text-sm font-bold mt-1">Odds: {odds.yesOdds.toFixed(2)}x</div>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handlePlaceBet(false)}
                    disabled={
                      placing || 
                      validatingAmount ||
                      !isConnected || 
                      !walletConnected ||
                      userBet?.hasBet || 
                      !marketStatus?.isBettingOpen ||
                      (walletBalance && parseFloat(walletBalance) < parseFloat(marketData?.betAmount || "0"))
                    }
                    className="bg-red-500 hover:bg-red-600 text-white border-4 border-black font-black uppercase text-xl py-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {placing || validatingAmount ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{validatingAmount ? "Validating..." : "Placing..."}</span>
                      </div>
                    ) : (
                      <>
                        NO
                        <div className="text-sm font-bold mt-1">Odds: {odds.noOdds.toFixed(2)}x</div>
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <Card className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                    <div className="text-sm font-bold uppercase mb-2">YES POOL</div>
                    <div className="text-2xl font-black text-green-600">
                      {formatEther(marketData.yesPool)} MON
                    </div>
                  </Card>
                  <Card className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                    <div className="text-sm font-bold uppercase mb-2">NO POOL</div>
                    <div className="text-2xl font-black text-red-600">
                      {formatEther(marketData.noPool)} MON
                    </div>
                  </Card>
                </div>
              </Card>

              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-white">
                <h2 className="text-2xl font-black uppercase mb-6">RECENT BETS</h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {recentBets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 font-bold">
                      No bets placed yet. Be the first!
                    </div>
                  ) : (
                    recentBets.map((bet, index) => (
                      <Card
                        key={`${bet.address}-${index}`}
                        className={`border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 ${
                          bet.choice === "YES" ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-black uppercase text-sm mb-1">{bet.username}</div>
                            <div className="text-xs font-bold text-gray-600">
                              {formatTimestamp(bet.timestamp)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-lg mb-1">{bet.amount} MON</div>
                            <span
                              className={`border-2 border-black px-3 py-1 font-black text-xs ${
                                bet.choice === "YES" ? "bg-green-300" : "bg-red-300"
                              }`}
                            >
                              {bet.choice}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <div className="lg:w-[35%]">
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-yellow-400">
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="h-6 w-6" />
                  <h2 className="text-3xl font-black uppercase">LEADERBOARD</h2>
                </div>

                <div className="bg-white border-4 border-black overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-pink-500 border-b-4 border-black">
                        <tr>
                          <th className="px-3 py-3 text-left font-black uppercase text-xs">RANK</th>
                          <th className="px-3 py-3 text-left font-black uppercase text-xs">USER</th>
                          <th className="px-3 py-3 text-left font-black uppercase text-xs">BETS</th>
                          <th className="px-3 py-3 text-left font-black uppercase text-xs">WINS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-sm font-bold text-gray-500">
                              No participants yet
                            </td>
                          </tr>
                        ) : (
                          leaderboard.map((entry) => (
                            <tr
                              key={entry.address}
                              className={`border-b-2 border-black ${
                                entry.rank <= 3 ? "bg-yellow-50" : "bg-white"
                              } hover:bg-yellow-100 transition-colors`}
                            >
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  {entry.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                                  {entry.rank === 2 && <Trophy className="h-4 w-4 text-gray-400" />}
                                  {entry.rank === 3 && <Trophy className="h-4 w-4 text-orange-600" />}
                                  <span className="font-black text-sm">{entry.rank}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 font-black uppercase text-xs">{entry.username}</td>
                              <td className="px-3 py-3 font-black">{entry.totalBets}</td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-green-600">{entry.wins}</span>
                                  <span className="text-xs font-bold text-gray-600">({entry.winRate})</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Card className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 text-center">
                    <div className="text-xs font-bold uppercase text-gray-600 mb-1">ACTIVE</div>
                    <div className="text-2xl font-black">{leaderboard.length}</div>
                    <div className="text-xs font-bold">TACHI</div>
                  </Card>
                  <Card className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 text-center">
                    <div className="text-xs font-bold uppercase text-gray-600 mb-1">TOTAL</div>
                    <div className="text-2xl font-black">
                      {leaderboard.reduce((sum, entry) => sum + entry.totalBets, 0)}
                    </div>
                    <div className="text-xs font-bold">BETS</div>
                  </Card>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
