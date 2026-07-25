use soroban_sdk::{contracttype, Address, String};

/// Represents the outcome of a market event
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Outcome {
    Yes = 0,
    No = 1,
}

/// Status of a prediction market
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum MarketStatus {
    Active = 0,
    Closed = 1,
    Resolved = 2,
}

/// Market information
#[contracttype]
#[derive(Clone, Debug)]
pub struct Market {
    pub id: u64,
    pub creator: Address,
    pub question: String,
    pub description: String,
    pub end_time: u64,
    pub resolution_time: u64,
    pub status: MarketStatus,
    pub resolved_outcome: i32, // -1 = unresolved, 0 = Yes, 1 = No
    pub yes_shares: i128,
    pub no_shares: i128,
    pub total_liquidity: i128,
}

/// User position in a market
#[contracttype]
#[derive(Clone, Debug)]
pub struct Position {
    pub user: Address,
    pub market_id: u64,
    pub yes_shares: i128,
    pub no_shares: i128,
}

/// Storage keys
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    MarketCount,
    Market(u64),
    Position(Address, u64),
    TokenAddress,
}
