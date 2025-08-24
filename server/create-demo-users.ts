import { storage } from "./storage";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import * as bip39 from "bip39";
import { BIP32Factory } from "bip32";

// Initialize ECPair and BIP32 with secp256k1
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

// Nigerian names
const nigerianFirstNames = [
  "Adebayo", "Chioma", "Kemi", "Tunde", "Folake", "Segun", "Bukola", "Emeka", "Ngozi", "Taiwo", 
  "Bisi", "Femi", "Yemi", "Dayo", "Tola", "Wale", "Kike", "Tobi", "Sade", "Gbenga",
  "Funmi", "Lanre", "Dupe", "Biodun", "Ronke", "Dele", "Nike", "Seyi", "Tayo", "Kofo",
  "Chuka", "Ifeoma", "Nneka", "Ikechukwu", "Adaora", "Obioma", "Chinedu", "Ebere", "Nkechi", "Uche",
  "Amaka", "Chinwe", "Ola", "Remi", "Doyin", "Yinka", "Bamidele", "Temitope", "Olumide", "Kehinde"
];

const nigerianLastNames = [
  "Adeleke", "Okafor", "Ibrahim", "Mohammed", "Adeyemi", "Okoro", "Babangida", "Chukwu", "Okonkwo", "Adebola",
  "Ogundimu", "Nwankwo", "Akande", "Usman", "Ogbonna", "Adebayo", "Olatunji", "Ezekiel", "Igwe", "Sani",
  "Onuoha", "Adekunle", "Musa", "Olumide", "Nnamdi", "Adegoke", "Okechukwu", "Hassan", "Chidi", "Blessing",
  "Emeka", "Garba", "Idris", "Jibril", "Kingsley", "Lateef", "Murtala", "Nasir", "Osazee", "Patrick"
];

// International names
const internationalFirstNames = [
  "James", "Sarah", "Michael", "Emma", "David", "Lisa", "Robert", "Jennifer", "John", "Ashley",
  "William", "Jessica", "Richard", "Amanda", "Joseph", "Stephanie", "Thomas", "Melissa", "Charles", "Nicole",
  "Christopher", "Elizabeth", "Daniel", "Heather", "Matthew", "Tiffany", "Anthony", "Amy", "Mark", "Angela",
  "Donald", "Rebecca", "Steven", "Brenda", "Paul", "Katherine", "Andrew", "Samantha", "Kenneth", "Christine",
  "Carlos", "Maria", "José", "Ana", "Luis", "Elena", "Miguel", "Carmen", "Pedro", "Rosa",
  "Ahmed", "Fatima", "Omar", "Aisha", "Hassan", "Mariam", "Ali", "Khadija", "Yusuf", "Zainab",
  "Chen", "Li", "Wang", "Zhang", "Liu", "Yang", "Huang", "Zhao", "Wu", "Zhou",
  "Hiroshi", "Yuki", "Takeshi", "Sakura", "Kenji", "Akiko", "Daisuke", "Naomi", "Ryo", "Emi"
];

const internationalLastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Al-Rashid", "Al-Mahmoud", "Al-Zahra", "Bin-Salman", "El-Hassan", "Al-Farisi", "Bin-Omar", "Al-Ansari",
  "Chen", "Li", "Wang", "Zhang", "Liu", "Yang", "Huang", "Zhao", "Wu", "Zhou",
  "Tanaka", "Suzuki", "Takahashi", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato", "Yoshida"
];

function generateBitcoinWallet() {
  try {
    const mnemonic = bip39.generateMnemonic(128);
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
    const path = "m/44'/0'/0'/0/0";
    const child = root.derivePath(path);

    if (!child.privateKey) {
      throw new Error('Failed to derive private key from seed');
    }

    const keyPair = ECPair.fromPrivateKey(child.privateKey);
    const privateKey = keyPair.toWIF();

    const publicKeyBuffer = Buffer.isBuffer(keyPair.publicKey) 
      ? keyPair.publicKey 
      : Buffer.from(keyPair.publicKey);

    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: publicKeyBuffer,
      network: bitcoin.networks.bitcoin
    });

    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }

    return { privateKey, address, seedPhrase: mnemonic };
  } catch (error) {
    console.error('Error generating Bitcoin wallet:', error);
    return null;
  }
}

