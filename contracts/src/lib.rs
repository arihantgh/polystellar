#![no_std]

mod market;
mod types;

use soroban_sdk::{contract, contractimpl, token, Address, Env, String, Vec};

use crate::market::{calculate_price, calculate_shares_buy, calculate_tokens_returned};
use crate::types::{DataKey, Market, MarketStatus, Outcome, Position};

/// Polystellar prediction market contract.
///
/// Users create markets on future binary-outcome events, buy/sell YES/NO shares
/// through a constant-product AMM, and claim payouts after resolution.
///
/// # Contract methods (entry points)
///
/// | Method              | Description                                  |
/// |---------------------|----------------------------------------------|
/// | `initialize`        | Set admin + token address (one-time)         |
/// | `create_market`     | Deploy a new prediction market               |
/// | `buy_shares`        | Buy YES or NO shares from the AMM            |
/// | `sell_shares`       | Sell YES or NO shares back to the AMM        |
/// | `resolve_market`    | Admin resolves market to YES or NO           |
/// | `claim_winnings`    | User claims payout from a resolved market    |
/// | `get_market`        | Read a single market by ID                   |
/// | `get_position`      | Read a user's position in a market           |
/// | `get_market_count`  | Total number of markets created              |
/// | `get_all_markets`   | Paginated list of all markets                |
/// | `get_price`         | Current YES/NO price in basis points         |
#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {
    /// Initialize the contract with admin and token address (one-time).
    pub fn initialize(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenAddress, &token);
        env.storage().instance().set(&DataKey::MarketCount, &0u64);
    }

    /// Create a new prediction market.  Transfers `initial_liquidity` from
    /// `creator` to the contract and splits it evenly into YES/NO shares.
    ///
    /// Minimum initial liquidity is 100 tokens (100_0000000 in 7-decimal units).
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

        let current_time = env.ledger().timestamp();
        if end_time <= current_time || resolution_time <= end_time {
            panic!("Invalid timestamps");
        }
        if initial_liquidity < 100_0000000 {
            panic!("Insufficient initial liquidity");
        }

        let mut market_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::MarketCount)
            .unwrap_or(0);
        market_count += 1;

        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&creator, &env.current_contract_address(), &initial_liquidity);

        let initial_shares = initial_liquidity / 2;
        let market = Market {
            id: market_count,
            creator: creator.clone(),
            question,
            description,
            end_time,
            resolution_time,
            status: MarketStatus::Active,
            resolved_outcome: -1,
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

    /// Buy YES or NO shares from the AMM.
    ///
    /// Uses a constant-product formula (`x * y = k`) where adding tokens to one
    /// side removes shares from that side (the user receives those removed shares).
    /// Returns the number of shares received.
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

        let market_key = DataKey::Market(market_id);
        let mut market: Market = env
            .storage()
            .persistent()
            .get(&market_key)
            .unwrap_or_else(|| panic!("Market not found"));

        if market.status != MarketStatus::Active {
            panic!("Market not active");
        }
        if env.ledger().timestamp() >= market.end_time {
            panic!("Market has ended");
        }

        let shares_received =
            calculate_shares_buy(market.yes_shares, market.no_shares, amount, outcome);
        if shares_received <= 0 {
            panic!("Insufficient liquidity");
        }

        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

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

    /// Sell YES or NO shares back to the AMM.
    ///
    /// Returns the number of tokens received.  The AMM price moves in the
    /// opposite direction of a buy (increasing the pool's shares on that side).
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

        let position_key = DataKey::Position(user.clone(), market_id);
        let mut position: Position = env
            .storage()
            .persistent()
            .get(&position_key)
            .unwrap_or_else(|| panic!("No position found"));

        match outcome {
            Outcome::Yes if position.yes_shares < shares => panic!("Insufficient YES shares"),
            Outcome::No if position.no_shares < shares => panic!("Insufficient NO shares"),
            _ => {}
        }

        let market_key = DataKey::Market(market_id);
        let mut market: Market = env
            .storage()
            .persistent()
            .get(&market_key)
            .unwrap_or_else(|| panic!("Market not found"));

        if market.status != MarketStatus::Active {
            panic!("Market not active");
        }

        let tokens_returned =
            calculate_tokens_returned(market.yes_shares, market.no_shares, shares, outcome);
        if tokens_returned <= 0 {
            panic!("Invalid sell amount");
        }

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

        match outcome {
            Outcome::Yes => position.yes_shares -= shares,
            Outcome::No => position.no_shares -= shares,
        }
        env.storage().persistent().set(&position_key, &position);

        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &user, &tokens_returned);

        tokens_returned
    }

    /// Resolve a market to YES or NO (admin-only).
    ///
    /// Can only be called after `resolution_time` has passed.
    pub fn resolve_market(env: Env, admin: Address, market_id: u64, outcome: Outcome) {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Unauthorized");
        }

        let market_key = DataKey::Market(market_id);
        let mut market: Market = env
            .storage()
            .persistent()
            .get(&market_key)
            .unwrap_or_else(|| panic!("Market not found"));

        if market.status == MarketStatus::Resolved {
            panic!("Market already resolved");
        }
        if env.ledger().timestamp() < market.resolution_time {
            panic!("Too early to resolve");
        }

        market.status = MarketStatus::Resolved;
        market.resolved_outcome = outcome as i32;
        env.storage().persistent().set(&market_key, &market);
    }

    /// Claim winnings from a resolved market.
    ///
    /// Users receive a proportional share of the total liquidity based on their
    /// winning shares relative to all winning shares in circulation.
    pub fn claim_winnings(env: Env, user: Address, market_id: u64) -> i128 {
        user.require_auth();

        let market: Market = env
            .storage()
            .persistent()
            .get(&DataKey::Market(market_id))
            .unwrap_or_else(|| panic!("Market not found"));

        if market.status != MarketStatus::Resolved {
            panic!("Market not resolved");
        }
        if market.resolved_outcome < 0 {
            panic!("Market outcome not set");
        }

        let outcome = if market.resolved_outcome == 0 {
            Outcome::Yes
        } else {
            Outcome::No
        };

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

        // NOTE: Payout uses the difference between initial pool and remaining pool
        // to estimate total winning shares in circulation.  This is a simplification
        // — a production contract should track cumulative user shares independently.
        let initial_shares = market.total_liquidity / 2;
        let total_winning_shares = match outcome {
            Outcome::Yes => initial_shares - market.yes_shares,
            Outcome::No => initial_shares - market.no_shares,
        };
        if total_winning_shares <= 0 {
            panic!("No winning shares in circulation");
        }

        let payout = (winning_shares * market.total_liquidity) / total_winning_shares;

        match outcome {
            Outcome::Yes => position.yes_shares = 0,
            Outcome::No => position.no_shares = 0,
        }
        env.storage().persistent().set(&position_key, &position);

        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &user, &payout);

        payout
    }

    // -----------------------------------------------------------------------
    // Read-only queries
    // -----------------------------------------------------------------------

    /// Get a single market by ID.
    pub fn get_market(env: Env, market_id: u64) -> Market {
        env.storage()
            .persistent()
            .get(&DataKey::Market(market_id))
            .unwrap_or_else(|| panic!("Market not found"))
    }

    /// Get a user's position (YES/NO shares) in a given market.
    /// Returns a zero-filled position if none exists.
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

    /// Total number of markets created on this contract.
    pub fn get_market_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::MarketCount)
            .unwrap_or(0)
    }

    /// Paginated list of all markets in range `[start + 1, start + limit]`.
    ///
    /// Using `start = 0` returns markets starting from ID 1.  Pass a larger
    /// `start` to skip already-fetched markets.
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

    /// Current price for an outcome in basis points (10 000 = 100 %).
    ///
    /// Price reflects the ratio of the *opposite* pool to the total pool, which
    /// is how a constant-product AMM prices shares.
    pub fn get_price(env: Env, market_id: u64, outcome: Outcome) -> i128 {
        let market: Market = env
            .storage()
            .persistent()
            .get(&DataKey::Market(market_id))
            .unwrap_or_else(|| panic!("Market not found"));

        calculate_price(market.yes_shares, market.no_shares, outcome)
    }
}
