#!/bin/bash

# Create a test market on deployed contract
# Usage: ./create-test-market.sh [contract_id] [identity]

set -e

CONTRACT_ID="${1}"
IDENTITY="${2:-deployer}"
NETWORK="testnet"

if [ -z "$CONTRACT_ID" ]; then
    echo "Usage: ./create-test-market.sh CONTRACT_ID [identity]"
    echo "Example: ./create-test-market.sh CXXXXX... deployer"
    exit 1
fi

echo "Creating test market..."
echo "Contract: $CONTRACT_ID"
echo "Identity: $IDENTITY"
echo ""

CREATOR=$(soroban keys address "$IDENTITY")

# Calculate timestamps
END_TIME=$(date -d "+7 days" +%s 2>/dev/null || date -v+7d +%s)
RESOLUTION_TIME=$(date -d "+8 days" +%s 2>/dev/null || date -v+8d +%s)

# Create market
MARKET_ID=$(soroban contract invoke \
    --id "$CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- create_market \
    --creator "$CREATOR" \
    --question "Will Bitcoin reach $100,000 by end of 2025?" \
    --description "This market resolves YES if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange (Coinbase, Binance, Kraken) by December 31, 2025, 23:59:59 UTC." \
    --end-time "$END_TIME" \
    --resolution-time "$RESOLUTION_TIME" \
    --initial-liquidity 10000000000)

echo ""
echo "Market created successfully!"
echo "Market ID: $MARKET_ID"
echo ""
echo "Market details:"
soroban contract invoke \
    --id "$CONTRACT_ID" \
    --network "$NETWORK" \
    -- get_market \
    --market-id "$MARKET_ID"
