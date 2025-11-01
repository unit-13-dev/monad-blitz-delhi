import { tachiFactoryABI } from "@/tachi_contracts/contract_abis/tachi_factory_abi"
import { ethers, Contract, Signer, providers } from "ethers"


/**
 * Market data structure matching the Solidity Market struct
 */
export interface MarketData {
  question: string
  questionHash: string
  closeTime: number
  betAmount: string // BigNumber as string
  yesPool: string // BigNumber as string
  noPool: string // BigNumber as string
  isClosed: boolean
  resolved: boolean
  outcome: boolean
  participantCount: number
}

/**
 * Bet data structure matching the Solidity Bet struct
 */
export interface BetData {
  hasBet: boolean
  prediction: boolean // true = YES, false = NO
  amount: string // BigNumber as string
  claimed: boolean
  won: boolean
}

/**
 * User statistics matching the Solidity UserStats struct
 */
export interface UserStats {
  totalBets: number
  wonBets: number
  lostBets: number
  totalWinnings: string // BigNumber as string
  netProfit: string // BigNumber as string
  totalAmountBet: string // BigNumber as string
  winRate: number // Calculated as (wonBets * 10000) / totalBets (in basis points)
}

/**
 * Market status information
 */
export interface MarketStatus {
  question: string
  secondsRemaining: number
  isBettingOpen: boolean
  isBettingClosed: boolean
  isResolved: boolean
  currentTime: number
  closeTime: number
}

/**
 * Contract constants
 */
export const CONTRACT_CONSTANTS = {
  MIN_BET_AMOUNT: ethers.utils.parseEther("0.1"), 
  MAX_BET_AMOUNT: ethers.utils.parseEther("100"), // 100 ether
  MAX_DURATION: 3600, // 1 hour in seconds
} as const



export class TachiContract {
  private contract: Contract
  private signer: Signer | null

  /**
   * Initialize the Tachi Contract
   * @param contractAddress - The deployed contract address
   * @param signerOrProvider - Signer for write operations, or Provider for read-only
   */
  constructor(contractAddress: string, signerOrProvider: Signer | providers.Provider) {
    this.contract = new ethers.Contract(contractAddress, tachiFactoryABI, signerOrProvider)
    this.signer = signerOrProvider instanceof Signer ? signerOrProvider : null
  }

  /**
   * Get the contract instance (for advanced usage)
   */
  getContract(): Contract {
    return this.contract
  }

  /**
   * Create a new betting market (Organizer only)
   * @param question - The betting question
   * @param durationSeconds - Duration in seconds (max 3600 = 1 hour)
   * @param betAmount - Bet amount in ether (must be between 0.001 and 100)
   * @returns Promise with transaction hash and market ID
   */
  async createMarket(
    question: string,
    durationSeconds: number,
    betAmount: string
  ): Promise<{ txHash: string; marketId: number }> {
    if (!this.signer) {
      throw new Error("Signer required for createMarket")
    }

    if (durationSeconds <= 0 || durationSeconds > CONTRACT_CONSTANTS.MAX_DURATION) {
      throw new Error(`Duration must be between 1 and ${CONTRACT_CONSTANTS.MAX_DURATION} seconds`)
    }

    const betAmountWei = ethers.utils.parseEther(betAmount)
    if (betAmountWei.lt(CONTRACT_CONSTANTS.MIN_BET_AMOUNT)) {
      throw new Error(`Bet amount too low. Minimum: ${ethers.utils.formatEther(CONTRACT_CONSTANTS.MIN_BET_AMOUNT)} ETH`)
    }
    if (betAmountWei.gt(CONTRACT_CONSTANTS.MAX_BET_AMOUNT)) {
      throw new Error(`Bet amount too high. Maximum: ${ethers.utils.formatEther(CONTRACT_CONSTANTS.MAX_BET_AMOUNT)} ETH`)
    }

    const tx = await this.contract.createMarket(question, durationSeconds, betAmountWei)
    const receipt = await tx.wait()

    // Extract market ID from event
    const event = receipt.events?.find((e: any) => e.event === "MarketCreated")
    const marketId = event?.args?.marketId?.toNumber() ?? receipt.events?.[0]?.args?.[0]?.toNumber()

    return {
      txHash: receipt.transactionHash,
      marketId: marketId ?? (await this.getMarketCount()) - 1,
    }
  }

