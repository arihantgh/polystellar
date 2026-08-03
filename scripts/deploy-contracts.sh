#!/bin/bash

# PolyStellar Smart Contract Deployment Script
# Usage: ./deploy-contracts.sh [network]
# Example: ./deploy-contracts.sh testnet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NETWORK="${1:-testnet}"
IDENTITY="${2:-deployer}"

echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}PolyStellar Contract Deployment${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo "Network: $NETWORK"
echo "Identity: $IDENTITY"
echo ""

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo -e "${RED}Error: stellar CLI not found${NC}"
    echo "Install with: cargo install --locked soroban-cli"
    exit 1
fi

# Check if network is configured
if ! stellar network ls | grep -q "$NETWORK"; then
    echo -e "${YELLOW}Network $NETWORK not found. Adding...${NC}"
    if [ "$NETWORK" == "testnet" ]; then
        stellar network add --global testnet \
            --rpc-url https://soroban-testnet.stellar.org:443 \
            --network-passphrase "Test SDF Network ; September 2015"
    else
        echo -e "${RED}Error: Unknown network $NETWORK${NC}"
        exit 1
    fi
fi

# Check if identity exists
if ! stellar keys address "$IDENTITY" &> /dev/null; then
    echo -e "${YELLOW}Identity $IDENTITY not found. Creating...${NC}"
    stellar keys generate --global "$IDENTITY" --network "$NETWORK"
fi

ADMIN_ADDRESS=$(stellar keys address "$IDENTITY")
echo -e "Admin address: ${GREEN}$ADMIN_ADDRESS${NC}"
echo ""

# Fund account if on testnet
if [ "$NETWORK" == "testnet" ]; then
    echo -e "${YELLOW}Funding account...${NC}"
    curl -s "https://friendbot.stellar.org?addr=$ADMIN_ADDRESS" > /dev/null
    sleep 2
    echo -e "${GREEN}Account funded!${NC}"
fi

# Navigate to contracts directory
cd "$(dirname "$0")/../contracts" || exit

# Build contract
echo ""
echo -e "${YELLOW}Building contract...${NC}"
stellar contract build

if [ ! -f "target/wasm32v1-none/release/polystellar_contracts.wasm" ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Optimize contract
echo ""
echo -e "${YELLOW}Optimizing contract...${NC}"
stellar contract optimize \
    --wasm target/wasm32v1-none/release/polystellar_contracts.wasm

echo -e "${GREEN}Optimization complete!${NC}"

# Deploy contract
echo ""
echo -e "${YELLOW}Deploying prediction market contract...${NC}"
CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32v1-none/release/polystellar_contracts.wasm \
    --source "$IDENTITY" \
    --network "$NETWORK")

echo -e "${GREEN}Contract deployed!${NC}"
echo -e "Contract ID: ${GREEN}$CONTRACT_ID${NC}"

# Deploy/wrap token
echo ""
echo -e "${YELLOW}Wrapping native token...${NC}"
TOKEN_ID=$(stellar contract id asset \
    --asset native \
    --network "$NETWORK")

echo -e "${GREEN}Token wrapped!${NC}"
echo -e "Token ID: ${GREEN}$TOKEN_ID${NC}"

# Initialize contract
echo ""
echo -e "${YELLOW}Initializing contract...${NC}"
stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- initialize \
    --admin "$ADMIN_ADDRESS" \
    --token "$TOKEN_ID"

echo -e "${GREEN}Contract initialized!${NC}"

# Verify deployment
echo ""
echo -e "${YELLOW}Verifying deployment...${NC}"
MARKET_COUNT=$(stellar contract invoke \
    --id "$CONTRACT_ID" \
    --network "$NETWORK" \
    --source-account "$IDENTITY" \
    -- get_market_count)

echo -e "Market count: ${GREEN}$MARKET_COUNT${NC}"

# Save deployment info
DEPLOYMENT_FILE="../deployment-info.txt"
cat > "$DEPLOYMENT_FILE" << EOF
=== PolyStellar Deployment Info ===
Network: $NETWORK
Date: $(date)
Identity: $IDENTITY

CONTRACT_ID=$CONTRACT_ID
TOKEN_ID=$TOKEN_ID
ADMIN_ADDRESS=$ADMIN_ADDRESS

Status: Successfully deployed and initialized
Market Count: $MARKET_COUNT
EOF

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "Deployment info saved to: ${GREEN}$DEPLOYMENT_FILE${NC}"
echo ""
echo "Next steps:"
echo "1. Update frontend/src/config/constants.js with:"
echo -e "   CONTRACT_ID = '${GREEN}$CONTRACT_ID${NC}'"
echo -e "   TOKEN_ID = '${GREEN}$TOKEN_ID${NC}'"
echo "2. Deploy frontend with: cd frontend && npm run build && wrangler pages deploy dist"
echo ""
