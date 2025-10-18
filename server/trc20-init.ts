import { storage } from './storage';
import { trc20WalletManager } from './trc20-wallet';

export async function initializeTRC20System(): Promise<void> {
  try {
    console.log('🔐 Initializing TRC20 deposit system...');

    const config = await storage.getAdminConfig();

    if (!config?.trc20HdSeed) {
      console.log('📝 Generating new TRC20 HD wallet...');
      const { mnemonic, vaultAddress } = trc20WalletManager.generateHDWallet();

      await storage.updateAdminConfig({
        trc20HdSeed: mnemonic,
        trc20VaultAddress: vaultAddress,
        minDepositUsd: '10.00',
      });

      console.log(`✅ TRC20 HD wallet initialized`);
      console.log(`🏦 TRC20 Vault Address: ${vaultAddress}`);
      console.log(`💵 Minimum deposit set to: $10 USD`);
    } else {
      console.log('✅ TRC20 system already initialized');
      console.log(`🏦 TRC20 Vault Address: ${config.trc20VaultAddress || 'Not set'}`);
      console.log(`💵 Minimum deposit: $${config.minDepositUsd || '10.00'} USD`);
    }
  } catch (error) {
    console.error('❌ Error initializing TRC20 system:', error);
  }
}

export async function assignUserTRC20Address(userId: number): Promise<string | null> {
  try {
    console.log(`🔐 Assigning TRC20 address to user ${userId}...`);

    const config = await storage.getAdminConfig();

    if (!config?.trc20HdSeed) {
      console.error('❌ TRC20 HD seed not initialized in admin config');
      return null;
    }

    console.log(`🔑 Deriving TRC20 address for user ${userId}...`);
    const depositAddress = trc20WalletManager.deriveAddressFromSeed(config.trc20HdSeed, userId);

    if (!depositAddress || depositAddress.length === 0) {
      console.error(`❌ Failed to derive TRC20 address for user ${userId}`);
      return null;
    }

    console.log(`📝 Updating user ${userId} with TRC20 address ${depositAddress}...`);
    await storage.updateUserTRC20Address(userId, depositAddress);

    console.log(`✅ Successfully assigned TRC20 address ${depositAddress} to user ${userId}`);
    return depositAddress;
  } catch (error) {
    console.error(`❌ Error assigning TRC20 address to user ${userId}:`, error);
    return null;
  }
}