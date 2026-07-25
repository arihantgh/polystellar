#!/bin/bash

# PolyStellar Frontend Deployment Script for Cloudflare Pages
# Usage: ./deploy-frontend.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}PolyStellar Frontend Deployment${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}Wrangler not found. Installing...${NC}"
    npm install -g wrangler
fi

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend" || exit

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if contract addresses are configured
if grep -q "YOUR_CONTRACT_ID_HERE" src/config/constants.js; then
    echo -e "${RED}Error: Contract addresses not configured${NC}"
    echo "Please update src/config/constants.js with your deployed contract addresses"
    exit 1
fi

# Run tests if they exist
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo -e "${YELLOW}Running tests...${NC}"
    npm test || echo -e "${YELLOW}Warning: Tests failed${NC}"
fi

# Build frontend
echo ""
echo -e "${YELLOW}Building frontend...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Check if logged in to Wrangler
echo ""
echo -e "${YELLOW}Checking Wrangler authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Cloudflare:${NC}"
    wrangler login
fi

# Deploy to Cloudflare Pages
echo ""
echo -e "${YELLOW}Deploying to Cloudflare Pages...${NC}"
wrangler pages deploy dist --project-name=polystellar

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo "Your application is now live!"
echo "Check the output above for your deployment URL"
echo ""
