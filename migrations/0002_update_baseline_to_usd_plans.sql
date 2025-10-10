
-- Migration to update baseline statistics to match new USD investment plans
-- This aligns with landing page claims of "10,000+ Active Investors"

DO $$
BEGIN
  -- Update main baseline statistics (realistic values matching landing page)
  UPDATE admin_config SET
    baseline_users = 9850,
    baseline_active_investments = 15420,
    baseline_total_balance = '845.67342158',
    baseline_total_profit = '127.84501632',
    
    -- $10 Plan baseline (highest volume - starter plan)
    plan_10_active = 3240,
    plan_10_amount = '26.59680000',
    plan_10_profit = '2.63142400',
    
    -- $20 Plan baseline
    plan_20_active = 2850,
    plan_20_amount = '46.79100000',
    plan_20_profit = '4.60951020',
    
    -- $50 Plan baseline
    plan_50_active = 2410,
    plan_50_amount = '98.77450000',
    plan_50_profit = '9.81986130',
    
    -- $100 Plan baseline
    plan_100_active = 1980,
    plan_100_amount = '162.54180000',
    plan_100_profit = '16.37471736',
    
    -- $300 Plan baseline
    plan_300_active = 1620,
    plan_300_amount = '398.91600000',
    plan_300_profit = '39.15205120',
    
    -- $500 Plan baseline
    plan_500_active = 1350,
    plan_500_amount = '554.04225000',
    plan_500_profit = '56.56110963',
    
    -- $1,000 Plan baseline
    plan_1000_active = 1140,
    plan_1000_amount = '935.84562000',
    plan_1000_profit = '91.37287076',
    
    -- $3,000 Plan baseline
    plan_3000_active = 580,
    plan_3000_amount = '1428.29550000',
    plan_3000_profit = '283.39430400',
    
    -- $6,000 Plan baseline
    plan_6000_active = 175,
    plan_6000_amount = '862.01250000',
    plan_6000_profit = '203.72494500',
    
    -- $12,000 Plan baseline (lowest volume - premium plan)
    plan_12000_active = 75,
    plan_12000_amount = '738.62850000',
    plan_12000_profit = '147.72570000',
    
    updated_at = NOW()
  WHERE id = (SELECT MIN(id) FROM admin_config);
  
  -- If no config exists, create one
  IF NOT FOUND THEN
    INSERT INTO admin_config (
      vault_address,
      deposit_address,
      baseline_users,
      baseline_active_investments,
      baseline_total_balance,
      baseline_total_profit,
      plan_10_active, plan_10_amount, plan_10_profit,
      plan_20_active, plan_20_amount, plan_20_profit,
      plan_50_active, plan_50_amount, plan_50_profit,
      plan_100_active, plan_100_amount, plan_100_profit,
      plan_300_active, plan_300_amount, plan_300_profit,
      plan_500_active, plan_500_amount, plan_500_profit,
      plan_1000_active, plan_1000_amount, plan_1000_profit,
      plan_3000_active, plan_3000_amount, plan_3000_profit,
      plan_6000_active, plan_6000_amount, plan_6000_profit,
      plan_12000_active, plan_12000_amount, plan_12000_profit
    ) VALUES (
      '1BitVaultVaultAddress12345678901234567890',
      '1BitVaultDepositAddress12345678901234567890',
      9850, 15420, '845.67342158', '127.84501632',
      3240, '26.59680000', '2.63142400',
      2850, '46.79100000', '4.60951020',
      2410, '98.77450000', '9.81986130',
      1980, '162.54180000', '16.37471736',
      1620, '398.91600000', '39.15205120',
      1350, '554.04225000', '56.56110963',
      1140, '935.84562000', '91.37287076',
      580, '1428.29550000', '283.39430400',
      175, '862.01250000', '203.72494500',
      75, '738.62850000', '147.72570000'
    );
  END IF;
END $$;
