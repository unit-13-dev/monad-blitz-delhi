"use client"

import AppLayout from "@/components/Applayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Clock, Users, ArrowRight, TrendingUp, Zap } from "lucide-react"
import { useTachiContract } from "@/context/TachiContractProvider"
import { useWalletUser } from "@/hooks/use-wallet-user"
import { useState, useEffect, useCallback, useRef } from "react"
import { formatEther, formatTimeRemaining, MarketData } from "@/lib/tachi-contract"
import { ethers } from "ethers"
import Link from "next/link"

interface MarketListItem {
  id: number
  question: string
  status: {
    isBettingOpen: boolean
    isBettingClosed: boolean
    isResolved: boolean
    secondsRemaining: number
  }
  data: MarketData
  totalPool: string
  participantCount: number
  betAmount: string
}

export default function LiveEventMarketplacePage() {
  const { readOnlyContract, loading: contractLoading } = useTachiContract()
  const { address } = useWalletUser()
  
  const [markets, setMarkets] = useState<MarketListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userBets, setUserBets] = useState<Record<number, { hasBet: boolean; prediction: boolean }>>({})
  const previousMarketIdsRef = useRef<string>("")

  const fetchAllMarkets = useCallback(async () => {
    if (!readOnlyContract) return

    try {
      setLoading(true)
      const marketCount = await readOnlyContract.getMarketCount()
      
      if (marketCount === 0) {
        setMarkets([])
        setLoading(false)
        return
      }

      const marketsData: MarketListItem[] = []
      
      for (let i = 0; i < marketCount; i++) {
        try {
          const [market, status] = await Promise.all([
            readOnlyContract.getMarket(i),
            readOnlyContract.getMarketStatus(i),
          ])

          const totalPool = ethers.BigNumber.from(market.yesPool)
            .add(ethers.BigNumber.from(market.noPool))

          marketsData.push({
            id: i,
            question: market.question || `Market #${i}`,
            status,
            data: market,
            totalPool: formatEther(totalPool.toString()),
            participantCount: market.participantCount,
            betAmount: formatEther(market.betAmount),
          })
        } catch (err) {
          console.warn(`Error fetching market ${i}:`, err)
          continue
        }
      }

      marketsData.sort((a, b) => b.id - a.id)
      setMarkets(marketsData)
    } catch (err) {
      console.error("Error fetching markets:", err)
    } finally {
      setLoading(false)
    }
  }, [readOnlyContract])

  useEffect(() => {
    fetchAllMarkets()
  }, [fetchAllMarkets])

  useEffect(() => {
    // Only fetch user bets if markets actually changed (by ID comparison) or address changed
    if (markets.length > 0 && address && readOnlyContract) {
      const marketIds = markets.map(m => m.id).sort().join(',')
      const currentAddress = address.toLowerCase()
      const previousKey = previousMarketIdsRef.current
      
      // Check if market IDs or address changed
      const prevIds = previousKey.split(':')[0] || ""
      const prevAddress = previousKey.split(':')[1] || ""
      const keyChanged = marketIds !== prevIds || currentAddress !== prevAddress
      
      if (keyChanged) {
        previousMarketIdsRef.current = `${marketIds}:${currentAddress}`
        
        // Fetch user bets inline to avoid dependency issues
        const fetchBets = async () => {
          try {
            const bets: Record<number, { hasBet: boolean; prediction: boolean }> = {}
            for (const market of markets) {
              try {
                const userBet = await readOnlyContract.getUserBet(market.id, address)
                if (userBet.hasBet) {
                  bets[market.id] = {
                    hasBet: true,
                    prediction: userBet.prediction,
                  }
                }
              } catch (err) {
                continue
              }
            }
            setUserBets(bets)
          } catch (err) {
            console.error("Error fetching user bets:", err)
          }
        }
        fetchBets()
      }
    } else if (!address) {
      // Clear user bets if address is not available
      setUserBets({})
      previousMarketIdsRef.current = ""
    }
  }, [markets, address, readOnlyContract])

  useEffect(() => {
    if (!readOnlyContract) return
    
    const interval = setInterval(() => {
      if (readOnlyContract) {
        fetchAllMarkets()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [readOnlyContract])

  if (contractLoading || loading) {
    return (
      <AppLayout>
        <section className="bg-white min-h-screen py-12">
          <div className="mx-auto max-w-7xl px-4">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 bg-cyan-400">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xl font-black uppercase">LOADING MARKETS...</span>
              </div>
            </Card>
          </div>
        </section>
      </AppLayout>
    )
  }

  const activeMarkets = markets.filter(m => m.status.isBettingOpen && !m.data.resolved)
  const closedMarkets = markets.filter(m => m.status.isBettingClosed || m.data.resolved)

  return (
    <AppLayout>
      <section className="bg-white min-h-screen py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8">
            <h1 className="text-5xl font-black uppercase mb-4">LIVE MARKETS</h1>
            <p className="text-lg font-bold text-gray-700">
              Browse all active prediction markets and place your bets
            </p>
          </div>

          {markets.length === 0 ? (
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 bg-yellow-400">
              <div className="text-center">
                <h2 className="text-3xl font-black uppercase mb-4">NO MARKETS AVAILABLE</h2>
                <p className="text-lg font-bold">There are no markets available at the moment</p>
                <p className="text-sm font-bold mt-4">Create a market in the admin panel to get started</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-8">
              {activeMarkets.length > 0 && (
                <div>
                  <h2 className="text-3xl font-black uppercase mb-6 bg-green-400 border-4 border-black px-4 py-2 inline-block">
                    ACTIVE MARKETS ({activeMarkets.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeMarkets.map((market) => (
                      <MarketCard
                        key={market.id}
                        market={market}
                        userBet={userBets[market.id]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {closedMarkets.length > 0 && (
                <div>
                  <h2 className="text-3xl font-black uppercase mb-6 bg-gray-400 border-4 border-black px-4 py-2 inline-block">
                    CLOSED MARKETS ({closedMarkets.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {closedMarkets.map((market) => (
                      <MarketCard
                        key={market.id}
                        market={market}
                        userBet={userBets[market.id]}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-3xl font-black uppercase mb-6 bg-pink-400 border-4 border-black px-4 py-2 inline-flex items-center gap-2">
                  <TrendingUp className="h-8 w-8" />
                  ALL MARKETS ({markets.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {markets.map((market) => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      userBet={userBets[market.id]}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  )
}

interface MarketCardProps {
  market: MarketListItem
  userBet?: { hasBet: boolean; prediction: boolean }
}

function MarketCard({ market, userBet }: MarketCardProps) {
  const timeRemaining = market.status.isBettingOpen && !market.data.resolved
    ? formatTimeRemaining(market.status.secondsRemaining)
    : market.data.resolved
    ? "Resolved"
    : "Closed"

  const yesPool = formatEther(market.data.yesPool)
  const noPool = formatEther(market.data.noPool)
  const isActive = market.status.isBettingOpen && !market.data.resolved

  return (
    <Card className={`border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
      isActive ? "bg-cyan-400" : "bg-gray-200"
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`text-sm font-black uppercase border-2 border-black px-3 py-1 ${
          isActive ? "bg-yellow-400" : "bg-gray-300"
        }`}>
          MARKET #{market.id}
        </div>
        {userBet?.hasBet && (
          <div className={`text-xs font-black uppercase px-2 py-1 border-2 border-black ${
            userBet.prediction ? "bg-green-300" : "bg-red-300"
          }`}>
            {userBet.prediction ? "YES" : "NO"}
          </div>
        )}
        {isActive && (
          <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 border-2 border-black">
            <Zap className="h-3 w-3" />
            <span className="text-xs font-black">LIVE</span>
          </div>
        )}
      </div>

      <h3 className="text-xl font-black uppercase mb-4 line-clamp-2 min-h-[3rem]">
        {market.question}
      </h3>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Clock className="h-4 w-4" />
          <span>{timeRemaining}</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <Users className="h-4 w-4" />
          <span>{market.participantCount} Participants</span>
        </div>
        <div className="text-sm font-bold">
          Bet Amount: <span className="font-black">{market.betAmount} MON</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-100 border-2 border-black p-2">
            <div className="font-bold">YES</div>
            <div className="font-black text-green-600">{yesPool} MON</div>
          </div>
          <div className="bg-red-100 border-2 border-black p-2">
            <div className="font-bold">NO</div>
            <div className="font-black text-red-600">{noPool} MON</div>
          </div>
        </div>
        <div className="bg-white border-2 border-black p-2 text-center">
          <div className="text-xs font-bold text-gray-600">TOTAL POOL</div>
          <div className="text-lg font-black">{market.totalPool} MON</div>
        </div>
      </div>

      <Link href={`/live-event/${market.id}`}>
        <Button className="w-full bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
          <span>{isActive ? "PLACE BET" : "VIEW MARKET"}</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </Card>
  )
}
