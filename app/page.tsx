"use client"

import AppLayout from "@/components/Applayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Zap, Trophy, Bolt } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  const handleLaunchApp = () => {
    router.push("/dashboard")
  }

  return (
    <AppLayout isLanding={true}>
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-sm font-black uppercase mb-4 bg-cyan-400 border-2 border-black p-2 w-fit">
                POWERED BY MONAD
              </div>
              <h1 className="text-6xl md:text-8xl font-black uppercase leading-none mb-6">
                MICRO BETS
                <br />
                <span className="text-pink-500">ON MONAD</span>
                <br />
                CHAIN
              </h1>
              <p className="text-xl font-bold mb-8 max-w-lg">
                PREDICT THE UNPREDICTABLE. TURN YOUR INSTINCTS INTO $MON TOKENS WITH HYPER-LOCAL BETTING.
                LIGHTNING-FAST. LOW GAS. HIGH REWARDS.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div >
                  <Button className="bg-pink-500 text-white border-4 border-black hover:bg-black font-black uppercase text-lg px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" onClick={handleLaunchApp}>
                    Launch App
                  </Button>
                </div>
                {/* <Link href="/live-event">
                  <Button
                    variant="outline"
                    className="border-4 border-black bg-white text-black hover:bg-yellow-400 font-black uppercase text-lg px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  >
                    HOW IT WORKS
                  </Button>
                </Link> */}
              </div>
            </div>
            <div className="relative">
              <div className="bg-cyan-400 border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform rotate-2">
                <div className="bg-white border-4 border-black p-6 transform -rotate-1">
                  <div className="text-2xl font-black uppercase mb-2">MONAD SPEED</div>
                  <div className="text-4xl font-black mb-4">10,000 TPS</div>
                  <div className="font-bold uppercase text-sm">INSTANT SETTLEMENTS</div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-yellow-400 border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-12">
                <Bolt className="h-8 w-8" fill="black" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-black text-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-5xl font-black uppercase text-center mb-16">
            WHY <span className="text-yellow-400">TACHI?</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Bolt,
                title: "MONAD SPEED",
                description: "10,000 TPS SETTLEMENT. BETS RESOLVED IN MILLISECONDS. NO DELAYS. PURE SPEED.",
                color: "bg-yellow-400",
              },
              {
                icon: Trophy,
                title: "EARN $MON TOKENS",
                description: "WIN PREDICTIONS. EARN $MON REWARDS. STAKE FOR HIGHER MULTIPLIERS. GROW YOUR BAG.",
                color: "bg-pink-500",
              },
              {
                icon: Zap,
                title: "GAS-OPTIMIZED",
                description: "NEAR-ZERO GAS FEES ON MONAD. MICRO BETS. MAXIMUM RETURNS. KEEP YOUR PROFITS.",
                color: "bg-cyan-400",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`${feature.color} border-4 border-white p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transform hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all`}
              >
                <feature.icon className="h-12 w-12 mb-4 text-black" />
                <h3 className="text-2xl font-black uppercase mb-4 text-black">{feature.title}</h3>
                <p className="font-bold text-black">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-cyan-400 py-20 border-t-4 border-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-5xl font-black uppercase mb-12">
            EXCLUSIVE
            <br />
            <span className="text-pink-500">NFT REWARDS</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "PREDICTION NFTS",
                desc: "MINT UNIQUE NFT FOR EVERY WIN. COLLECTIBLE. TRADEABLE. VALUABLE.",
              },
              {
                title: "SEASON BADGES",
                desc: "EARN SEASONAL ACHIEVEMENT BADGES. FLEX YOUR SKILLS. UNLOCK PERKS.",
              },
              {
                title: "MONAD GENESIS",
                desc: "GENESIS NFT HOLDERS GET 2X REWARDS. JOIN THE EXCLUSIVE CLUB.",
              },
            ].map((nft, index) => (
              <Card key={index} className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-2xl font-black uppercase mb-4">{nft.title}</h3>
                <p className="font-bold">{nft.desc}</p>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/nfts">
              <Button className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase text-lg px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                EXPLORE NFT MARKETPLACE
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-pink-500 py-20 border-t-4 border-white">
        <section className="mb-8 md:mb-12 max-w-7xl mx-auto">
          <div className="border-4 border-black rounded-2xl bg-gradient-to-br from-purple-300 to-blue-300 p-8 sm:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <h2 className="text-5xl md:text-7xl font-black uppercase mb-8 text-white">
              READY TO
              <br />
              <span className="text-black">MONAD BET?</span>
            </h2>
            <p className="text-xl font-bold mb-12 text-white max-w-2xl mx-auto">
              CONNECT YOUR WALLET. START BETTING ON YOUR FIRST EVENT IN SECONDS. EARN $MON. MINT NFTS. DOMINATE
              LEADERBOARDS.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-black hover:bg-black/80 text-white rounded-xl border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-6 px-8 text-lg" onClick={handleLaunchApp}>
                Launch App
              </Button>
              {/* <Button
                variant="outline"
                className="rounded-xl border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-6 px-8 text-lg bg-transparent"
              >
                Watch Demo
              </Button> */}
            </div>
          </div>
        </section>
      </section>

      <section className="bg-black text-white border-t-4 border-white py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-5xl font-black uppercase text-center mb-16">
            BETS <span className="text-yellow-400">FAQ</span>
          </h2>
          <div className="space-y-6">
            {[
              {
                question: "HOW DO I PLACE A BET?",
                answer:
                  "SIGN UP, VERIFY YOUR ACCOUNT, DEPOSIT FUNDS, AND START BETTING ON LIVE EVENTS. TAKES 5 MINUTES.",
              },
              {
                question: "ARE PAYOUTS REALLY INSTANT?",
                answer: "YES. WHEN AN EVENT ENDS AND YOU WIN, YOUR WINNINGS HIT YOUR WALLET IN SECONDS. NO WAITING.",
              },
              {
                question: "WHAT'S THE MINIMUM BET?",
                answer:
                  "OUR MICRO BETS START AT $0.50. MAXIMUM DEPENDS ON THE EVENT. NO LIMITS ON HOW MUCH YOU CAN WIN.",
              },
              {
                question: "IS THIS LEGAL?",
                answer:
                  "WE OPERATE IN JURISDICTIONS WHERE PREDICTION MARKETS ARE LEGAL. CHECK LOCAL LAWS. ALWAYS BET RESPONSIBLY.",
              },
              {
                question: "HOW DO YOU PREVENT CHEATING?",
                answer:
                  "ALL BETS ARE BLOCKCHAIN VERIFIED. EVENTS ARE MONITORED BY INDEPENDENT ORACLES. 100% TRANSPARENT.",
              },
            ].map((faq, index) => (
              <Card
                key={index}
                className="bg-white text-black border-4 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-6"
              >
                <h3 className="text-xl font-black uppercase mb-3">{faq.question}</h3>
                <p className="font-bold">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
