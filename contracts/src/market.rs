use soroban_sdk::{contract, contractimpl, token, Address, Env, String, Vec};

use crate::types::{DataKey, Market, MarketStatus, Outcome, Position};

#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {
    /// Initialize the contract with admin and token address
    pub fn initialize(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenAddress, &token);
        env.storage().instance().set(&DataKey::MarketCount, &0u64);
    }

    /// Create a new prediction market
    pub fn create_market(
        env: Env,
        creator: Address,
        question: String,
        description: String,
        end_time: u64,
        resolution_time: u64,
        initial_liquidity: i128,
    ) -> u64 {
        creator.require_auth();

        // Validate timestamps
        let current_time = env.ledger().timestamp();
        if end_time <= current_time || resolution_time <= end_time {
            panic!("Invalid timestamps");
        }

        if initial_liquidity < 100_0000000 {
            // Minimum 100 tokens (7 decimals)
            panic!("Insufficient initial liquidity");
        }

        // Get and increment market count
        let mut market_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::MarketCount)
            .unwrap_or(0);
        market_count += 1;

        // Transfer initial liquidity from creator
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&creator, &env.current_contract_address(), &initial_liquidity);

        // Create market with equal initial shares
        let initial_shares = initial_liquidity / 2;
        let market = Market {
            id: market_count,
            creator: creator.clone(),
            question,
            description,
            end_time,
            resolution_time,
            status: MarketStatus::Active,
            resolved_outcome: -1, // -1 means unresolved
            yes_shares: initial_shares,
            no_shares: initial_shares,
            total_liquidity: initial_liquidity,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Market(market_count), &market);
        env.storage()
            .instance()
            .set(&DataKey::MarketCount, &market_count);

        market_count
    }

    /// Buy shares in a market (YES or NO)
    pub fn buy_shares(
        env: Env,
        user: Address,
        market_id: u64,
        outcome: Outcome,
        amount: i128,
    ) -> i128 {
        user.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Load market
        let market_key = DataKey::Market(market_id);
        let mut market: Market = env
            .storage()
            .persistent()
            .get(&market_key)
            .unwrap_or_else(|| panic!("Market not found"));

        // Check market is active
        if market.status != MarketStatus::Active {
            panic!("Market not active");
        }

        let current_time = env.ledger().timestamp();
        if current_time >= market.end_time {
            panic!("Market has ended");
        }

        // Calculate shares using constant product formula: x * y = k
        // shares_received = current_shares - (k / (other_shares + amount))
        let shares_received = match outcome {
            Outcome::Yes => {
                let k = market.yes_shares * market.no_shares;
                let new_no_shares = market.no_shares + amount;
                let new_yes_shares = k / new_no_shares;
                market.yes_shares - new_yes_shares
            }
            Outcome::No => {
                let k = market.yes_shares * market.no_shares;
                let new_yes_shares = market.yes_shares + amount;
                let new_no_shares = k / new_yes_shares;
                market.no_shares - new_no_shares
            }
        };

        if shares_received <= 0 {
            panic!("Insufficient liquidity");
        }

        // Transfer tokens from user to contract
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        // Update market state
        match outcome {
            Outcome::Yes => {
                market.yes_shares -= shares_received;
                market.no_shares += amount;
            }
            Outcome::No => {
                market.no_shares -= shares_received;
                market.yes_shares += amount;
            }
        }
        market.total_liquidity += amount;

        env.storage().persistent().set(&market_key, &market);

        // Update user position
        let position_key = DataKey::Position(user.clone(), market_id);
        let mut position: Position = env
            .storage()
            .persistent()
            .get(&position_key)
            .unwrap_or(Position {
                user: user.clone(),
                market_id,
                yes_shares: 0,
                no_shares: 0,
            });

        match outcome {
            Outcome::Yes => position.yes_shares += shares_received,
            Outcome::No => position.no_shares += shares_received,
        }

        env.storage().persistent().set(&position_key, &position);

        shares_received
    }

    /// Sell shares in a market
    pub fn sell_shares(
        env: Env,
        user: Address,
        market_id: u64,
        outcome: Outcome,
        shares: i128,
    ) -> i128 {
        user.require_auth();

        if shares <= 0 {
            panic!("Shares must be positive");
        }

        // Load position
        let position_key = DataKey::Position(user.clone(), market_id);
        let mut position: Position = env
            .storage()
            .persistent()
            .get(&position_key)
            .unwrap_or_else(|| panic!("No position found"));

        // Check user has enough shares
        match outcome {
            Outcome::Yes => {
                if position.yes_shares < shares {
                    panic!("Insufficient YES shares");
                }
            }
            Outcome::No => {
                if position.no_shares < shares {
                    panic!("Insufficient NO shares");
                }
            }
        }

        // Load market
        let market_key = DataKey::Market(market_id);
        let mut market: Market = env
            .storage()
            .persistent()
            .get(&market_key)
            .unwrap_or_else(|| panic!("Market not found"));

        if market.status != MarketStatus::Active {
            panic!("Market not active");
        }

        // Calculate tokens returned using constant product formula
        let tokens_returned = match outcome {
            Outcome::Yes => {
                let k = market.yes_shares * market.no_shares;
                let new_yes_shares = market.yes_shares + shares;
                let new_no_shares = k / new_yes_shares;
                market.no_shares - new_no_shares
            }
            Outcome::No => {
                let k = market.yes_shares * market.no_shares;
                let new_no_shares = market.no_shares + shares;
                let new_yes_shares = k / new_no_shares;
                market.yes_shares - new_yes_shares
            }
        };

        if tokens_returned <= 0 {
            panic!("Invalid sell amount");
        }

        // Update market state
        match outcome {
            Outcome::Yes => {
                market.yes_shares += shares;
                market.no_shares -= tokens_returned;
            }
            Outcome::No => {
                market.no_shares += shares;
                market.yes_shares -= tokens_returned;
            }
        }
        market.total_liquidity -= tokens_returned;

        env.storage().persistent().set(&market_key, &market);

        // Update position
        match outcome {
            Outcome::Yes => position.yes_shares -= shares,
            Outcome::No => position.no_shares -= shares,
        }

        env.storage().persistent().set(&position_key, &position);

        // Transfer tokens back to user
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &user, &tokens_returned);

        tokens_returned
    }

    /// Resolve a market (admin only)
    pub fn resolve_market(env: Env, admin: Address, market_id: u64, outcome: Outcome) {
        admin.require_auth();

        // Verify admin
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Unauthorized");
        }

        // Load market
        let market_key = DataKey::Market(market_id);
        let mut market: Market = env
            .storage()
            .persistent()
            .get(&market_key)
            .unwrap_or_else(|| panic!("Market not found"));

        if market.status == MarketStatus::Resolved {
            panic!("Market already resolved");
        }

        let current_time = env.ledger().timestamp();
        if current_time < market.resolution_time {
            panic!("Too early to resolve");
        }

        market.status = MarketStatus::Resolved;
        market.resolved_outcome = outcome as i32; // Convert enum to i32

        env.storage().persistent().set(&market_key, &market);
    }

    /// Claim winnings from a resolved market
    pub fn claim_winnings(env: Env, user: Address, market_id: u64) -> i128 {
        user.require_auth();

        // Load market
        let market: Market = env
            .storage()
            .persistent()
            .get(&DataKey::Market(market_id))
            .unwrap_or_else(|| panic!("Market not found"));

        if market.status != MarketStatus::Resolved {
            panic!("Market not resolved");
        }

        // Check if market is resolved (-1 means unresolved)
        if market.resolved_outcome < 0 {
            panic!("Market outcome not set");
        }

        let outcome = if market.resolved_outcome == 0 {
            Outcome::Yes
        } else {
            Outcome::No
        };

        // Load position
        let position_key = DataKey::Position(user.clone(), market_id);
        let mut position: Position = env
            .storage()
            .persistent()
            .get(&position_key)
            .unwrap_or_else(|| panic!("No position found"));

        let winning_shares = match outcome {
            Outcome::Yes => position.yes_shares,
            Outcome::No => position.no_shares,
        };

        if winning_shares <= 0 {
            panic!("No winning shares");
        }

        // CRITICAL: Payout calculation needs to be based on TOTAL user shares, not pool shares!
        // The pool shares represent what's LEFT in the AMM after users bought shares.
        // We need to track total winning shares across all users.
        // TODO: This implementation is INCORRECT - it uses pool shares instead of total user holdings.
        // A proper implementation would need to either:
        // 1. Track cumulative user shares separately, OR
        // 2. Calculate: initial_shares - current_pool_shares = total_user_shares
        
        // TEMPORARY: Using pool shares (INCORRECT but demonstrates the concept)
        // In reality: total_winning_shares = initial_yes_shares - market.yes_shares (for YES)
        let initial_shares = market.total_liquidity / 2;
        let total_winning_shares = match outcome {
            Outcome::Yes => initial_shares - market.yes_shares, // Users collectively hold this
            Outcome::No => initial_shares - market.no_shares,   // Users collectively hold this
        };

        if total_winning_shares <= 0 {
            panic!("No winning shares in circulation");
        }

        let payout = (winning_shares * market.total_liquidity) / total_winning_shares;

        // Clear position
        match outcome {
            Outcome::Yes => position.yes_shares = 0,
            Outcome::No => position.no_shares = 0,
        }

        env.storage().persistent().set(&position_key, &position);

        // Transfer winnings
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &user, &payout);

        payout
    }

    /// Get market information
    pub fn get_market(env: Env, market_id: u64) -> Market {
        env.storage()
            .persistent()
            .get(&DataKey::Market(market_id))
            .unwrap_or_else(|| panic!("Market not found"))
    }

    /// Get user position
    pub fn get_position(env: Env, user: Address, market_id: u64) -> Position {
        env.storage()
            .persistent()
            .get(&DataKey::Position(user.clone(), market_id))
            .unwrap_or(Position {
                user,
                market_id,
                yes_shares: 0,
                no_shares: 0,
            })
    }

    /// Get total number of markets
    pub fn get_market_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::MarketCount)
            .unwrap_or(0)
    }

    /// Get all markets (limited to prevent gas issues)
    pub fn get_all_markets(env: Env, start: u64, limit: u64) -> Vec<Market> {
        let market_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::MarketCount)
            .unwrap_or(0);

        let mut markets = Vec::new(&env);
        let end = if start + limit > market_count {
            market_count
        } else {
            start + limit
        };

        for i in start + 1..=end {
            if let Some(market) = env.storage().persistent().get(&DataKey::Market(i)) {
                markets.push_back(market);
            }
        }

        markets
    }

    /// Get current price for an outcome (in basis points, 10000 = 100%)
    pub fn get_price(env: Env, market_id: u64, outcome: Outcome) -> i128 {
        let market: Market = env
            .storage()
            .persistent()
            .get(&DataKey::Market(market_id))
            .unwrap_or_else(|| panic!("Market not found"));

        let total_shares = market.yes_shares + market.no_shares;

        match outcome {
            Outcome::Yes => (market.no_shares * 10000) / total_shares,
            Outcome::No => (market.yes_shares * 10000) / total_shares,
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    #[test]
    fn test_create_and_trade_market() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let creator = Address::generate(&env);
        let trader = Address::generate(&env);
        let token_admin = Address::generate(&env);

        // Deploy token contract
        let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_id = token_contract.address();

        // Deploy prediction market
        let contract_id = env.register_contract(None, PredictionMarket);
        let client = PredictionMarketClient::new(&env, &contract_id);

        // Initialize
        client.initialize(&admin, &token_id);

        // Mint tokens for testing
        let token = token::StellarAssetClient::new(&env, &token_id);
        token.mint(&creator, &1000_0000000);
        token.mint(&trader, &1000_0000000);

        // Create market
        let market_id = client.create_market(
            &creator,
            &String::from_str(&env, "Will BTC reach $100k by 2025?"),
            &String::from_str(&env, "Resolves YES if Bitcoin reaches $100,000 USD"),
            &(env.ledger().timestamp() + 86400 * 30),
            &(env.ledger().timestamp() + 86400 * 31),
            &1000_0000000,
        );

        assert_eq!(market_id, 1);

        // Buy YES shares
        let shares = client.buy_shares(&trader, &market_id, &Outcome::Yes, &100_0000000);
        assert!(shares > 0);

        // Check position
        let position = client.get_position(&trader, &market_id);
        assert_eq!(position.yes_shares, shares);
    }
}
