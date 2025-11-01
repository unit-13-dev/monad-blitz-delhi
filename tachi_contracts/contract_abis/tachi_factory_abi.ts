export const tachiFactoryABI=[
    {
      "type": "constructor",
      "inputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "addHouseFunds",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "createMarket",
      "inputs": [
        {
          "name": "question",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "durationSeconds",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "betAmount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getAllParticipants",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address[]",
          "internalType": "address[]"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getContractBalance",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getCurrentTimestamp",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getMarket",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "question",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "closeTime",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "betAmount",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "yesPool",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "noPool",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "isClosed",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "resolved",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "outcome",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "participantCount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getMarketCount",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getMarketStatus",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "question",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "secondsRemaining",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "isBettingOpen",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "isBettingClosed",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "isResolved",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "currentTime",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "closeTime",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getUserBet",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "user",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "hasBet",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "prediction",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "claimed",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "won",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getUserStats",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "totalBets",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "wonBets",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "lostBets",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "totalWinnings",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "netProfit",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "totalAmountBet",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "winRate",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "placeBet",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "prediction",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "resolveMarket",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "outcome",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setOrganizer",
      "inputs": [
        {
          "name": "newOrganizer",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "organizer",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "MAX_BET_AMOUNT",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "MIN_BET_AMOUNT",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "MarketCreated",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "question",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        },
        {
          "name": "closeTime",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "durationSeconds",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "betAmount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "event",
      "name": "BetPlaced",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "prediction",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "event",
      "name": "BettingClosed",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "event",
      "name": "MarketResolved",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "outcome",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        }
      ]
    },
    {
      "type": "event",
      "name": "WinningsClaimed",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "event",
      "name": "UserStatsUpdated",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "totalBets",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "wonBets",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "totalWinnings",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "netProfit",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "event",
      "name": "PaymentFailed",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ]
    }
  ]
  