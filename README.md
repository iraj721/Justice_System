# ⚖️ Decentralized Justice System

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Blockchain](https://img.shields.io/badge/blockchain-Ethereum-yellow)

A **blockchain-powered** justice management platform that ensures transparency, immutability, and efficiency in legal proceedings. The system connects **citizens, investigators, forensic labs, and courts** on a single decentralized ecosystem.

---

## 🎯 Problem Statement

Traditional justice systems face critical challenges:
- **Evidence tampering** – No mechanism to verify authenticity
- **Lack of transparency** – Citizens cannot track case progress
- **Delayed forensics** – Manual coordination between stakeholders
- **Multiple visits** – Physical presence required for basic tasks

**Our Solution:** A blockchain-based platform where every action is recorded, evidence is cryptographically verified, and all stakeholders collaborate in real-time.

---

## ✨ Key Features

| Role | Capabilities |
|------|--------------|
| **👤 Public User** | File FIR, upload documents, track case status, emergency SOS |
| **👮 Investigator** | Review FIRs, collect evidence, add suspects/witnesses, submit to court |
| **🔬 Forensic Analyst** | Analyze evidence, generate tamper-proof reports, share with court |
| **⚖️ Court** | Review cases, schedule virtual hearings, deliver judgments |

### Technical Highlights
- ✅ **Immutable Evidence** – SHA-256 hashes stored on blockchain
- ✅ **Decentralized Storage** – Evidence files on IPFS
- ✅ **Real-time Updates** – WebSocket notifications for case changes
- ✅ **Chain of Custody** – Complete evidence tracking log
- ✅ **Virtual Hearings** – Video conferencing integration
- ✅ **Emergency SOS** – Instant alerts to emergency contacts

---

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | User interface |
| **Backend** | FastAPI (Python) | Business logic & APIs |
| **Database** | SQLite + JSON files | User data & metadata |
| **Storage** | IPFS + Pinata | Decentralized evidence storage |
| **Blockchain** | Ethereum (Ganache) | Immutable hash anchoring |
| **Real-time** | WebSockets | Live case updates |
| **Video** | Agora SDK | Virtual court hearings |

---

## 📁 Project Structure
decentralized-justice-system/
│
├── backend/ # FastAPI Backend
│ ├── app/
│ │ ├── api/ # API endpoints (auth, fir, cases, etc.)
│ │ ├── core/ # Security, roles, config
│ │ ├── services/ # IPFS, blockchain, email services
│ │ └── main.py # Entry point
│ └── requirements.txt
│
├── frontend/ # React Frontend
│ ├── src/
│ │ ├── pages/ # Role-based dashboards
│ │ ├── shared/ # Common components & services
│ │ └── App.tsx
│ └── package.json
│
├── blockchain/ # Smart Contracts
│ ├── contracts/ # Solidity contracts
│ ├── scripts/ # Deployment scripts
│ └── hardhat.config.cjs
│
└── README.md


---

## 🔐 Security & Role Management

### Role-Based Access Control (RBAC)

| Role | Access Level |
|------|--------------|
| `PUBLIC_USER` | File FIR, track cases, upload documents |
| `INVESTIGATOR` | Manage cases, collect evidence, submit to court |
| `FORENSIC_ANALYST` | Analyze evidence, generate reports |
| `COURT` | Review cases, schedule hearings, deliver judgments |

### Secure Onboarding

Sensitive roles cannot be self-registered. Authorized personnel require **onboarding codes**:
- **Investigator:** `POLICE-2026`
- **Forensic Analyst:** `LAB-2026`
- **Court Officer:** `JUDGE-2026`

---

## 🚀 How Evidence Integrity Works
📁 User uploads evidence file
      ↓
🔐 System calculates SHA-256 hash
      ↓
📦 File stored on IPFS → receives CID
      ↓
⛓️ Hash + CID anchored to blockchain
      ↓
✅ Anyone can verify by re-calculating hash

**If file is tampered even by 1 byte → hash mismatch → tampering detected.**

---

## 💻 Installation & Setup

### Prerequisites

- **Node.js** v18+ 
- **Python** 3.11+
- **IPFS** (Kubo daemon) – [Download](https://docs.ipfs.tech/install/)
- **Ganache** GUI – [Download](https://trufflesuite.com/ganache/)
- **Git**

---

### Step 1: Clone Repository

```bash
git clone https://github.com/iraj721/decentralized-justice-system.git
cd decentralized-justice-system

Step 2: Setup Backend

cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your configuration (Ganache keys, email, etc.)

# Start backend
python -m uvicorn app.main:app --reload

Backend runs on: http://localhost:8000


Step 3: Setup Frontend

cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev

Frontend runs on: http://localhost:5173

Step 4: Setup Blockchain (Ganache)

Launch Ganache GUI

Create new workspace → Add project

Copy private key of first account to CHAIN_PRIVATE_KEY in backend .env

Deploy smart contract:


cd blockchain
npm install
npx hardhat compile
npx hardhat run scripts/deploy-ganache.mjs --network ganache

Copy contract address to CHAIN_CONTRACT_ADDRESS in backend .env

Step 5: Start IPFS Daemon

ipfs daemon

👥 Contributors
Iraj Tahir – Full Stack Developer & Blockchain Architect

📄 License
MIT License – Free for academic and research use.

🙏 Acknowledgments
FastAPI – For elegant Python backend

React – For responsive UI

IPFS – For decentralized storage

Ethereum – For blockchain immutability

Ganache – For local blockchain simulation

📧 Contact
For questions or feedback:

Email: irajtahir555@gmail.com

GitHub: github.com/iraj721

⭐ Show Your Support
If this project helped you, please give it a ⭐ on GitHub!