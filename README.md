# FinTech High-Throughput Cash Operations Platform & Subagent Network

A high-concurrency, real-time financial routing and terminal management system engineered for high-volume cash-in / cash-out transactions, subagent collateral enforcement, time-based OTP wallet authentication, and administrative traffic control.

---

## 🏗️ System Architecture & Portals

The application provides three dedicated operational environments:

### 1. 🛡️ Master Admin Central Dashboard
- **Central Traffic & Bot Orchestrator**: Control dynamic order queues, rate limiting, and traffic routing across nodes.
- **Subagent Roster & Financial Collateral Quotas**: Configure insurance limits, daily order limits (Min/Max), and daily volume caps.
- **Commission System**: Set deposit and withdrawal commission percentages per agent and specify per-agent settlement currencies (`EGP`, `USD`, `USDT`, `SAR`, etc.).
- **System-Wide Payment Methods Management**: Add, update, and manage supported payment channels (`Vodafone Cash`, `InstaPay`, `Orange Cash`, `Etisalat Cash`, `WE Pay`, `Bank Transfer`, etc.).
- **Audit Logging & Attribution**: Every approved or rejected transaction strictly records who processed it (`Admin` vs `Agent Name`) and includes timestamps synchronized with Cairo Time.
- **Production Mode & Clean State Zeroing**: Toggle production mode to freeze simulated generators and reset all counters to zero for live production.

### 2. 💼 Isolated Subagent Operations Terminal
- **Strict Account Isolation**: Agents only have access to their own assigned wallets, assigned incoming queue, and processing history. Cross-agent switching is strictly disabled.
- **Cash-In / Cash-Out Processing**: 
  - Deposit amounts can be adjusted upon approval to reflect exact received receipts.
  - Withdrawal amounts are immutable and locked to prevent unauthorized alterations.
- **Collateral & Commission Tracking**: Real-time counter of total settled orders, daily volume throughput, and estimated earned commission.
- **Collateral Top-Up Engine**: Submit insurance deposit requests to Admin with custom transfer references and selected payment methods.

### 3. 📱 Mobile APK Wallet Client
- **Single-Screen Focused UX**: Clean interface with only three primary actions: **Cash In (إيداع)**, **Cash Out (سحب)**, and **Transfer (تحويل)**.
- **Zero-OTP Inner Wallet Operations**: OTP authentication is strictly required during the initial login stage. Once inside the wallet, transfers and transactions execute cleanly without redundant OTP prompts.
- **Saved History Quick Login**: Wallet numbers are cached locally with fuzzy matching and autocomplete upon typing.
- **Transaction History Search**: Instant real-time search across transaction IDs, phone numbers, recipient names, and amounts.

---

## ⏱️ Cairo Synchronized Token & Alert Engine
- **90-Second Sync Pulse**: Wallets and subagent queues operate on a 90-second cryptographic token refresh interval synchronized to Cairo local time (Africa/Cairo).
- **Multi-Tone Audio Alerts**: Integrated Web Audio synthesizer provides real-time transaction chimes and interval status pulses.

---

## 🚀 Deployment & Server Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Package Manager**: `npm` (v9+) or `pnpm` / `yarn`
- **Port Requirement**: Bind to `0.0.0.0:3000` (standardized ingress port)

### Quickstart

```bash
# 1. Clone repository
git clone <repository-url>
cd <project-directory>

# 2. Install dependencies
npm install

# 3. Launch Development Server
npm run dev

# The development server will be available at http://localhost:3000
```

### Production Build & Container Execution

```bash
# 1. Compile client assets and bundle server
npm run build

# 2. Start the production server
npm start
```

### Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
# Server & Port Configuration
PORT=3000
NODE_ENV=production

# Applet Secret Keys (when external services are integrated)
APP_ENV=production
```

---

## 🔒 Security & Data Integrity Rules
1. **Withdrawal Amount Immutability**: The system enforces that withdrawal payout amounts cannot be modified during confirmation.
2. **Audit Attribution**: All status updates (Approved/Rejected) require and store `processedBy` (`Admin` or `Agent`) and `processedByRole`.
3. **Collateral Guard**: If an agent's available collateral drops below their configured threshold, traffic intake automatically halts until an insurance top-up is approved by Admin.

---

## 📁 Key File Structure

```
├── src/
│   ├── components/
│   │   ├── admin/          # Admin dashboard, audit logs, queues
│   │   ├── agent/          # Subagent management & isolated portal
│   │   ├── wallet/         # Mobile APK wallet interface
│   │   └── common/         # Shared UI components & notifications
│   ├── store/
│   │   └── useAppStore.ts  # Zustand central state management & actions
│   ├── types/
│   │   └── index.ts        # TypeScript data models & interfaces
│   ├── utils/
│   │   ├── cairoTime.ts    # Cairo timezone time formatting utilities
│   │   └── sound.ts        # Web Audio API chime synthesizers
│   └── App.tsx             # Root application router and portal switcher
├── server.ts               # Express backend & Vite middleware
├── package.json            # Scripts and dependencies
└── README.md               # Server and architecture documentation
```