  /**
   * Close betting for a market (Organizer only)
   * @param marketId - The market ID
   * @returns Promise with transaction hash
   */
  async closeBetting(marketId: number): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer required for closeBetting")
    }

    const tx = await this.contract.closeBetting(marketId)
    const receipt = await tx.wait()
    return receipt.transactionHash
  }

  /**
   * Resolve a market with outcome (Organizer only)
   * This also distributes winnings automatically
   * @param marketId - The market ID
   * @param outcome - true for YES, false for NO
   * @returns Promise with transaction hash
   */
  async resolveMarket(marketId: number, outcome: boolean): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer required for resolveMarket")
    }

    const tx = await this.contract.resolveMarket(marketId, outcome)
    const receipt = await tx.wait()
    return receipt.transactionHash
  }

  /**
   * Add house funds to a market (Organizer only)
   * Funds are split 50/50 between YES and NO pools
   * @param marketId - The market ID
   * @param amount - Amount in ether (will be converted to wei)
   * @returns Promise with transaction hash
   */
  async addHouseFunds(marketId: number, amount: string): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer required for addHouseFunds")
    }

    const amountWei = ethers.utils.parseEther(amount)
    const tx = await this.contract.addHouseFunds(marketId, { value: amountWei })
    const receipt = await tx.wait()
    return receipt.transactionHash
  }

  /**
   * Set a new organizer (Current organizer only)
   * @param newOrganizer - Address of the new organizer
   * @returns Promise with transaction hash
   */
  async setOrganizer(newOrganizer: string): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer required for setOrganizer")
    }

    const tx = await this.contract.setOrganizer(newOrganizer)
    const receipt = await tx.wait()
    return receipt.transactionHash
  }


  /**
   * Place a bet on a market
   * @param marketId - The market ID
   * @param prediction - true for YES, false for NO
   * @returns Promise with transaction hash
   */
  async placeBet(marketId: number, prediction: boolean): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer required for placeBet")
    }

    try {
      const market = await this.getMarket(marketId)
      
      if (market.resolved) {
        throw new Error("Market is already resolved")
      }
      
      if (market.isClosed) {
        throw new Error("Betting is closed for this market")
      }

      const currentTime = await this.getCurrentTimestamp()
      if (currentTime >= market.closeTime) {
        throw new Error("Betting time has ended for this market")
      }

      const betAmount = ethers.BigNumber.from(market.betAmount)
      
      const signerAddress = await this.signer.getAddress()
      const existingBet = await this.getUserBet(marketId, signerAddress)
      if (existingBet.hasBet) {
        throw new Error("Already bet")
      }

      console.log("📝 Placing bet:", {
        marketId,
        prediction: prediction ? "YES" : "NO",
        betAmount: betAmount.toString(),
        betAmountFormatted: ethers.utils.formatEther(betAmount),
        signer: signerAddress,
      })

      const tx = await this.contract.placeBet(marketId, prediction, { 
        value: betAmount,
        gasLimit: 500000
      })
      
      console.log("⏳ Transaction sent, waiting for confirmation...", tx.hash)
      const receipt = await tx.wait()
      
      console.log("✅ Transaction confirmed:", receipt.transactionHash)
      return receipt.transactionHash
    } catch (error: any) {
      console.error("❌ Error in placeBet:", error)
      
      if (error.code === "UNPREDICTABLE_GAS_LIMIT" || error.code === "CALL_EXCEPTION") {
        if (error.reason) {
          throw new Error(error.reason)
        } else if (error.data?.message) {
          throw new Error(error.data.message)
        } else {
          const revertReason = this.extractRevertReason(error)
          throw new Error(revertReason || "Transaction failed. Please check contract state and try again.")
        }
      }
      
      if (error.message) {
        throw error
      }
      
      throw new Error("Failed to place bet. Please try again.")
    }
  }

  /**
   * Extract revert reason from error
   */
  private extractRevertReason(error: any): string {
    if (error.reason) {
      return error.reason
    }

    if (error.data) {
      if (typeof error.data === "string") {
        if (error.data.startsWith("0x08c379a0")) {
          try {
            const reason = ethers.utils.defaultAbiCoder.decode(
              ["string"],
              "0x" + error.data.slice(10)
            )[0]
            return reason
          } catch {
            return "Transaction reverted"
          }
        } else if (error.data.length > 2) {
          try {
            const decoded = ethers.utils.toUtf8String("0x" + error.data.slice(138))
            if (decoded) return decoded
          } catch {
          }
        }
      } else if (error.data.message) {
        return error.data.message
      }
    }

    if (error.error?.data) {
      return this.extractRevertReason(error.error)
    }

    if (error.error?.message) {
      return error.error.message
    }

    return "Transaction reverted by contract"
  }


  /**
   * Get market data by ID
   * @param marketId - The market ID
   * @returns Market data
   */
  async getMarket(marketId: number): Promise<MarketData> {
    const result = await this.contract.getMarket(marketId)
    return {
      question: result.question || "",
      questionHash: result.questionHash || "",
      closeTime: result.closeTime.toNumber(),
      betAmount: result.betAmount.toString(),
      yesPool: result.yesPool.toString(),
      noPool: result.noPool.toString(),
      isClosed: result.isClosed,
      resolved: result.resolved,
      outcome: result.outcome,
      participantCount: result.participantCount.toNumber(),
    }
  }

  /**
   * Get user's bet for a specific market
   * @param marketId - The market ID
   * @param userAddress - User's wallet address
   * @returns Bet data
   */
  async getUserBet(marketId: number, userAddress?: string): Promise<BetData> {
    const address = userAddress || (this.signer ? await this.signer.getAddress() : undefined)
    if (!address) {
      throw new Error("User address required")
    }

    const result = await this.contract.getUserBet(marketId, address)
    return {
      hasBet: result.hasBet,
      prediction: result.prediction,
      amount: result.amount.toString(),
      claimed: result.claimed,
      won: result.won,
    }
  }

  /**
   * Get user statistics
   * @param userAddress - User's wallet address (optional, defaults to signer)
   * @returns User stats
   */
  async getUserStats(userAddress?: string): Promise<UserStats> {
    const address = userAddress || (this.signer ? await this.signer.getAddress() : undefined)
    if (!address) {
      throw new Error("User address required")
    }

    const result = await this.contract.getUserStats(address)
    return {
      totalBets: result.totalBets.toNumber(),
      wonBets: result.wonBets.toNumber(),
      lostBets: result.lostBets.toNumber(),
      totalWinnings: result.totalWinnings.toString(),
      netProfit: result.netProfit.toString(),
      totalAmountBet: result.totalAmountBet.toString(),
      winRate: result.winRate.toNumber(), // In basis points (divide by 100 for percentage)
    }
  }

  /**
   * Get market status and time information
   * @param marketId - The market ID
   * @returns Market status
   */
  async getMarketStatus(marketId: number): Promise<MarketStatus> {
    const result = await this.contract.getMarketStatus(marketId)
    return {
      question: result.question || "",
      secondsRemaining: result.secondsRemaining.toNumber(),
      isBettingOpen: result.isBettingOpen,
      isBettingClosed: result.isBettingClosed,
      isResolved: result.isResolved,
      currentTime: result.currentTime.toNumber(),
      closeTime: result.closeTime.toNumber(),
    }
  }

  /**
   * Get total number of markets
   * @returns Market count
   */
  async getMarketCount(): Promise<number> {
    const count = await this.contract.getMarketCount()
    return count.toNumber()
  }

  /**
   * Get all participant addresses
   * @returns Array of participant addresses
   */
  async getAllParticipants(): Promise<string[]> {
    return await this.contract.getAllParticipants()
  }

  /**
   * Get current blockchain timestamp
   * @returns Current timestamp in seconds
   */
  async getCurrentTimestamp(): Promise<number> {
    const timestamp = await this.contract.getCurrentTimestamp()
    return timestamp.toNumber()
  }

  /**
   * Get contract balance
   * @returns Contract balance in wei (as string)
   */
  async getContractBalance(): Promise<string> {
    const balance = await this.contract.getContractBalance()
    return balance.toString()
  }

  /**
   * Get organizer address
   * @returns Organizer address
   */
  async getOrganizer(): Promise<string> {
    return await this.contract.organizer()
  }

  /**
   * Get minimum bet amount constant
   * @returns Minimum bet amount in wei (as string)
   */
  async getMinBetAmount(): Promise<string> {
    const amount = await this.contract.MIN_BET_AMOUNT()
    return amount.toString()
  }

  /**
   * Get maximum bet amount constant
   * @returns Maximum bet amount in wei (as string)
   */
  async getMaxBetAmount(): Promise<string> {
    const amount = await this.contract.MAX_BET_AMOUNT()
    return amount.toString()
  }
}


