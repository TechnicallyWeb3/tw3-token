# TW3 Token Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

## Available Scripts

### Check Balance Script

The `CheckBalance.ts` script allows you to check the balance of both Ether and ERC20 tokens for any account address.

### Ignition Modules

The project includes Ignition modules for standardized deployments:

- **Lock Module** (`ignition/modules/Lock.ts`) - Deploys the Lock contract
- **WrappedToken Module** (`ignition/modules/WrappedToken.ts`) - Deploys the WrappedToken contract with configurable name and symbol

You can deploy these modules directly:
```shell
npx hardhat ignition deploy ./ignition/modules/WrappedToken.ts
```

### Deploy WrappedToken Script

The `DeployWrappedToken.ts` script deploys a WrappedToken contract using Hardhat Ignition and tests the wrap functionality. This script demonstrates how to:

- Import and use Ignition modules natively in scripts
- Deploy contracts using Ignition's deployment system
- Test contract functionality after deployment
- Integrate with the balance checking script

This is useful for testing the balance checking script with a real token.

**Usage:**
```shell
# Method 1: Using environment variables (recommended)
ACCOUNT_ADDRESS=0x... [TOKEN_ADDRESS=0x...] npx hardhat run scripts/CheckBalance.ts

# Method 2: Using command line arguments (may not work in all shells)
npx hardhat run scripts/CheckBalance.ts -- <account_address> [token_address]
```

**Parameters:**
- `account_address` - The address to check balances for (required)
- `token_address` - The ERC20 token contract address (optional)

**Examples:**
```shell
# Check only ETH balance
ACCOUNT_ADDRESS=0x1234567890123456789012345678901234567890 npx hardhat run scripts/CheckBalance.ts

# Check both ETH and token balance
ACCOUNT_ADDRESS=0x1234567890123456789012345678901234567890 TOKEN_ADDRESS=0xabcdef1234567890abcdef1234567890abcdef12 npx hardhat run scripts/CheckBalance.ts

# PowerShell syntax
$env:ACCOUNT_ADDRESS="0x1234567890123456789012345678901234567890"; npx hardhat run scripts/CheckBalance.ts
```

**Output:**
The script will display:
- ETH balance in both Ether and Wei
- Token information (name, symbol, address)
- Token balance in human-readable format and raw units
- A summary of all balances

## Other Available Tasks

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```
