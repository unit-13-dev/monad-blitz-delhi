"use client"

import AppLayout from "@/components/Applayout"
import { Card } from "@/components/ui/card"
import { Trophy, Crown } from "lucide-react"
import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

// Fallback data if API fails


const performanceData = [
  { month: "JAN", wins: 45, losses: 15, draws: 5 },
  { month: "FEB", wins: 52, losses: 12, draws: 4 },
  { month: "MAR", wins: 58, losses: 10, draws: 3 },
  { month: "APR", wins: 62, losses: 8, draws: 2 },
  { month: "MAY", wins: 71, losses: 6, draws: 1 },
  { month: "JUN", wins: 78, losses: 5, draws: 1 },
]

const categoryData = [
  { name: "PITCH EVENTS", value: 35, color: "#FDE047" },
  { name: "RED CARPET", value: 25, color: "#EC4899" },
  { name: "TECH TALKS", value: 22, color: "#06B6D4" },
  { name: "LIVE STREAMS", value: 18, color: "#000000" },
]

const winRateData = [
  { name: "85-100%", value: 1200 },
  { name: "70-84%", value: 2400 },
  { name: "55-69%", value: 3200 },
  { name: "40-54%", value: 2800 },
  { name: "25-39%", value: 1800 },
]

const radarData = [
  { category: "ACCURACY", value: 87 },
  { category: "$MON EARNED", value: 92 },
  { category: "STREAK", value: 95 },
  { category: "NFT COUNT", value: 78 },
  { category: "GAS SAVINGS", value: 88 },
  { category: "CONSISTENCY", value: 84 },
]