/**
 * Format wei amount to ether string
 */
export function formatEther(wei: string | ethers.BigNumber): string {
  return ethers.utils.formatEther(wei)
}

/**
 * Parse ether string to wei
 */
export function parseEther(ether: string): ethers.BigNumber {
  return ethers.utils.parseEther(ether)
}

/**
 * Calculate win rate percentage from basis points
 */
export function calculateWinRate(winRateBasisPoints: number): number {
  return winRateBasisPoints / 100
}

/**
 * Calculate odds from pool sizes
 */
export function calculateOdds(yesPool: string, noPool: string, totalPool: string): { yesOdds: number; noOdds: number } {
  const yesPoolBN = ethers.BigNumber.from(yesPool)
  const noPoolBN = ethers.BigNumber.from(noPool)
  const totalPoolBN = ethers.BigNumber.from(totalPool)

  if (yesPoolBN.isZero() || noPoolBN.isZero() || totalPoolBN.isZero()) {
    return { yesOdds: 1.0, noOdds: 1.0 }
  }

  // Odds = totalPool / poolForChoice
  const yesOdds = parseFloat(formatEther(totalPoolBN)) / parseFloat(formatEther(yesPoolBN))
  const noOdds = parseFloat(formatEther(totalPoolBN)) / parseFloat(formatEther(noPoolBN))

  return {
    yesOdds: Math.round(yesOdds * 100) / 100, // Round to 2 decimals
    noOdds: Math.round(noOdds * 100) / 100,
  }
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "Closed"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Check if betting is open for a market
 */
export function isBettingOpen(market: MarketData, currentTime: number): boolean {
  return !market.isClosed && currentTime < market.closeTime && !market.resolved
}

/**
 * Get contract instance from provider/signer
 * @param contractAddress - Contract address
 * @param signerOrProvider - Signer or Provider
 */
export function getTachiContract(
  contractAddress: string,
  signerOrProvider: Signer | providers.Provider
): TachiContract {
  return new TachiContract(contractAddress, signerOrProvider)
}

/**
 * Get contract instance from window.ethereum (browser)
 * @param contractAddress - Contract address
 */
export async function getTachiContractFromBrowser(contractAddress: string): Promise<TachiContract> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("window.ethereum not found. Please install MetaMask or another Web3 wallet.")
  }

  const provider = new ethers.providers.Web3Provider((window as any).ethereum)
  const signer = provider.getSigner()
  return new TachiContract(contractAddress, signer)
}

/**
 * Get contract instance read-only (no signer needed)
 * @param contractAddress - Contract address
 * @param rpcUrl - RPC endpoint URL
 */
export function getTachiContractReadOnly(contractAddress: string, rpcUrl: string): TachiContract {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  return new TachiContract(contractAddress, provider)
}

