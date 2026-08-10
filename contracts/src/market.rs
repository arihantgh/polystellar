use crate::types::Outcome;

// ---------------------------------------------------------------------------
// AMM math helpers
// ---------------------------------------------------------------------------

/// Calculate shares received when buying a given token amount from a
/// constant-product AMM (x * y = k).
pub fn calculate_shares_buy(
    yes_shares: i128,
    no_shares: i128,
    amount: i128,
    outcome: Outcome,
) -> i128 {
    let k = yes_shares * no_shares;
    match outcome {
        Outcome::Yes => {
            let new_no_shares = no_shares + amount;
            yes_shares - k / new_no_shares
        }
        Outcome::No => {
            let new_yes_shares = yes_shares + amount;
            no_shares - k / new_yes_shares
        }
    }
}

/// Calculate tokens returned when selling a given number of shares back to
/// the constant-product AMM.
pub fn calculate_tokens_returned(
    yes_shares: i128,
    no_shares: i128,
    shares: i128,
    outcome: Outcome,
) -> i128 {
    let k = yes_shares * no_shares;
    match outcome {
        Outcome::Yes => {
            let new_yes_shares = yes_shares + shares;
            no_shares - k / new_yes_shares
        }
        Outcome::No => {
            let new_no_shares = no_shares + shares;
            yes_shares - k / new_no_shares
        }
    }
}

