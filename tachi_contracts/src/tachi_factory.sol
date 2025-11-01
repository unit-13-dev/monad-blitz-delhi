// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TACHI_FACTORY {
    
    struct Market {
        string question;            
        bytes32 questionHash;
        uint256 closeTime;
        uint256 betAmount;
        uint256 yesPool;
        uint256 noPool;
        bool isClosed;
        bool resolved;
        bool outcome;
        address[] participants;
    }
    
    struct Bet {
        bool prediction;
        uint256 amount;
        bool claimed;
        bool won;
    }
    
    struct UserStats {
        uint256 totalBets;
        uint256 wonBets;
        uint256 lostBets;
        uint256 totalWinnings;
        uint256 netProfit;
        uint256 totalAmountBet;
    }
    
    Market[] public markets;
    mapping(uint256 => mapping(address => Bet)) public marketBets;
    mapping(address => UserStats) public userStats;
    address[] public participants;
    mapping(address => bool) public hasParticipated;
    
    address public organizer;
    uint256 public constant MIN_BET_AMOUNT = 0.001 ether;
    uint256 public constant MAX_BET_AMOUNT = 100 ether;
    
    event MarketCreated(
        uint256 indexed marketId,
        string question,
        uint256 closeTime,
        uint256 durationSeconds,
        uint256 betAmount
    );
    event BetPlaced(
        uint256 indexed marketId,
        address indexed user,
        bool prediction,
        uint256 amount
    );
    event BettingClosed(uint256 indexed marketId);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event UserStatsUpdated(
        address indexed user,
        uint256 totalBets,
        uint256 wonBets,
        uint256 totalWinnings,
        uint256 netProfit
    );
    event PaymentFailed(address indexed user, uint256 amount);
    
    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only organizer");
        _;
    }
    
    constructor() {
        organizer = msg.sender;
    }
    
    function setOrganizer(address newOrganizer) external onlyOrganizer {
        organizer = newOrganizer;
    }
    
    function createMarket(
        string calldata question,
        uint256 durationSeconds,
        uint256 betAmount
    ) external onlyOrganizer returns (uint256) {
        require(durationSeconds > 0, "Duration must be positive");
        require(durationSeconds <= 3600, "Duration too long (max 1 hour)");
        require(betAmount >= MIN_BET_AMOUNT, "Bet amount too low");
        require(betAmount <= MAX_BET_AMOUNT, "Bet amount too high");
        require(bytes(question).length > 0, "Question cannot be empty");
        
        uint256 marketId = markets.length;
        bytes32 qHash = keccak256(abi.encodePacked(question));
        uint256 closeTime = block.timestamp + durationSeconds;
        
        Market storage newMarket = markets.push();
        newMarket.question = question;         
        newMarket.questionHash = qHash;
        newMarket.closeTime = closeTime;
        newMarket.betAmount = betAmount;
        newMarket.isClosed = false;
        newMarket.resolved = false;
        
        emit MarketCreated(marketId, question, closeTime, durationSeconds, betAmount);
        return marketId;
    }
    
    function resolveMarket(uint256 marketId, bool outcome) external onlyOrganizer {
        Market storage market = markets[marketId];
        require(!market.resolved, "Already resolved");
        require(block.timestamp >= market.closeTime, "Betting window not ended yet");
        
        _closeBettingIfTimeExpired(marketId);
        
        market.resolved = true;
        market.outcome = outcome;
        
        emit MarketResolved(marketId, outcome);
        _distributeWinnings(marketId);
    }
    
    function addHouseFunds(uint256 marketId) external payable onlyOrganizer {
        Market storage market = markets[marketId];
        require(!market.resolved, "Market resolved");
        require(!market.isClosed, "Betting already closed");
        
        uint256 halfAmount = msg.value / 2;
        market.yesPool += halfAmount;
        market.noPool += msg.value - halfAmount;
    }
    
    function placeBet(uint256 marketId, bool prediction) external payable {
        Market storage market = markets[marketId];
        require(marketId < markets.length, "Market does not exist");
        require(block.timestamp < market.closeTime, "Betting time ended");
        require(!market.isClosed, "Betting closed");
        require(msg.value == market.betAmount, "Incorrect bet amount");
        require(marketBets[marketId][msg.sender].amount == 0, "Already bet");
        
        marketBets[marketId][msg.sender] = Bet({
            prediction: prediction,
            amount: msg.value,
            claimed: false,
            won: false
        });
        
        market.participants.push(msg.sender);
        
        if (!hasParticipated[msg.sender]) {
            hasParticipated[msg.sender] = true;
            participants.push(msg.sender);
        }
        
        UserStats storage stats = userStats[msg.sender];
        stats.totalBets++;
        stats.totalAmountBet += msg.value;
        
        if (prediction) {
            market.yesPool += msg.value;
        } else {
            market.noPool += msg.value;
        }
        
        emit BetPlaced(marketId, msg.sender, prediction, msg.value);
    }

    function _closeBettingIfTimeExpired(uint256 marketId) internal {
        Market storage market = markets[marketId];
        if (block.timestamp >= market.closeTime && !market.isClosed) {
            market.isClosed = true;
            emit BettingClosed(marketId);
        }
    }

    function _distributeWinnings(uint256 marketId) internal {
        Market storage market = markets[marketId];
        uint256 totalPool = market.yesPool + market.noPool;
        uint256 winningPool = market.outcome ? market.yesPool : market.noPool;
        
        if (winningPool == 0) {
            for (uint256 i = 0; i < market.participants.length; i++) {
                address user = market.participants[i];
                Bet storage bet = marketBets[marketId][user];
                
                if (!bet.claimed) {
                    bet.claimed = true;
                    (bool success, ) = payable(user).call{value: bet.amount}("");
                    if (!success) {
                        emit PaymentFailed(user, bet.amount);
                        revert("Payment failed");
                    }
                    
                    UserStats storage stats = userStats[user];
                    stats.lostBets++;
                    emit UserStatsUpdated(user, stats.totalBets, stats.wonBets, stats.totalWinnings, stats.netProfit);
                }
            }
            return;
        }
        
        for (uint256 i = 0; i < market.participants.length; i++) {
            address user = market.participants[i];
            Bet storage bet = marketBets[marketId][user];
            
            if (!bet.claimed) {
                UserStats storage stats = userStats[user];
                
                if (bet.prediction == market.outcome) {
                    bet.won = true;
                    bet.claimed = true;
                    uint256 payout = (bet.amount * totalPool) / winningPool;
                    
                    (bool success, ) = payable(user).call{value: payout}("");
                    if (!success) {
                        emit PaymentFailed(user, payout);
                        revert("Payment to winner failed");
                    }
                    
                    stats.wonBets++;
                    stats.totalWinnings += payout;
                    stats.netProfit += (payout - bet.amount);
                    emit WinningsClaimed(marketId, user, payout);
                } else {
                    bet.claimed = true;
                    stats.lostBets++;
                    if (stats.netProfit >= bet.amount) {
                        stats.netProfit -= bet.amount;
                    } else {
                        stats.netProfit = 0;
                    }
                }
                
                emit UserStatsUpdated(user, stats.totalBets, stats.wonBets, stats.totalWinnings, stats.netProfit);
            }
        }
    }

    function getUserStats(address user) external view returns (
        uint256 totalBets,
        uint256 wonBets,
        uint256 lostBets,
        uint256 totalWinnings,
        uint256 netProfit,
        uint256 totalAmountBet,
        uint256 winRate
    ) {
        UserStats memory stats = userStats[user];
        uint256 winRateCalc = stats.totalBets > 0 
            ? (stats.wonBets * 10000) / stats.totalBets 
            : 0;
        
        return (
            stats.totalBets,
            stats.wonBets,
            stats.lostBets,
            stats.totalWinnings,
            stats.netProfit,
            stats.totalAmountBet,
            winRateCalc
        );
    }
    
    function getAllParticipants() external view returns (address[] memory) {
        return participants;
    }
    
    function getMarket(uint256 marketId) external view returns (
        string memory question,     
        uint256 closeTime,
        uint256 betAmount,
        uint256 yesPool,
        uint256 noPool,
        bool isClosed,
        bool resolved,
        bool outcome,
        uint256 participantCount
    ) {
        require(marketId < markets.length, "Market does not exist");
        Market memory market = markets[marketId];
        return (
            market.question,      
            market.closeTime,
            market.betAmount,
            market.yesPool,
            market.noPool,
            market.isClosed,
            market.resolved,
            market.outcome,
            market.participants.length
        );
    }
    
    function getUserBet(uint256 marketId, address user) external view returns (
        bool hasBet,
        bool prediction,
        uint256 amount,
        bool claimed,
        bool won
    ) {
        Bet memory bet = marketBets[marketId][user];
        return (
            bet.amount > 0,
            bet.prediction,
            bet.amount,
            bet.claimed,
            bet.won
        );
    }
    
    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }
    
    function getMarketStatus(uint256 marketId) external view returns (
        string memory question,     
        uint256 secondsRemaining,
        bool isBettingOpen,
        bool isBettingClosed,
        bool isResolved,
        uint256 currentTime,
        uint256 closeTime
    ) {
        require(marketId < markets.length, "Market does not exist");
        Market memory market = markets[marketId];
        
        uint256 remaining = 0;
        bool bettingOpen = false;
        
        if (block.timestamp < market.closeTime && !market.isClosed) {
            remaining = market.closeTime - block.timestamp;
            bettingOpen = true;
        }
        
        return (
            market.question,       
            remaining,
            bettingOpen,
            market.isClosed,
            market.resolved,
            block.timestamp,
            market.closeTime
        );
    }
    
    function getCurrentTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
