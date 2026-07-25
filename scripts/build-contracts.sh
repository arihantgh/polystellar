#!/bin/bash

# Build script for PolyStellar contracts
# Ensures WASM target is installed and builds contracts

set -e

echo "🔧 Checking Rust setup..."

# Check if wasm32-unknown-unknown target is installed
if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo "📦 Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
else
    echo "✅ wasm32-unknown-unknown target already installed"
fi

# Navigate to contracts directory
cd "$(dirname "$0")/../contracts" || exit

echo "🔨 Building contracts..."
cargo build --target wasm32-unknown-unknown --release

echo ""
echo "✅ Build successful!"
echo ""
echo "WASM file location:"
echo "  target/wasm32-unknown-unknown/release/polystellar_contracts.wasm"
echo ""
echo "Next steps:"
echo "  1. Deploy with: soroban contract deploy --wasm target/wasm32-unknown-unknown/release/polystellar_contracts.wasm --source deployer --network testnet"
echo "  2. Or use: ../scripts/deploy-contracts.sh testnet"
echo ""