/// Calculate the price of an outcome in basis points (10 000 = 100 %).
pub fn calculate_price(yes_shares: i128, no_shares: i128, outcome: Outcome) -> i128 {
    let total = yes_shares + no_shares;
    match outcome {
        Outcome::Yes => (no_shares * 10000) / total,
        Outcome::No => (yes_shares * 10000) / total,
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod test {
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::{Address, Env, String};

    use crate::types::{MarketStatus, Outcome};
    use crate::PredictionMarketClient;

    /// Deploy a token, register the contract, initialize, and mint test tokens.
    /// Returns (client, admin, creator, trader, token_id).
    fn setup_test(
        env: &Env,
    ) -> (PredictionMarketClient<'_>, Address, Address, Address, Address) {
        let admin = Address::generate(env);
        let creator = Address::generate(env);
        let trader = Address::generate(env);
        let token_admin = Address::generate(env);

        let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_id = token_contract.address();

        let contract_id = env.register_contract(None, crate::PredictionMarket);
        let client = PredictionMarketClient::new(env, &contract_id);
        client.initialize(&admin, &token_id);

        let token = soroban_sdk::token::StellarAssetClient::new(env, &token_id);
        token.mint(&creator, &10_000_0000000);
        token.mint(&trader, &10_000_0000000);

        (client, admin, creator, trader, token_id)
    }

    /// Helper: create a market with default params.
    fn create_default_market(
        env: &Env,
        client: &PredictionMarketClient,
        creator: &Address,
        initial_liquidity: i128,
    ) -> u64 {
        client.create_market(
            creator,
            &String::from_str(env, "Will BTC reach $100k?"),
            &String::from_str(env, "Resolves YES if Bitcoin reaches $100,000 USD"),
            &(env.ledger().timestamp() + 86400 * 30),
            &(env.ledger().timestamp() + 86400 * 31),
            &initial_liquidity,
        )
    }

    // -----------------------------------------------------------------------
    // 1. Basic create + trade
    // -----------------------------------------------------------------------
    #[test]
    fn test_create_and_trade_market() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _admin, creator, trader, _token_id) = setup_test(&env);

        let market_id = create_default_market(&env, &client, &creator, 1000_0000000);
        assert_eq!(market_id, 1);

        let shares = client.buy_shares(&trader, &market_id, &Outcome::Yes, &100_0000000);
        assert!(shares > 0);

        let position = client.get_position(&trader, &market_id);
        assert_eq!(position.yes_shares, shares);
    }

    // -----------------------------------------------------------------------
    // 2. Double initialization should panic
    // -----------------------------------------------------------------------
    #[test]
    #[should_panic(expected = "Already initialized")]
    fn test_double_initialize_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _creator, _trader, _token_id) = setup_test(&env);
        client.initialize(&admin, &Address::generate(&env));
    }

    // -----------------------------------------------------------------------
    // 3. Create market with insufficient liquidity
    // -----------------------------------------------------------------------
    #[test]
    #[should_panic(expected = "Insufficient initial liquidity")]
    fn test_create_market_insufficient_liquidity() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _admin, creator, _trader, _token_id) = setup_test(&env);
        create_default_market(&env, &client, &creator, 99_0000000);
    }

    // -----------------------------------------------------------------------
    // 4. Buy from non-existent market
    // -----------------------------------------------------------------------
    #[test]
    #[should_panic(expected = "Market not found")]
    fn test_buy_market_not_found() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _admin, _creator, trader, _token_id) = setup_test(&env);
        client.buy_shares(&trader, &999, &Outcome::Yes, &100_0000000);
    }

    // -----------------------------------------------------------------------
    // 5. Full buy -> sell flow, verify price impact
    // -----------------------------------------------------------------------
    #[test]
    fn test_buy_and_sell_shares() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _admin, creator, trader, _token_id) = setup_test(&env);

        let market_id = create_default_market(&env, &client, &creator, 1000_0000000);
        let yes_price = client.get_price(&market_id, &Outcome::Yes);
        assert_eq!(yes_price, 5000);

        let shares_bought = client.buy_shares(&trader, &market_id, &Outcome::Yes, &100_0000000);
        assert!(shares_bought > 0);

        let yes_price_after = client.get_price(&market_id, &Outcome::Yes);
        assert!(yes_price_after > 5000);

        let tokens_returned =
            client.sell_shares(&trader, &market_id, &Outcome::Yes, &shares_bought);
        assert!(tokens_returned > 0);

        let position = client.get_position(&trader, &market_id);
        assert_eq!(position.yes_shares, 0);

        let yes_price_final = client.get_price(&market_id, &Outcome::Yes);
        assert!(yes_price_final >= 4900 && yes_price_final <= 5100);
    }

    // -----------------------------------------------------------------------
    // 6. Resolve market + claim winnings
    // -----------------------------------------------------------------------
    #[test]
    fn test_resolve_and_claim_winnings() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, creator, trader, _token_id) = setup_test(&env);

        let market_id = create_default_market(&env, &client, &creator, 1000_0000000);

        let shares = client.buy_shares(&trader, &market_id, &Outcome::No, &200_0000000);
        assert!(shares > 0);

        env.ledger().set_timestamp(env.ledger().timestamp() + 86400 * 32);

        client.resolve_market(&admin, &market_id, &Outcome::No);

        let market = client.get_market(&market_id);
        assert_eq!(market.status, MarketStatus::Resolved);
        assert_eq!(market.resolved_outcome, 1);

        let payout = client.claim_winnings(&trader, &market_id);
        assert!(payout > 0);

        let position = client.get_position(&trader, &market_id);
        assert_eq!(position.no_shares, 0);
    }

    // -----------------------------------------------------------------------
    // 7. Claim with no winning shares should panic
    // -----------------------------------------------------------------------
    #[test]
    #[should_panic(expected = "No winning shares")]
    fn test_claim_no_winning_shares() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, creator, trader, _token_id) = setup_test(&env);

        let market_id = create_default_market(&env, &client, &creator, 1000_0000000);

        client.buy_shares(&trader, &market_id, &Outcome::Yes, &100_0000000);

        env.ledger().set_timestamp(env.ledger().timestamp() + 86400 * 32);

        client.resolve_market(&admin, &market_id, &Outcome::No);

        client.claim_winnings(&trader, &market_id);
    }

    // -----------------------------------------------------------------------
    // 8. get_all_markets pagination
    // -----------------------------------------------------------------------
    #[test]
    fn test_get_all_markets_pagination() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _admin, creator, _trader, _token_id) = setup_test(&env);

        for _ in 0..3 {
            create_default_market(&env, &client, &creator, 1000_0000000);
        }

        assert_eq!(client.get_market_count(), 3);

        let page1 = client.get_all_markets(&0, &1);
        assert_eq!(page1.len(), 1);
        assert_eq!(page1.get(0).unwrap().id, 1);

        let page2 = client.get_all_markets(&1, &1);
        assert_eq!(page2.len(), 1);
        assert_eq!(page2.get(0).unwrap().id, 2);

        let all = client.get_all_markets(&0, &10);
        assert_eq!(all.len(), 3);
    }

    // -----------------------------------------------------------------------
    // 9. get_price calculation
    // -----------------------------------------------------------------------
    #[test]
    fn test_get_price() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _admin, creator, trader, _token_id) = setup_test(&env);

        let market_id = create_default_market(&env, &client, &creator, 1000_0000000);

        assert_eq!(client.get_price(&market_id, &Outcome::Yes), 5000);
        assert_eq!(client.get_price(&market_id, &Outcome::No), 5000);
        assert_eq!(
            client.get_price(&market_id, &Outcome::Yes)
                + client.get_price(&market_id, &Outcome::No),
            10000
        );

        client.buy_shares(&trader, &market_id, &Outcome::Yes, &200_0000000);
        assert!(client.get_price(&market_id, &Outcome::Yes) > 5000);
        assert!(client.get_price(&market_id, &Outcome::No) < 5000);
    }

    // -----------------------------------------------------------------------
    // 10. Sell shares - insufficient shares should panic
    // -----------------------------------------------------------------------
    #[test]
    #[should_panic(expected = "Insufficient YES shares")]
    fn test_sell_insufficient_shares() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _admin, creator, trader, _token_id) = setup_test(&env);

        let market_id = create_default_market(&env, &client, &creator, 1000_0000000);
        client.buy_shares(&trader, &market_id, &Outcome::Yes, &100_0000000);

        client.sell_shares(&trader, &market_id, &Outcome::Yes, &999_0000000);
    }

    // -----------------------------------------------------------------------
    // 11. Resolve already-resolved market should panic
    // -----------------------------------------------------------------------
    #[test]
    #[should_panic(expected = "Market already resolved")]
    fn test_resolve_already_resolved() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, creator, _trader, _token_id) = setup_test(&env);

        let market_id = create_default_market(&env, &client, &creator, 1000_0000000);

        env.ledger().set_timestamp(env.ledger().timestamp() + 86400 * 32);

        client.resolve_market(&admin, &market_id, &Outcome::Yes);
        client.resolve_market(&admin, &market_id, &Outcome::Yes);
    }
}
