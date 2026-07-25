# User Guide - PolyStellar Prediction Market

Welcome to PolyStellar! This guide will help you get started with trading on our decentralized prediction market platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Connecting Your Wallet](#connecting-your-wallet)
3. [Browsing Markets](#browsing-markets)
4. [Understanding Market Prices](#understanding-market-prices)
5. [Trading](#trading)
6. [Managing Your Portfolio](#managing-your-portfolio)
7. [Creating Markets](#creating-markets)
8. [Claiming Winnings](#claiming-winnings)
9. [FAQ](#faq)

## Getting Started

### What is PolyStellar?

PolyStellar is a decentralized prediction market where you can trade on the outcomes of future real-world events. Each market has two outcomes: YES or NO. You can buy shares in either outcome, and if you're correct, you'll profit when the market resolves.

### Prerequisites

Before you start, you'll need:

1. **Freighter Wallet**: Install the Freighter browser extension
   - Visit: https://www.freighter.app/
   - Available for Chrome, Firefox, and Edge

2. **Testnet XLM**: Get free test tokens
   - Visit: https://laboratory.stellar.org/#account-creator?network=test
   - Paste your address and click "Get test network lumens"

## Connecting Your Wallet

### Step 1: Install Freighter

1. Go to https://www.freighter.app/
2. Click "Add to Chrome" (or your browser)
3. Follow the installation instructions

### Step 2: Create or Import Wallet

**Create New Wallet**:
1. Open Freighter extension
2. Click "Create New Wallet"
3. Write down your 12-word recovery phrase
4. **IMPORTANT**: Store this phrase securely - it's the only way to recover your wallet!
5. Confirm your recovery phrase
6. Set a password

**Import Existing Wallet**:
1. Open Freighter extension
2. Click "Import Wallet"
3. Enter your 12-word recovery phrase
4. Set a password

### Step 3: Switch to Testnet

1. Open Freighter
2. Click the settings icon (gear)
3. Select "Network"
4. Choose "Test Net"

### Step 4: Connect to PolyStellar

1. Visit the PolyStellar app
2. Click "Connect Wallet" in the top right
3. Freighter will open - click "Connect"
4. Your address will appear in the navigation bar

## Browsing Markets

### Market Card Information

Each market card shows:
- **Question**: What the market is predicting
- **Description**: How the market will be resolved
- **Current Prices**: YES and NO percentages
- **Liquidity**: Total tokens locked in the market
- **Time Remaining**: When trading ends
- **Status**: Active, Closed, or Resolved

### Market Status

- **Active** 🟢: You can trade
- **Closed** 🟡: Trading ended, waiting for resolution
- **Resolved** 🔵: Outcome determined, winners can claim

### Filtering Markets

Use the tabs to filter:
- **All**: Show all markets
- **Active**: Only markets you can trade in
- **My Markets**: Markets where you have positions

## Understanding Market Prices

### How Prices Work

Prices are shown as percentages (0-100%):
- **YES at 65%**: The market thinks there's a 65% chance of YES
- **NO at 35%**: The market thinks there's a 35% chance of NO
- YES + NO always equals 100%

### Price Movement

Prices move based on trading:
- When someone buys YES, YES price increases
- When someone sells YES, YES price decreases
- Prices reflect the market's collective prediction

### Example

```
Market: "Will it rain tomorrow?"

Initial: YES 50% | NO 50%

After many people buy YES:
Result: YES 75% | NO 25%

Interpretation: The market thinks there's a 75% chance of rain
```

## Trading

### Buying Shares

**Step 1**: Click on a market to open details

**Step 2**: Select "Buy" tab

**Step 3**: Choose outcome (YES or NO)

**Step 4**: Enter amount of tokens to spend

**Step 5**: Review the transaction:
- Amount you're spending
- Estimated shares you'll receive
- New price after your trade

**Step 6**: Click "Buy YES" (or "Buy NO")

**Step 7**: Approve transaction in Freighter

### Selling Shares

**Step 1**: Open a market where you have shares

**Step 2**: Select "Sell" tab

**Step 3**: Choose outcome (YES or NO)

**Step 4**: Enter number of shares to sell

**Step 5**: Review:
- Shares you're selling
- Estimated tokens you'll receive
- New price after your trade

**Step 6**: Click "Sell YES" (or "Sell NO")

**Step 7**: Approve transaction in Freighter

### Trading Tips

**For Beginners**:
- Start with small amounts
- Trade in markets you understand
- Read the resolution criteria carefully
- Don't invest more than you can afford to lose

**Price Impact**:
- Large trades move prices more
- Consider breaking large trades into smaller ones
- Check the estimated shares/tokens before confirming

**Timing**:
- Prices change as new information emerges
- Earlier trades often get better prices
- Don't wait until the last minute (trading ends before resolution)

## Managing Your Portfolio

### Viewing Your Positions

1. Click "Portfolio" in the navigation
2. See all your positions across markets
3. Each card shows:
   - Market question
   - Your YES shares
   - Your NO shares
   - Market status
   - Potential winnings (if resolved in your favor)

### Calculating Potential Profit

```
Example:
- You bought 100 YES shares at 40% (cost: 40 tokens)
- Current YES price: 60%
- Current value: 60 tokens
- Unrealized profit: 20 tokens (50%)

If market resolves YES:
- Your payout: ~100 tokens (varies based on total shares)
- Net profit: ~60 tokens (150%)

If market resolves NO:
- Your payout: 0 tokens
- Net loss: 40 tokens (100%)
```

### Risk Management

**Diversify**:
- Don't put all tokens in one market
- Trade in multiple markets
- Balance high-confidence and high-reward trades

**Hedging**:
- You can hold both YES and NO shares in the same market
- Useful if you want to reduce risk
- Acts as insurance against being wrong

**Exit Strategy**:
- You can sell shares before market resolves
- Lock in profits if price moves in your favor
- Cut losses if new information emerges

## Creating Markets

### Who Can Create Markets?

Anyone with tokens can create a market!

### Requirements

- Minimum 100 tokens for initial liquidity
- Clear yes/no question
- Objective resolution criteria
- Future end date
- Resolution date after end date

### Step-by-Step

**Step 1**: Click "Create Market" in navigation

**Step 2**: Fill in market details:

**Question**:
- Clear yes/no question
- Specific and unambiguous
- Example: "Will Bitcoin reach $100,000 by end of 2025?"

**Description**:
- How will the market be resolved?
- What sources will be used?
- What counts as YES/NO?
- Example: "Resolves YES if Bitcoin trades at or above $100,000 on Coinbase, Binance, or Kraken by December 31, 2025, 23:59 UTC"

**End Date**: When should trading stop?
- Should be before the event concludes
- Allow time for resolution

**Resolution Date**: When will outcome be determined?
- Must be after end date
- Allow time to gather information

**Initial Liquidity**: How many tokens to lock?
- Minimum: 100 tokens
- More liquidity = more stable prices
- You can trade in your own market

**Step 3**: Review your market

**Step 4**: Click "Create Market"

**Step 5**: Approve transaction in Freighter

**Step 6**: Your market is now live!

### Best Practices

**Good Questions**:
✅ "Will Team A win the championship?"
✅ "Will unemployment rate drop below 5% this quarter?"
✅ "Will new product launch by March 2025?"

**Bad Questions**:
❌ "Will the economy improve?" (too vague)
❌ "Is cryptocurrency good?" (subjective)
❌ "Multiple things happening?" (not yes/no)

**Resolution Criteria**:
- Be specific about data sources
- Define edge cases
- Make it verifiable by anyone
- Include exact times/dates

## Claiming Winnings

### When Can You Claim?

After a market resolves in your favor:
1. Market must be in "Resolved" status
2. You must hold shares in the winning outcome
3. One claim per market per user

### How to Claim

**From Portfolio**:
1. Go to "Portfolio"
2. Find resolved markets (marked with 🔵)
3. Markets you won will say "Click to claim winnings"
4. Click the market card

**From Market Page**:
1. Open the resolved market
2. You'll see "Claim Winnings" button
3. Click to claim
4. Approve transaction in Freighter

### Payout Calculation

```
Your Payout = (Your Winning Shares / Total Winning Shares) × Total Liquidity

Example:
- Market has 1000 total tokens
- 500 total YES shares
- You hold 50 YES shares
- Market resolves YES

Your Payout = (50 / 500) × 1000 = 100 tokens
```

## FAQ

### Trading Questions

**Q: What's the minimum trade size?**
A: Any positive amount, but consider network fees.

**Q: Can I cancel a trade?**
A: No, once confirmed on the blockchain, trades are final.

**Q: Why did my price change?**
A: Prices update in real-time as others trade.

**Q: Can I trade after the end date?**
A: No, trading stops at the end date.

### Wallet Questions

**Q: I lost my recovery phrase. What do I do?**
A: Unfortunately, there's no way to recover without your phrase. Start a new wallet.

**Q: Are my tokens safe?**
A: Yes! PolyStellar is non-custodial. You always control your tokens.

**Q: What are network fees?**
A: Small fees paid to Stellar network validators (usually < 0.01 XLM).

### Market Questions

**Q: Who decides the outcome?**
A: Currently, the platform admin. Future versions will use oracles or community voting.

**Q: What if a market is resolved incorrectly?**
A: Contact support immediately. On mainnet, there will be dispute mechanisms.

**Q: Can I delete my market?**
A: No, markets are permanent once created.

### Technical Questions

**Q: Which network is PolyStellar on?**
A: Currently Stellar Testnet. Mainnet deployment coming soon.

**Q: Is the code open source?**
A: Yes! Check our GitHub repository.

**Q: How are prices calculated?**
A: Using an Automated Market Maker (constant product formula).

## Need Help?

- **GitHub Issues**: Report bugs or request features
- **Discord**: Join the Stellar community
- **Documentation**: Check the `/docs` folder
- **Twitter**: Follow for updates

## Safety Tips

🔐 **Security**:
- Never share your recovery phrase
- Double-check contract addresses
- Start with small amounts
- Use testnet before mainnet

📊 **Trading**:
- Do your own research
- Understand the market before trading
- Read resolution criteria carefully
- Don't trade more than you can afford to lose

✅ **Best Practices**:
- Verify market sources
- Check market creator reputation (coming soon)
- Watch for unusual price movements
- Ask questions if unsure

---

Happy trading! 🚀

Built with ❤️ on Stellar Blockchain
