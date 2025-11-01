const prefixes = [
  "ALPHA", "BETA", "GAMMA", "OMEGA", "SIGMA", "DELTA", "ZETA", "THETA",
  "PREDICTION", "ORACLE", "PROPHET", "SEER", "VISION", "INSIGHT",
  "MONAD", "CHAIN", "CRYPTO", "BLOCK", "WEB3", "DEFI",
  "FORTUNE", "LUCK", "CHANCE", "ODDS", "BET", "WAGER",
  "MASTER", "LEGEND", "KING", "QUEEN", "CHAMP", "HERO",
  "NINJA", "SAMURAI", "WARRIOR", "KNIGHT", "GUARDIAN", "SENTINEL",
  "PHOENIX", "DRAGON", "TIGER", "WOLF", "EAGLE", "SHARK",
  "NEBULA", "STELLAR", "COSMIC", "VOID", "NOVA", "STAR",
  "TURBO", "RAPID", "SWIFT", "BLAZE", "STORM", "THUNDER",
  "QUANTUM", "ATOMIC", "NUCLEAR", "FUSION", "POWER", "ENERGY",
]

const suffixes = [
  "BETTOR", "ORACLE", "PRO", "MASTER", "LEGEND", "KING", "QUEEN",
  "CHAMP", "HERO", "NINJA", "SAGE", "WIZARD", "MAGE", "ARCHER",
  "KNIGHT", "WARRIOR", "GUARDIAN", "SENTINEL", "PILOT", "CAPTAIN",
  "COMMANDER", "GENERAL", "ADMIRAL", "CHIEF", "BOSS", "LEADER",
  "ELITE", "PRO", "EXPERT", "SPECIALIST", "VETERAN", "CHAMPION",
  "PHOENIX", "DRAGON", "TIGER", "WOLF", "EAGLE", "SHARK", "LION",
  "NEBULA", "STAR", "NOVA", "VOID", "COSMOS", "GALAXY",
  "BOLT", "FLASH", "STORM", "THUNDER", "BLAZE", "FIRE",
  "GENESIS", "ALPHA", "BETA", "OMEGA", "SIGMA", "DELTA",
]

const separators = ["_", ""]

/**
 * Generates a random creative username
 */
export function generateUsername(): string {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
  const separator = separators[Math.floor(Math.random() * separators.length)]
  
  return `${prefix}${separator}${suffix}`
}

/**
 * Checks if a username already exists in the database
 * (This will be used by the API route)
 */
export function generateUniqueUsername(
  checkExists: (username: string) => Promise<boolean>,
  maxAttempts: number = 10
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let attempts = 0
    
    while (attempts < maxAttempts) {
      const username = generateUsername()
      const exists = await checkExists(username)
      
      if (!exists) {
        resolve(username)
        return
      }
      
      attempts++
    }
  
    // Fallback: append random number
    const baseUsername = generateUsername()
    const fallbackUsername = `${baseUsername}_${Math.floor(Math.random() * 10000)}`
    const exists = await checkExists(fallbackUsername)
    
    if (!exists) {
      resolve(fallbackUsername)
    } else {
      resolve(`${baseUsername}_${Date.now()}`)
    }
  })
}

