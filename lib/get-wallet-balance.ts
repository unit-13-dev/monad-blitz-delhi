import { ethers } from "ethers"

/**
 * Fetches the native token balance (ETH/MONAD) for a wallet address
 * This is a server-side function that uses RPC providers
 * @param address - The wallet address to check
 * @param rpcUrl - Optional RPC URL. If not provided, uses default Monad RPC
 * @returns Balance in wei as a string
 */
export async function getWalletBalance(
  address: string,
  rpcUrl?: string
): Promise<string> {
  try {
    let provider: ethers.providers.Provider

    if (rpcUrl) {
      // Use provided RPC URL
      provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    } else {
      // Default RPC URLs - you should set this in your .env file
      // For Monad Testnet
      const defaultRpcUrl =
        process.env.NEXT_PUBLIC_MONAD_RPC_URL ||
        process.env.MONAD_RPC_URL ||
        "https://testnet-rpc.monad.xyz"
      provider = new ethers.providers.JsonRpcProvider(defaultRpcUrl)
    }

    const balance = await provider.getBalance(address)
    return balance.toString()
  } catch (error) {
    console.error("Error fetching wallet balance:", error)
    throw error
  }
}

/**
 * Fetches balance using the connected wallet's provider (client-side)
 * This uses the AppKit provider if available
 */
export async function getWalletBalanceClient(
  address: string,
  provider?: ethers.providers.Provider
): Promise<string> {
  try {
    let balanceProvider: ethers.providers.Provider

    if (provider) {
      balanceProvider = provider
    } else if (typeof window !== "undefined" && (window as any).ethereum) {
      // Use browser's ethereum provider if available
      balanceProvider = new ethers.providers.Web3Provider((window as any).ethereum)
    } else {
      throw new Error("No provider available")
    }

    const balance = await balanceProvider.getBalance(address)
    return balance.toString()
  } catch (error) {
    console.error("Error fetching wallet balance:", error)
    throw error
  }
}

/**
 * Converts wei to a readable format (ETH/MONAD)
 * @param wei - Balance in wei as string
 * @returns Formatted balance with 4 decimal places
 */
export function formatBalance(wei: string): string {
  try {
    const balance = ethers.utils.formatEther(wei)
    return parseFloat(balance).toFixed(4)
  } catch (error) {
    return "0.0000"
  }
}

/**
 * Converts wei to a number for calculations
 * @param wei - Balance in wei as string
 * @returns Balance as number
 */
export function weiToNumber(wei: string): number {
  try {
    return parseFloat(ethers.utils.formatEther(wei))
  } catch (error) {
    return 0
  }
}

