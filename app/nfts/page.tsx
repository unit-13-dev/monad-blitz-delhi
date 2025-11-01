"use client"

import AppLayout from "@/components/Applayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Flame, Trophy, Zap } from "lucide-react"

const nftCollections = [
  {
    name: "PREDICTION WINS",
    desc: "MINT AN NFT EVERY TIME YOU WIN A BET",
    rarity: "COMMON-RARE",
    holders: "2,847",
    floor: "$45",
    icon: Star,
    color: "bg-cyan-400",
  },
  {
    name: "MONAD GENESIS",
    desc: "EXCLUSIVE NFT FOR EARLY ADOPTERS. 2X $MON REWARDS.",
    rarity: "LEGENDARY",
    holders: "500",
    floor: "$2,450",
    icon: Trophy,
    color: "bg-yellow-400",
  },
  {
    name: "SEASON BADGES",
    desc: "UNLOCK SEASONAL ACHIEVEMENT BADGES BASED ON YOUR PERFORMANCE",
    rarity: "EPIC-LEGENDARY",
    holders: "5,234",
    floor: "$180",
    icon: Flame,
    color: "bg-pink-500",
  },
  {
    name: "LEADERBOARD CROWN",
    desc: "EXCLUSIVE TO TOP 100 PREDICTORS EACH SEASON",
    rarity: "MYTHIC",
    holders: "100",
    floor: "$8,900",
    icon: Zap,
    color: "bg-black text-white",
  },
]

const userNFTs = [
  { id: "#2847", name: "PREDICTION WIN", date: "WON PITCH EVENT PREDICTION", rarity: "RARE", value: "$89" },
  { id: "#1234", name: "MONAD GENESIS #42", date: "ORIGINAL HOLDER", rarity: "LEGENDARY", value: "$2,450" },
  { id: "#5623", name: "7-WIN STREAK BADGE", date: "ACHIEVED 7 CONSECUTIVE WINS", rarity: "EPIC", value: "$340" },
  { id: "#3389", name: "PREDICTION WIN", date: "WON RED CARPET PREDICTION", rarity: "RARE", value: "$92" },
  { id: "#7821", name: "ACCURACY BADGE", date: "MAINTAINED 80%+ WIN RATE", rarity: "EPIC", value: "$320" },
  { id: "#1156", name: "PREDICTION WIN", date: "WON TECH TALK PREDICTION", rarity: "RARE", value: "$87" },
]

export default function NFTsPage() {
  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-6xl md:text-8xl font-black uppercase mb-8">
            NFT
            <br />
            <span className="text-cyan-400">MARKETPLACE</span>
          </h1>
          <p className="text-xl font-bold max-w-3xl mx-auto">
            MINT YOUR WINS. TRADE YOUR NFTs. BUILD YOUR COLLECTION. PROVE YOUR SKILL.
          </p>
        </div>
      </section>

      {/* Collections Showcase */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-5xl font-black uppercase mb-12">
            NFT <span className="text-pink-500">COLLECTIONS</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {nftCollections.map((collection, index) => {
              const Icon = collection.icon
              return (
                <Card
                  key={index}
                  className={`${collection.color} border-4 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-8 transform hover:translate-x-2 hover:translate-y-2 transition-all`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="h-8 w-8" />
                        <h3 className="text-2xl font-black uppercase">{collection.name}</h3>
                      </div>
                      <p className="font-bold max-w-xs">{collection.desc}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="bg-white bg-opacity-80 border-3 border-black p-4">
                      <div className="text-xs font-black uppercase mb-1">RARITY</div>
                      <div className="font-black">{collection.rarity}</div>
                    </div>
                    <div className="bg-white bg-opacity-80 border-3 border-black p-4">
                      <div className="text-xs font-black uppercase mb-1">HOLDERS</div>
                      <div className="font-black">{collection.holders}</div>
                    </div>
                    <div className="bg-white bg-opacity-80 border-3 border-black p-4">
                      <div className="text-xs font-black uppercase mb-1">FLOOR</div>
                      <div className="font-black text-green-600">{collection.floor}</div>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    VIEW COLLECTION
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Your NFTs */}
      <section className="bg-yellow-400 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-5xl font-black uppercase mb-12">
            YOUR <span className="text-pink-500">NFT COLLECTION</span>
          </h2>
          <div className="text-center mb-8">
            <p className="text-xl font-bold">6 NFTs • TOTAL VALUE: $3,378 • MINTED: 47</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {userNFTs.map((nft, index) => (
              <Card
                key={index}
                className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                {/* NFT Image Placeholder */}
                <div className="bg-gradient-to-br from-cyan-400 to-pink-500 h-40 border-b-4 border-black flex items-center justify-center">
                  <div className="text-6xl font-black text-white text-center">{nft.id}</div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-black uppercase mb-2">{nft.name}</h3>
                  <p className="text-sm font-bold mb-4 text-gray-700">{nft.date}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`border-2 border-black px-3 py-1 font-black text-xs ${
                        nft.rarity === "LEGENDARY"
                          ? "bg-yellow-300"
                          : nft.rarity === "EPIC"
                            ? "bg-pink-300"
                            : "bg-cyan-300"
                      }`}
                    >
                      {nft.rarity}
                    </span>
                    <span className="font-black text-lg text-green-600">{nft.value}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="border-3 border-black bg-white hover:bg-yellow-300 font-black uppercase text-xs"
                    >
                      LIST
                    </Button>
                    <Button className="bg-black text-white border-3 border-black hover:bg-white hover:text-black font-black uppercase text-xs">
                      TRANSFER
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards System */}
      <section className="bg-cyan-400 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-5xl font-black uppercase mb-12 text-center">
            HOW TO <span className="text-pink-500">EARN NFTS</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "PLACE BETS",
                desc: "PLACE PREDICTIONS ON MONAD CHAIN EVENTS AND WIN WITH YOUR INSTINCTS.",
              },
              {
                step: "2",
                title: "UNLOCK REWARDS",
                desc: "EVERY WIN AUTOMATICALLY MINTS A PREDICTION NFT TO YOUR WALLET.",
              },
              {
                step: "3",
                title: "TRADE & COLLECT",
                desc: "SELL ON MARKETPLACE. TRADE WITH OTHERS. BUILD YOUR PORTFOLIO VALUE.",
              },
            ].map((item, index) => (
              <Card key={index} className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-8">
                <div className="text-6xl font-black mb-4 text-pink-500">{item.step}</div>
                <h3 className="text-2xl font-black uppercase mb-4">{item.title}</h3>
                <p className="font-bold">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-pink-500 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-5xl md:text-7xl font-black uppercase mb-8 text-white">
            START MINTING
            <br />
            <span className="text-black">YOUR NFTS</span>
          </h2>
          <p className="text-xl font-bold mb-12 text-white max-w-2xl mx-auto">
            EVERY WIN = UNIQUE NFT. START BETTING NOW AND MINT YOUR FIRST NFT TODAY.
          </p>
          <Button className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase text-xl px-12 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            PLACE FIRST BET
          </Button>
        </div>
      </section>
    </AppLayout>
  )
}
