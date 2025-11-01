import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTachiContractReadOnly } from "@/lib/tachi-contract"
import { formatEther } from "@/lib/tachi-contract"

interface LeaderboardEntry {
  rank: number
  address: string
  name: string
  wins: number
  winRate: string
  $monWon: string
  totalBets: number
}

export async function GET() {
  try {
    const contractAddress = process.env.NEXT_PUBLIC_TACHI_CONTRACT_ADDRESS
    const rpcUrl = process.env.NEXT_PUBLIC_MONAD_RPC_URL

    if (!contractAddress || !rpcUrl) {
      console.warn("Contract address or RPC URL not set, using database fallback only")
      return getDatabaseLeaderboard()
    }

    try {
      const readOnlyContract = getTachiContractReadOnly(contractAddress, rpcUrl)
      const participants = await readOnlyContract.getAllParticipants()

      if (participants.length === 0) {
        console.log("No participants in contract, using database fallback")
        return getDatabaseLeaderboard()
      }

      const leaderboardData: LeaderboardEntry[] = []

      for (const address of participants) {
        try {
          const contractStats = await readOnlyContract.getUserStats(address)

          if (contractStats.totalBets === 0) {
            continue
          }

          let username = `${address.slice(0, 6)}...${address.slice(-4)}`
          let dbWins = 0
          let dbMonWon = "0"

          try {
            const dbUser = await prisma.user.findUnique({
              where: { walletAddress: address.toLowerCase() },
              select: { username: true, wins: true, monWon: true },
            })
            if (dbUser) {
              username = dbUser.username
              dbWins = dbUser.wins || 0
              dbMonWon = dbUser.monWon || "0"
            }
          } catch (dbError) {
            console.warn(`Failed to fetch DB data for ${address}:`, dbError)
          }

          const wins = contractStats.wonBets > 0 ? contractStats.wonBets : dbWins
          const totalBets = contractStats.totalBets
          
          let winRatePercent = "0"
          if (contractStats.winRate > 0) {
            winRatePercent = (contractStats.winRate / 100).toFixed(0)
          } else if (totalBets > 0) {
            winRatePercent = ((wins * 100) / totalBets).toFixed(0)
          }
          
          let monWon = contractStats.totalWinnings || "0"
          if (monWon === "0" && dbMonWon !== "0") {
            monWon = dbMonWon
          }

          const monWonFormatted = parseFloat(formatEther(monWon)).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })

          leaderboardData.push({
            rank: 0,
            address: address.toLowerCase(),
            name: username,
            wins: wins,
            winRate: `${winRatePercent}%`,
            $monWon: monWonFormatted,
            totalBets: totalBets,
          })
        } catch (error) {
          console.warn(`Error processing participant ${address}:`, error)
          
          try {
            const dbUser = await prisma.user.findUnique({
              where: { walletAddress: address.toLowerCase() },
              select: { username: true, wins: true, monWon: true, losses: true },
            })
            
            if (dbUser && (dbUser.wins > 0 || dbUser.losses > 0)) {
              const totalBets = dbUser.wins + dbUser.losses
              const winRate = totalBets > 0 ? ((dbUser.wins * 100) / totalBets).toFixed(0) : "0"
              const monWonFormatted = Number(dbUser.monWon).toLocaleString()

              leaderboardData.push({
                rank: 0,
                address: address.toLowerCase(),
                name: dbUser.username,
                wins: dbUser.wins,
                winRate: `${winRate}%`,
                $monWon: monWonFormatted,
                totalBets: totalBets,
              })
            }
          } catch (dbError) {
            console.warn(`Failed to get DB fallback for ${address}:`, dbError)
          }
        }
      }

      if (leaderboardData.length === 0) {
        return getDatabaseLeaderboard()
      }

      leaderboardData.sort((a, b) => {
        if (b.wins !== a.wins) {
          return b.wins - a.wins
        }
        const aMonWon = parseFloat(a.$monWon.replace(/,/g, ""))
        const bMonWon = parseFloat(b.$monWon.replace(/,/g, ""))
        return bMonWon - aMonWon
      })

      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1
      })

      const contractUsers = new Set(leaderboardData.map((e) => e.address))
      
      const dbUsers = await prisma.user.findMany({
        where: {
          wins: { gt: 0 },
          walletAddress: { notIn: Array.from(contractUsers) },
        },
        orderBy: [{ wins: "desc" }, { monWon: "desc" }],
        take: 50,
        select: {
          walletAddress: true,
          username: true,
          wins: true,
          losses: true,
          monWon: true,
        },
      })

      for (const dbUser of dbUsers) {
        const totalBets = dbUser.wins + dbUser.losses
        const winRate = totalBets > 0 ? ((dbUser.wins * 100) / totalBets).toFixed(0) : "0"
        const monWonFormatted = Number(dbUser.monWon).toLocaleString()

        leaderboardData.push({
          rank: 0,
          address: dbUser.walletAddress.toLowerCase(),
          name: dbUser.username,
          wins: dbUser.wins,
          winRate: `${winRate}%`,
          $monWon: monWonFormatted,
          totalBets: totalBets,
        })
      }

      leaderboardData.sort((a, b) => {
        if (b.wins !== a.wins) {
          return b.wins - a.wins
        }
        const aMonWon = parseFloat(a.$monWon.replace(/,/g, ""))
        const bMonWon = parseFloat(b.$monWon.replace(/,/g, ""))
        return bMonWon - aMonWon
      })

      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1
      })

      return NextResponse.json(leaderboardData.slice(0, 100))
    } catch (contractError: any) {
      console.error("Error fetching from contract, falling back to database:", contractError)
      return getDatabaseLeaderboard()
    }
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}

async function getDatabaseLeaderboard() {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ wins: { gt: 0 } }, { losses: { gt: 0 } }],
      },
      orderBy: [{ wins: "desc" }, { monWon: "desc" }],
      take: 100,
      select: {
        walletAddress: true,
        username: true,
        wins: true,
        losses: true,
        monWon: true,
      },
    })

    const leaderboardData = users.map((user, index) => {
      const totalBets = user.wins + user.losses
      const winRate = totalBets > 0 ? ((user.wins * 100) / totalBets).toFixed(0) : "0"
      const monWonFormatted = Number(user.monWon).toLocaleString()

      return {
        rank: index + 1,
        address: user.walletAddress.toLowerCase(),
        name: user.username,
        wins: user.wins,
        winRate: `${winRate}%`,
        $monWon: monWonFormatted,
        totalBets: totalBets,
      }
    })

    return NextResponse.json(leaderboardData)
  } catch (error: any) {
    console.error("Error in database leaderboard fallback:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}
