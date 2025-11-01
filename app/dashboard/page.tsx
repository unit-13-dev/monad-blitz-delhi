"use client"

import AppLayout from "@/components/Applayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, Send, Copy, LogOut } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState } from "react"
import { useWalletUser } from "@/hooks/use-wallet-user"
import { useAppKitAccount, useDisconnect } from "@reown/appkit/react"

const portfolioData = [
  { date: "MON", balance: 1200 },
  { date: "TUE", balance: 1450 },
  { date: "WED", balance: 1320 },
  { date: "THU", balance: 1680 },
  { date: "FRI", balance: 1890 },
  { date: "SAT", balance: 2150 },
  { date: "SUN", balance: 2340 },
]

const recentBets = [
  {
    event: "PITCH EVENT: WILL PITCH EXCEED 5 MIN",
    status: "WON",
    amount: "+$45.20",
    timestamp: "2h ago",
    color: "bg-green-100",
  },
  {
    event: "RED CARPET: STUMBLE PREDICTION",
    status: "LOST",
    amount: "-$12.50",
    timestamp: "5h ago",
    color: "bg-red-100",
  },
  { event: "TECH TALK: STUTTER COUNT", status: "WON", amount: "+$67.80", timestamp: "1d ago", color: "bg-green-100" },
  {
    event: "LIVE STREAM: CHAT SPAM ALERT",
    status: "WON",
    amount: "+$23.45",
    timestamp: "2d ago",
    color: "bg-green-100",
  },
]

const activePositions = [
  { event: "UPCOMING PITCH EVENT", wager: "$50", odds: "2.5x", expires: "30 min", status: "ACTIVE" },
  { event: "TECH CONFERENCE KEYNOTE", wager: "$75", odds: "1.8x", expires: "2h 15m", status: "ACTIVE" },
  { event: "AWARDS CEREMONY LIVE", wager: "$100", odds: "3.2x", expires: "5h", status: "ACTIVE" },
]

export default function DashboardPage() {
  const [copied, setCopied] = useState(false)
  const { user, loading: userLoading, address, balance: walletBalance, balanceLoading } = useWalletUser()
  const { isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return "Not Connected"
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }


  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="bg-black text-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl md:text-6xl font-black uppercase mb-4">
                {user?.username ? `${user.username}'S WALLET` : "YOUR MONAD WALLET"}
              </h1>
              <p className="text-xl font-bold">
                {isConnected ? "CONNECTED. BETTING. WINNING." : "CONNECT YOUR WALLET"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wallet Info */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-cyan-400">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-black uppercase mb-2">
                  {user?.username ? `USERNAME: ${user.username}` : "CONNECTED WALLET"}
                </h2>
                <div className="bg-white border-4 border-black p-4 rounded-none font-mono text-sm font-black mb-4 flex items-center justify-between">
                  <span>{address}</span>
                  {address && (
                    <button
                      onClick={copyAddress}
                      className="hover:bg-yellow-400 p-2 transition-colors"
                      title="Copy full address"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {copied && <p className="text-sm font-bold text-green-700">COPIED!</p>}
                {isConnected && (
                  <Button
                    onClick={handleDisconnect}
                    className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    DISCONNECT
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                  <div className="text-sm font-bold uppercase mb-2">$MON BALANCE</div>
                  <div className="text-3xl font-black">
                    {balanceLoading || !isConnected ? "..." : (
                      <span>
                        {walletBalance && parseFloat(walletBalance) > 0
                          ? (parseFloat(walletBalance) / 1e18).toFixed(4)
                          : "0.0000"}
                      </span>
                    )}
                  </div>
                  {/* <div className="text-xs font-bold mt-2">≈ ${user ? (Number(user.monWon) * 8).toLocaleString() : "0"}</div> */}
                </Card>
                <Card className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                  <div className="text-sm font-bold uppercase mb-2">WIN RATE</div>
                  <div className="text-3xl font-black text-green-600">
                    {userLoading ? "..." : user ? `${user.winRate.toFixed(0)}%` : "0%"}
                  </div>
                  <div className="text-xs font-bold mt-2">{user ? `${user.wins} WINS` : "NO WINS YET"}</div>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Portfolio Value Chart */}
      <section className="bg-yellow-400 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 bg-white">
            <h2 className="text-3xl font-black uppercase mb-8">PORTFOLIO VALUE (7 DAYS)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={portfolioData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="black" strokeWidth={2} />
                <XAxis dataKey="date" stroke="black" tick={{ fontWeight: "bold" }} />
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </section>

      {/* Active Positions & Recent Bets */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Active Positions */}
            <div>
              <h2 className="text-3xl font-black uppercase mb-8">ACTIVE POSITIONS</h2>
              <div className="space-y-4">
                {activePositions.map((position, index) => (
                  <Card
                    key={index}
                    className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-black uppercase text-sm mb-2">{position.event}</h3>
                        <div className="flex gap-4 text-xs font-bold uppercase">
                          <span className="bg-cyan-400 border-2 border-black px-2 py-1">WAGER: {position.wager}</span>
                          <span className="bg-yellow-400 border-2 border-black px-2 py-1">ODDS: {position.odds}</span>
                        </div>
                      </div>
                      <span className="bg-green-400 border-3 border-black px-3 py-1 font-black text-xs">LIVE</span>
                    </div>
                    <div className="mt-4 text-xs font-bold uppercase text-gray-600">EXPIRES: {position.expires}</div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Bets */}
            <div>
              <h2 className="text-3xl font-black uppercase mb-8">RECENT ACTIVITY</h2>
              <div className="space-y-4">
                {recentBets.map((bet, index) => (
                  <Card
                    key={index}
                    className={`border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 ${bet.color}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-black uppercase text-sm mb-2">{bet.event}</h3>
                        <div className="text-xs font-bold uppercase text-gray-600">{bet.timestamp}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black mb-1">{bet.amount}</div>
                        <span
                          className={`border-2 border-black px-2 py-1 font-black text-xs ${bet.status === "WON" ? "bg-green-300" : "bg-red-300"
                            }`}
                        >
                          {bet.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="bg-pink-500 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Send, label: "PLACE BET", href: "/live-event" },
              { icon: TrendingUp, label: "VIEW PORTFOLIO", href: "#" },
              { icon: Wallet, label: "MANAGE NFTs", href: "/nfts" },
            ].map((action, index) => (
              <Button
                key={index}
                className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase text-lg px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-auto flex flex-col items-center gap-3"
              >
                <action.icon className="h-8 w-8" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