interface LeaderboardEntry {
  rank: number
  address?: string
  name: string
  wins: number
  winRate: string
  $monWon: string
  totalBets?: number
  nfts?: string
  streak?: string
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log("📊 Fetching leaderboard data...")
      const response = await fetch("/api/users/leaderboard")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ Loaded ${data.length} leaderboard entries`)
        setLeaderboardData(data)
      } else {
        console.log("⚠️ No leaderboard data available, using fallback")
        // setLeaderboardData(fallbackLeaderboardData)
      }
    } catch (error: any) {
      console.error("❌ Error fetching leaderboard:", error)
      setError(error.message || "Failed to load leaderboard")
      // setLeaderboardData(fallbackLeaderboardData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    
    const interval = setInterval(() => {
      fetchLeaderboard()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-6xl md:text-8xl font-black uppercase mb-8">
            MONAD
            <br />
            <span className="text-yellow-400">LEADERBOARD</span>
          </h1>
          <p className="text-xl font-bold max-w-3xl mx-auto">
            TOP PREDICTORS ON MONAD. COMPETE. WIN $MON. MINT NFTs. DOMINATE.
          </p>
        </div>
      </section>

      {/* Top Rankings Table */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-4xl font-black uppercase mb-12">TOP PREDICTORS</h2>
          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            {loading ? (
              <div className="p-8 text-center font-black">
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-black border-t-transparent"></div>
                  <span>LOADING LEADERBOARD...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="font-black uppercase mb-2 text-red-600">ERROR LOADING LEADERBOARD</div>
                <div className="font-bold text-sm mb-4">{error}</div>
                <button
                  onClick={fetchLeaderboard}
                  className="bg-black text-white border-4 border-black px-4 py-2 font-black uppercase hover:bg-white hover:text-black transition-colors"
                >
                  RETRY
                </button>
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="p-8 text-center font-black">NO PREDICTORS YET. BE THE FIRST!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-400 border-b-4 border-black">
                    <tr>
                      <th className="px-4 py-4 text-left font-black uppercase text-sm">RANK</th>
                      <th className="px-4 py-4 text-left font-black uppercase text-sm">PREDICTOR</th>
                      <th className="px-4 py-4 text-left font-black uppercase text-sm">WINS</th>
                      <th className="px-4 py-4 text-left font-black uppercase text-sm">WIN RATE</th>
                      <th className="px-4 py-4 text-left font-black uppercase text-sm">$MON EARNED</th>
                      <th className="px-4 py-4 text-left font-black uppercase text-sm">TOTAL BETS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((bettor, index) => (
                      <tr 
                        key={bettor.address || index} 
                        className="border-b-2 border-black hover:bg-yellow-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {bettor.rank === 1 && <Crown className="h-5 w-5 text-yellow-500" />}
                            {bettor.rank === 2 && <Trophy className="h-5 w-5 text-gray-400" />}
                            {bettor.rank === 3 && <Trophy className="h-5 w-5 text-orange-600" />}
                            <span className="font-black text-lg">{bettor.rank}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-black uppercase text-sm">{bettor.name}</td>
                        <td className="px-4 py-4 font-black">{bettor.wins}</td>
                        <td className="px-4 py-4 font-bold">{bettor.winRate}</td>
                        <td className="px-4 py-4 font-black text-green-600">${bettor.$monWon}</td>
                        <td className="px-4 py-4 font-bold">{bettor.totalBets || bettor.wins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Analytics Charts */}
      <section className="bg-yellow-400 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-4xl font-black uppercase mb-12">PERFORMANCE ANALYTICS</h2>
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Wins vs Losses Trend */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-white">
              <h3 className="text-2xl font-black uppercase mb-6">WINS VS LOSSES TREND</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="black" strokeWidth={2} />
                  <XAxis dataKey="month" stroke="black" tick={{ fontWeight: "bold" }} />
                  <YAxis stroke="black" tick={{ fontWeight: "bold" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "3px solid black",
                      fontWeight: "bold",
                    }}
                  />
                  <Legend wrapperStyle={{ fontWeight: "bold" }} />
                  <Bar dataKey="wins" fill="#06B6D4" stroke="black" strokeWidth={2} />
                  <Bar dataKey="losses" fill="#EC4899" stroke="black" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Category Distribution */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-white">
              <h3 className="text-2xl font-black uppercase mb-6">BETS BY CATEGORY</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={80}
                    fill="#000000"
                    dataKey="value"
                    stroke="black"
                    strokeWidth={2}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "3px solid black",
                      fontWeight: "bold",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Community Win Rates */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-white">
              <h3 className="text-2xl font-black uppercase mb-6">COMMUNITY WIN RATES</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={winRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="black" strokeWidth={2} />
                  <XAxis
                    dataKey="name"
                    stroke="black"
                    tick={{ fontWeight: "bold", fontSize: 12 }}
                    angle={-45}
                    height={80}
                  />
                  <YAxis stroke="black" tick={{ fontWeight: "bold" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "3px solid black",
                      fontWeight: "bold",
                    }}
                  />
                  <Legend wrapperStyle={{ fontWeight: "bold" }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="black"
                    strokeWidth={3}
                    dot={{ fill: "#FDE047", stroke: "black", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                    name="PREDICTORS"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-white">
              <h3 className="text-2xl font-black uppercase mb-6">TOP PREDICTOR STATS</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="black" strokeWidth={2} />
                  <PolarAngleAxis dataKey="category" tick={{ fontWeight: "bold", fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="black" tick={{ fontWeight: "bold" }} />
                  <Radar
                    name="ALPHA_BETTOR"
                    dataKey="value"
                    stroke="#EC4899"
                    fill="#EC4899"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="text-lg font-black uppercase mb-4">AVG WIN RATE</h3>
              <div className="text-5xl font-black mb-2">73.4%</div>
              <div className="text-sm font-bold">ACROSS ALL PREDICTORS</div>
            </Card>
            <Card className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="text-lg font-black uppercase mb-4">TOTAL $MON POOL</h3>
              <div className="text-5xl font-black mb-2 text-green-600">$50.2M</div>
              <div className="text-sm font-bold">DISTRIBUTED THIS MONTH</div>
            </Card>
            <Card className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="text-lg font-black uppercase mb-4">NFTS MINTED</h3>
              <div className="text-5xl font-black mb-2">847K</div>
              <div className="text-sm font-bold">PREDICTION WINS IMMORTALIZED</div>
            </Card>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
