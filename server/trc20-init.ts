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
    const config = await storage.getAdminConfig();
    
    if (!config?.trc20HdSeed) {
      console.error('TRC20 HD seed not initialized');
      return null;
    }
    
    const trc20Address = trc20WalletManager.deriveAddressFromSeed(config.trc20HdSeed, userId);
    
    await storage.updateUserTRC20Address(userId, trc20Address);
    
    console.log(`✅ Assigned TRC20 address to user ${userId}: ${trc20Address}`);
    return trc20Address;
  } catch (error) {
    console.error('❌ Error assigning TRC20 address:', error);
    return null;
  }
}