function getRandomName() {
  const useNigerian = Math.random() < 0.4; // 40% Nigerian names, 60% international
  
  if (useNigerian) {
    return {
      firstName: nigerianFirstNames[Math.floor(Math.random() * nigerianFirstNames.length)],
      lastName: nigerianLastNames[Math.floor(Math.random() * nigerianLastNames.length)]
    };
  } else {
    return {
      firstName: internationalFirstNames[Math.floor(Math.random() * internationalFirstNames.length)],
      lastName: internationalLastNames[Math.floor(Math.random() * internationalLastNames.length)]
    };
  }
}

function getRandomBalance() {
  // Random balance between 5 and 500 BTC
  return (Math.random() * 495 + 5).toFixed(8);
}

function getRandomInvestmentAmount(userBalance: string, planMinAmount: string) {
  const balance = parseFloat(userBalance);
  const minAmount = parseFloat(planMinAmount);
  
  // Invest between 10% and 50% of balance, but at least the minimum
  const maxInvestment = balance * 0.5;
  const investmentAmount = Math.max(minAmount, Math.random() * maxInvestment);
  
  return Math.min(investmentAmount, balance * 0.3).toFixed(8); // Don't invest more than 30% at once
}

export async function createDemoUsers() {
  try {
    console.log('🚀 Creating 300 demo users with investments...');
    
    // Get investment plans
    const plans = await storage.getInvestmentPlans();
    if (plans.length === 0) {
      console.error('No investment plans found!');
      return;
    }
    
    const createdUsers = [];
    const createdInvestments = [];
    
    for (let i = 0; i < 300; i++) {
      // Generate random name and wallet
      const { firstName, lastName } = getRandomName();
      const wallet = generateBitcoinWallet();
      
      if (!wallet) {
        console.warn(`Failed to generate wallet for user ${i + 1}`);
        continue;
      }
      
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@investor.com`;
      const balance = getRandomBalance();
      
      // Create user (without wallet fields as they're omitted from insertUserSchema)
      try {
        const user = await storage.createUser({
          firstName,
          lastName,
          email,
          phone: `+234${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          country: Math.random() < 0.4 ? "Nigeria" : ["USA", "UK", "Canada", "Germany", "France", "Japan", "Australia"][Math.floor(Math.random() * 7)],
          password: "hashedpassword123", // This would be properly hashed in real app
          acceptMarketing: true,
          bitcoinAddress: wallet.address,
          privateKey: wallet.privateKey
        });
        
        // Update user with seed phrase and balance
        if (wallet.seedPhrase) {
          await storage.updateUserWallet(user.id, wallet.address, wallet.privateKey, wallet.seedPhrase);
        }
        await storage.updateUserBalance(user.id, balance);
        
        createdUsers.push(user);
        
        // Create 1-3 random investments for this user
        const numInvestments = Math.floor(Math.random() * 3) + 1; // 1 to 3 investments
        let remainingBalance = parseFloat(balance);
        
        for (let j = 0; j < numInvestments && remainingBalance > 0.001; j++) {
          const randomPlan = plans[Math.floor(Math.random() * plans.length)];
          const investmentAmount = getRandomInvestmentAmount(remainingBalance.toString(), randomPlan.minAmount);
          
          if (parseFloat(investmentAmount) <= remainingBalance && parseFloat(investmentAmount) >= parseFloat(randomPlan.minAmount)) {
            const investment = await storage.createInvestment({
              userId: user.id,
              planId: randomPlan.id,
              amount: investmentAmount
            });
            
            createdInvestments.push(investment);
            remainingBalance -= parseFloat(investmentAmount);
            
            // Update user balance after investment
            await storage.updateUserBalance(user.id, remainingBalance.toFixed(8));
          }
        }
        
        if ((i + 1) % 50 === 0) {
          console.log(`✅ Created ${i + 1}/300 users with investments...`);
        }
        
      } catch (error) {
        console.warn(`Failed to create user ${i + 1}:`, error);
      }
    }
    
    console.log(`🎉 Successfully created ${createdUsers.length} users with ${createdInvestments.length} active investments!`);
    console.log(`💰 Your Telegram channel will now show updates from ${createdUsers.length} different investors!`);
    
  } catch (error) {
    console.error('❌ Error creating demo users:', error);
  }
}