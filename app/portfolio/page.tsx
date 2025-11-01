"use client"

import AppLayout from "@/components/Applayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, PieChartIcon, BarChart3, Activity } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const monthlyPerformance = [
  { month: "JAN", balance: 5000, $mon: 1200, nfts: 12 },
  { month: "FEB", balance: 6200, $mon: 1450, nfts: 18 },
  { month: "MAR", balance: 7100, $mon: 1680, nfts: 22 },
  { month: "APR", balance: 8900, $mon: 2100, nfts: 28 },
  { month: "MAY", balance: 11200, $mon: 2650, nfts: 34 },
  { month: "JUN", balance: 15200, $mon: 3600, nfts: 47 },
]

const assetAllocation = [
  { name: "$MON TOKENS", value: 45, color: "#06B6D4" },
  { name: "STAKED $MON", value: 30, color: "#FDE047" },
  { name: "NFTS VALUE", value: 20, color: "#EC4899" },
  { name: "STABLE COINS", value: 5, color: "#000000" },
]

const nftBreakdown = [
  { category: "PREDICTION WINS", count: 34, value: 3400, avgPrice: 100 },
  { category: "SEASON BADGES", count: 8, value: 2240, avgPrice: 280 },
  { category: "MONAD GENESIS", count: 1, value: 2450, avgPrice: 2450 },
  { category: "STREAK BADGES", count: 4, value: 1280, avgPrice: 320 },
]

const topPositions = [
  { asset: "$MON", amount: "3,645", value: "$29,160", change: "+12.5%", color: "bg-cyan-100" },
  { asset: "GENESIS NFT #42", amount: "1", value: "$2,450", change: "+8.3%", color: "bg-yellow-100" },
  { asset: "STAKED $MON", amount: "2,200", value: "$17,600", change: "+15.2%", color: "bg-pink-100" },
  { asset: "PREDICTION WINS", amount: "34", value: "$3,400", change: "+5.6%", color: "bg-green-100" },
]

export default function PortfolioPage() {
  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl md:text-7xl font-black uppercase mb-4">YOUR PORTFOLIO</h1>
              <p className="text-xl font-bold">TRACK YOUR ASSETS. ANALYZE PERFORMANCE. OPTIMIZE RETURNS.</p>
            </div>
            <Activity className="h-24 w-24 text-cyan-400" />
          </div>
        </div>
      </section>

      {/* Portfolio Overview */}
      <section className="bg-cyan-400 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: "TOTAL VALUE", value: "$55,410", change: "+135%" },
              { label: "$MON BALANCE", value: "3,645", change: "+203%" },
              { label: "NFT PORTFOLIO", value: "$9,370", change: "+285%" },
              { label: "MONTHLY GAIN", value: "+$4,000", change: "+35%" },
            ].map((stat, index) => (
              <Card key={index} className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white p-6">
                <div className="text-sm font-bold uppercase mb-2 text-gray-600">{stat.label}</div>
                <div className="text-3xl font-black mb-2">{stat.value}</div>
                <div className="text-sm font-bold text-green-600">{stat.change}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Chart */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 mb-12 bg-white">
            <h2 className="text-3xl font-black uppercase mb-8">6-MONTH PERFORMANCE</h2>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={monthlyPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#000000"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                  name="PORTFOLIO VALUE"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Asset Allocation */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-yellow-400">
              <h2 className="text-3xl font-black uppercase mb-8">ASSET ALLOCATION</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assetAllocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={90}
                    fill="#000000"
                    dataKey="value"
                    stroke="black"
                    strokeWidth={2}
                  >
                    {assetAllocation.map((entry, index) => (
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

            {/* Top Positions */}
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase">TOP POSITIONS</h2>
              {topPositions.map((position, index) => (
                <Card
                  key={index}
                  className={`border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 ${position.color}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black uppercase text-sm mb-2">{position.asset}</h3>
                      <div className="text-sm font-bold">{position.amount}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black">{position.value}</div>
                      <div className="text-sm font-bold text-green-600">{position.change}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NFT Breakdown */}
      <section className="bg-pink-500 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-4xl font-black uppercase mb-12 text-white">NFT PORTFOLIO BREAKDOWN</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {nftBreakdown.map((nft, index) => (
              <Card key={index} className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white p-6">
                <h3 className="text-lg font-black uppercase mb-4">{nft.category}</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-gray-600">COUNT</div>
                    <div className="text-3xl font-black">{nft.count}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-gray-600">TOTAL VALUE</div>
                    <div className="text-2xl font-black text-green-600">${nft.value}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-gray-600">AVG PRICE</div>
                    <div className="text-lg font-bold">${nft.avgPrice}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Action Section */}
      <section className="bg-yellow-400 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, label: "PLACE BET", desc: "ADD TO YOUR PORTFOLIO", href: "/live-event" },
              { icon: PieChartIcon, label: "VIEW ANALYTICS", desc: "DEEP DIVE INTO PERFORMANCE", href: "#" },
              { icon: BarChart3, label: "EXPORT DATA", desc: "DOWNLOAD PORTFOLIO REPORT", href: "#" },
            ].map((action, index) => (
              <Card
                key={index}
                className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 bg-white text-center hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <action.icon className="h-12 w-12 mx-auto mb-4 text-black" />
                <h3 className="text-xl font-black uppercase mb-2">{action.label}</h3>
                <p className="text-sm font-bold mb-6 text-gray-700">{action.desc}</p>
                <Button className="w-full bg-black text-white border-3 border-black hover:bg-yellow-400 hover:text-black font-black uppercase">
                  GO
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
