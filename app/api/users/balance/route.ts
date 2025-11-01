import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getWalletBalance } from "@/lib/get-wallet-balance"

/**
 * POST /api/users/balance
 * Fetch and update wallet balance for a user
 * Body: { walletAddress: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }


    // Fetch balance from blockchain
    let balance: string
    try {
      balance = await getWalletBalance(walletAddress)
    } catch (error: any) {
      console.error("❌ Error fetching balance from blockchain:", error)
      // Return error but don't fail completely
      return NextResponse.json(
        { error: "Failed to fetch balance from blockchain", message: error.message },
        { status: 500 }
      )
    }

    // Update user balance in database
    const updatedUser = await prisma.user.update({
      where: { walletAddress: walletAddress.toLowerCase() },
      data: {
        balance,
        balanceUpdatedAt: new Date(),
      },
    })

    return NextResponse.json({
      balance: updatedUser.balance,
      balanceUpdatedAt: updatedUser.balanceUpdatedAt,
    })
  } catch (error: any) {
    console.error("❌ Error updating balance:", error)

    // If user doesn't exist, return error
    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/users/balance?walletAddress=0x...
 * Get current balance from database (doesn't fetch from blockchain)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const walletAddress = searchParams.get("walletAddress")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: {
        balance: true,
        balanceUpdatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      balance: user.balance,
      balanceUpdatedAt: user.balanceUpdatedAt,
    })
  } catch (error) {
    console.error("Error fetching balance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

