import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateUniqueUsername } from "@/lib/username-generator"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const walletAddress = searchParams.get("walletAddress")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let walletAddress: string | undefined

  try {
    const body = await request.json()
    walletAddress = body.walletAddress


    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const normalizedAddress = walletAddress.toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    })

    if (existingUser) {
      return NextResponse.json(existingUser)
    }

    const checkUsernameExists = async (username: string) => {
      const user = await prisma.user.findUnique({
        where: { username },
      })
      return !!user
    }

    const username = await generateUniqueUsername(checkUsernameExists)

    const newUser = await prisma.user.create({
      data: {
        walletAddress: normalizedAddress,
        username,
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    console.error("❌ Error creating user:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })

    if (error.code === "P2002" && walletAddress) {
      try {
        const user = await prisma.user.findUnique({
          where: { walletAddress: walletAddress.toLowerCase() },
        })
        if (user) {
          return NextResponse.json(user)
        }
      } catch (fetchError) {
        console.error("❌ Error fetching existing user:", fetchError)
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    )
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, ...updateData } = body

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    if (updateData.wins !== undefined || updateData.losses !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
      })

      if (currentUser) {
        const totalWins = updateData.wins ?? currentUser.wins
        const totalLosses = updateData.losses ?? currentUser.losses
        const totalGames = totalWins + totalLosses
        updateData.winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0
      }
    }

    const updatedUser = await prisma.user.update({
      where: { walletAddress: walletAddress.toLowerCase() },
      data: updateData,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

