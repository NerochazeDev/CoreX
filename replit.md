# BitVault PRO - Bitcoin Investment Platform

## Overview

BitVault PRO is a premium Bitcoin investment platform that provides professional clients with cryptocurrency wallet management, exclusive investment opportunities, and real-time Bitcoin price tracking. The platform features a complete investment ecosystem with different investment plans, transaction management, and administrative controls, all designed with a modern Bitcoin-focused professional interface using orange and gold branding with gradient backgrounds and professional styling optimized for Bitcoin trading.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI with Tailwind CSS for styling
- **State Management**: React Query for server state, React Context for global state
- **Styling**: Custom dark theme with BitVault orange and gold Bitcoin-focused color scheme

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Session Management**: Express-session middleware
- **Build System**: Vite for frontend, esbuild for backend

## Key Components

### Database Schema
- **Users**: Account management with Bitcoin wallet integration
- **Investment Plans**: Multiple investment tiers with different ROI rates
- **Investments**: User investment tracking with profit calculations
- **Transactions**: Deposit/withdrawal transaction management
- **Notifications**: Real-time user notifications
- **Admin Config**: System configuration management
- **Backup Databases**: Redundant database configuration and management

### Authentication System
- Session-based authentication with secure cookie management
- Admin role permissions for management features
- Backdoor admin access via special routes (/Hello10122)

### Bitcoin Integration
- Real-time Bitcoin price feeds from CoinGecko API
- Bitcoin wallet generation using bitcoinjs-lib
- Private key and seed phrase management
- Automatic balance synchronization

### Investment System
- **10 USD-based investment plans**: $10, $20, $50, $100, $300, $500, $1,000, $3,000, $6,000, $12,000
- **Automatic profit distribution**: Every 5 minutes with countdown formula
- **Performance fees**: 10% for plans under $1,000, 20% for larger plans
- **Profit calculation**: `profit_per_5min = total_profit_usd / (total_minutes / 5)`
- **Real-time progress tracking**: Elapsed time, remaining profit, and intervals
- **Realistic trading simulation**: 70% success rate, 30% unsuccessful intervals
- **Transaction-based processing**: Admin approval required before activation

### Backup Database System
- **Real-time Data Synchronization**: Automatic data replication to backup databases
- **Failover Protection**: Seamless switching between primary and backup databases
- **Database Viewer**: Admin interface to view and manage backup database contents
- **Table Creation**: Automatic schema replication on backup databases
- **Connection Management**: Secure handling of multiple database connections

## Data Flow

1. **User Registration/Login**: Creates session, generates Bitcoin wallet
2. **Investment Process**: User selects plan → creates transaction → admin approval → investment activation
3. **Profit Generation**: Automated background process updates investment profits every 10 minutes
4. **Bitcoin Price Updates**: Real-time price fetching and display every 30 seconds
5. **Notification System**: Real-time notifications for transactions and system updates

## External Dependencies

### APIs
- **CoinGecko API**: Real-time Bitcoin price data
- **QR Code API**: QR code generation for Bitcoin addresses

### Database
- **Neon PostgreSQL**: Neon-hosted PostgreSQL database with secure environment variables
- **Connection**: Serverless connection using postgres package with SSL support
- **Data Export/Import**: Admin interface for downloading and importing complete database backups
- **Security**: Database URL stored securely in Replit Secrets, no hardcoded credentials

### Bitcoin Libraries
- **bitcoinjs-lib**: Bitcoin transaction and wallet operations
- **bip39**: Mnemonic seed phrase generation
- **bip32**: HD wallet derivation

## Deployment Strategy

### Production Configuration
- **Database**: Hardcoded Neon PostgreSQL connection string
- **Session**: Hardcoded session secret for simplified deployment
- **Environment**: Production-ready with automatic migrations

### Deployment Platforms
- **Primary**: Railway.app with PostgreSQL plugin (production-ready setup)
- **Alternative**: Render.com, Heroku, Docker containers
- **Build Process**: Vite for frontend, esbuild for backend bundling

