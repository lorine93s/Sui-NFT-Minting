module nft_mint_module::nft_mint_module {
    use sui::tx_context::{sender};
    use sui::dynamic_field as df;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{String, utf8};

    const E_NOT_WHITELISTED: u64 = 0;
    const E_INSUFFICIENT_PAYMENT: u64 = 1;
    const E_NOT_ADMIN: u64 = 2;
    const E_NOT_OWNER: u64 = 3;
    const PRICE: u64 = 2000000000; // 2 SUI in MIST
    const ADMIN_ADDRESS: address = @0x6b47d562da0a054248cd5330649bc4999d5b8ee3ca879c4b523eb4711b36a653;  //Admin address

    public struct Whitelist has key {
        id: UID
    }

    public struct Whitelisted has store, drop {
        wallet_address: address
    }

    public struct WhitelistInfo has key {
        id: UID,
        whitelist_id: ID
    }

    public struct NFT has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: String,
        traits: vector<String>
    }

    fun init(ctx: &mut TxContext) {
        let whitelist = Whitelist {
            id: object::new(ctx)
        };
        let whitelist_id = object::uid_to_inner(&whitelist.id);
        
        transfer::share_object(whitelist);
        
        let info = WhitelistInfo {
            id: object::new(ctx),
            whitelist_id
        };
        transfer::transfer(info, ADMIN_ADDRESS);
    }

    /// Admin-only function to add addresses to whitelist
    public entry fun add_to_whitelist(
        whitelist: &mut Whitelist,
        address: address,
        ctx: &mut TxContext
    ) {
        assert!(sender(ctx) == ADMIN_ADDRESS, E_NOT_ADMIN);
        df::add(&mut whitelist.id, address, Whitelisted { wallet_address: address });
    }

    /// Public function to check whitelist status
    public fun is_whitelisted(
        whitelist: &Whitelist,
        address: address
    ): bool {
        df::exists_with_type<address, Whitelisted>(&whitelist.id, address)
    }

    /// Admin-only function to remove addresses from whitelist
    public entry fun remove_from_whitelist(
    whitelist: &mut Whitelist,
    address: address,
    ctx: &mut TxContext
) {
    assert!(sender(ctx) == ADMIN_ADDRESS, E_NOT_ADMIN);
    assert!(df::exists_with_type<address, Whitelisted>(&whitelist.id, address), E_NOT_WHITELISTED);
    
    // Add explicit type annotations for the remove operation
    df::remove<address, Whitelisted>(&mut whitelist.id, address);
    
    // The Whitelisted object will be automatically dropped since it has the 'drop' ability
}

    fun generate_traits(): vector<String> {
        let mut traits = vector::empty<String>();
        vector::push_back(&mut traits, utf8(b"Rare"));
        vector::push_back(&mut traits, utf8(b"Blue"));
        traits
    }

    /// Public mint function for whitelisted users
    public entry fun mint_for_whitelisted(
        whitelist: &Whitelist,
        name: String,
        description: String,
        image_url: String,
        ctx: &mut TxContext
    ) {
        assert!(is_whitelisted(whitelist, sender(ctx)), E_NOT_WHITELISTED);
        
        let nft = create_nft(name, description, image_url, ctx);
        transfer::transfer(nft, sender(ctx));
    }

    /// Public paid mint function
    public entry fun paid_mint(
        name: String,
        description: String,
        image_url: String,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(coin::value(&payment) >= PRICE, E_INSUFFICIENT_PAYMENT);
        
        let nft = create_nft(name, description, image_url, ctx);
        transfer::public_transfer(payment, ADMIN_ADDRESS);
        transfer::transfer(nft, sender(ctx));
    }

    /// Helper function to create NFT
    fun create_nft(
        name: String,
        description: String,
        image_url: String,
        ctx: &mut TxContext
    ): NFT {
        let traits = generate_traits();
        NFT {
            id: object::new(ctx),
            name,
            description,
            image_url,
            traits
        }
    }

    /// Function to burn/remove an NFT (owner only)
    public entry fun remove_nft(
        nft: NFT,
        ctx: &mut TxContext
    ) {
        // assert!(sender(ctx) == object::uid_to_address(&nft), E_NOT_OWNER);
        let NFT { id, name: _, description: _, image_url: _, traits: _ } = nft;
        object::delete(id);
    }

    /// Admin function to remove any NFT (emergency use)
    public entry fun admin_remove_nft(
        nft: NFT,
        ctx: &mut TxContext
    ) {
        assert!(sender(ctx) == ADMIN_ADDRESS, E_NOT_ADMIN);
        let NFT { id, name: _, description: _, image_url: _, traits: _ } = nft;
        object::delete(id);
    }

}