### Build Commands
```bash
# Frontend build
npx vite build

# Backend build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection (hardcoded in config)
- `NODE_ENV`: Production environment flag
- `PORT`: Server port (defaults to 5000)

### Investment Profit Generation (Every 5 Minutes)

| Plan | Gross/5min | Fee/5min | Net to User/5min | Daily Net |
|------|------------|----------|------------------|-----------|
| $10 | $0.00049 | $0.000049 | $0.000441 | $0.127 |
| $20 | $0.00098 | $0.000098 | $0.000882 | $0.254 |
| $50 | $0.000575 | $0.000058 | $0.000518 | $0.149 |
| $100 | $0.001167 | $0.000117 | $0.001050 | $0.302 |
| $300 | $0.00682 | $0.000682 | $0.006138 | $1.764 |
| $500 | $0.00591 | $0.001182 | $0.004728 | $1.361 |
| $1,000 | $0.01130 | $0.002260 | $0.009040 | $2.60 |
| $3,000 | $0.03444 | $0.006888 | $0.027552 | $7.93 |
| $6,000 | $0.06990 | $0.013980 | $0.055920 | $16.10 |
| $12,000 | $0.13881 | $0.027762 | $0.111048 | $31.98 |

### Telegram Notifications
- **Daily broadcasts**: Sent at 10 AM with investment updates
- **All 10 USD plans displayed**: Complete visibility in every notification format
- **3 notification formats**: Rotated for variety
- **Professional banners**: BitVault Pro themed charts and graphics
- **Real transaction hashes**: Blockchain verification included

## Changelog
- October 18, 2025. **Real-Time BTC Conversion System** - Implemented dynamic Bitcoin price conversion for all investment plans. Removed static `min_amount` column from database and made `usd_min_amount` the primary required field. All BTC equivalents are now calculated in real-time using live Bitcoin prices from CoinGecko API, ensuring accurate conversions that reflect current market rates. Backend validation updated to use USD as the source of truth with dynamic BTC calculation. Frontend displays real-time BTC equivalents with proper fallback handling for price unavailability.
- January 18, 2025. **Investment Notification System Enhancement** - Fixed Telegram broadcasts to display all 10 USD investment plans instead of only showing top 5-6. Updated all three notification formats to ensure complete plan visibility. Removed markdown formatting artifacts (** symbols) from notifications for cleaner presentation. Verified profit distribution matches USD countdown formula with accurate performance fee deductions.
- October 16, 2025. **Investment Profit Display Fix & Admin TRC20 Tools** - Fixed critical investment return display bug where UI showed gross profit but users received net profit after performance fees. Backend now correctly stores NET profit in currentProfit field, ensuring UI matches actual user balance. Added admin API endpoint `/api/admin/deposit-sessions` to view all deposit sessions with private keys derived from HD wallet for emergency access. Implemented Telegram notifications for deposit session creation and withdrawal requests, sending detailed alerts to admins via broadcast queue system for real-time monitoring.
- October 14, 2025. **Enhanced /invest Landing Page with Comprehensive Investment Showcase** - Transformed the landing page into a professional, enterprise-grade investment platform showcase. Added live BTC price ticker, interactive returns calculator with accurate ROI calculations matching backend formulas, comprehensive investment plans display with real backend data integration, risk disclaimer section with proper regulatory compliance statements, security & trust section highlighting bank-level protection, FAQ section with 8 detailed investor questions, and enhanced footer with legal links. All plan amounts correctly use usdMinAmount field when available with fallback to BTC conversion using live prices.
- October 13, 2025. **Investment Purchase Table Simplified to USD-Only Display** - Updated investment purchase table to show only USD values for easier purchasing decisions. Removed all BTC equivalent displays from plan cards and confirmation dialogs to prevent confusion when Bitcoin price fluctuates. Backend continues to sync USD and BTC amounts automatically. Verified TRC20 deposit and withdrawal flows are fully configured and operational with comprehensive security measures.
- August 16, 2025. **Investment System Enhancement & Accurate Return Calculations** - Fixed critical investment calculation system. Investment plans now show accurate investment formulas instead of static returns. Added dynamic investment amount input with real-time profit calculations. Implemented withdrawal protection that prevents users from withdrawing funds while having active investments. All return calculations are now properly BTC-based and independent of USD price fluctuations.
- August 16, 2025. **Replit Migration & Responsive Design Completed** - Successfully migrated from Replit Agent to standard Replit environment with complete desktop and mobile responsive design. Added desktop sidebar navigation while maintaining mobile bottom navigation, fixed all page layouts for both mobile and desktop compatibility, ensured proper spacing and margins for all screen sizes.
- August 12, 2025. **Profile Edit System Completed** - Fixed and verified complete profile editing system with instant database persistence. Users can now save profile pictures, bio, website, and personal information permanently. Added API endpoint `/api/me/profile` with proper validation, error handling, increased payload limits for image uploads, and session-based authentication.
- August 12, 2025. **Replit Migration Completed** - Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database provisioning, schema synchronization, and full functionality verification
- August 12, 2025. **Modern Responsive Home Page Redesign** - Completely redesigned home page with modern responsive layout using CSS Grid, professional glass-morphism cards, updated typography, mobile-first responsive design, and desktop/tablet optimized layouts for perfect cross-device experience
- August 12, 2025. **Complete Mobile/Desktop Responsiveness** - Ensured all pages work perfectly on both desktop and mobile devices with responsive navigation, touch-friendly buttons, optimized spacing, and adaptive layouts
- August 12, 2025. **Rebranded to BitVault Pro** - Complete rebrand from Plus500 to BitVault Pro with Bitcoin-focused orange/gold theme, updated all UI components, logos, and styling to match professional Bitcoin investment platform
- August 10, 2025. **Migrated to new Neon PostgreSQL database** - Successfully integrated user's new Neon database with secure environment variables, removed old database connections, all user data and features working correctly
- August 2, 2025. **Fixed Railway deployment configuration (v2)** - Removed problematic nixpacks.toml with invalid package names, created .nvmrc for Node.js 20, using Railway's automatic Node.js detection for reliable deployment
- August 2, 2025. **Fixed Railway deployment configuration** - Removed Dockerfile to prevent Docker detection, updated railway.json and nixpacks.toml for proper Node.js deployment, created .railwayignore, verified build process works correctly
- August 2, 2025. Configured Railway deployment with optimized build process and production environment variables
- August 1, 2025. Finalized Plus500 logo with Orbitron font, clean zeros (no slashed zeros), and removed shining effects
- August 1, 2025. Completed comprehensive platform audit - all systems production-ready for official Plus500 deployment
- August 1, 2025. Fixed TypeScript errors and verified all core functionality including Bitcoin wallet integration
- August 1, 2025. Implemented authentic Plus500 logo with "+" positioned above "s" and royal blue background
- August 1, 2025. Applied modern tech typography (Orbitron) with geometric styling and curved corners
- August 1, 2025. Fixed component visibility issues with improved color contrast
- August 1, 2025. Successfully rebranded from CoreX to Plus500 VIP Investors with royal blue and white theme
- August 1, 2025. Updated all UI components with Plus500 branding and color scheme
- August 1, 2025. Completed migration to Replit environment with full functionality
- June 30, 2025. Successfully migrated to Replit environment with PostgreSQL database
- June 30, 2025. Added PostgreSQL data export and import functionality for complete database backup/restore
- June 30, 2025. Updated database configuration to use Replit's PostgreSQL service
- June 19, 2025. Added database backup/upload functionality via admin endpoints  
- June 19, 2025. Fixed session authentication issues with MemoryStore implementation
- June 18, 2025. Added comprehensive backup database management system with real-time data synchronization
- June 15, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.