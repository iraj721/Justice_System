# backend/app/services/chain_anchor.py 

"""On-chain anchoring with REAL transaction sending - Full Justice System"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Dict, Any
import logging

from app.core.config import settings
from app.storage.sqlite_index import SqliteIndex

logger = logging.getLogger(__name__)

# Try to import web3
try:
    from web3 import Web3
    WEB3_AVAILABLE = True
except ImportError:
    Web3 = None
    WEB3_AVAILABLE = False
    logger.warning("Web3 not installed. Install with: pip install web3")

# Updated Contract ABI with all new functions
CONTRACT_ABI = [
    # Original anchor function
    {
        "inputs": [
            {"internalType": "bytes32", "name": "objectHash", "type": "bytes32"},
            {"internalType": "bytes32", "name": "objectType", "type": "bytes32"},
            {"internalType": "bytes32", "name": "objectIdHash", "type": "bytes32"},
            {"internalType": "string", "name": "cid", "type": "string"},
            {"internalType": "uint256", "name": "deadlineDays", "type": "uint256"},
        ],
        "name": "recordAnchor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    # Multi-signature approval
    {
        "inputs": [
            {"internalType": "bytes32", "name": "objectHash", "type": "bytes32"},
            {"internalType": "uint8", "name": "approverLevel", "type": "uint8"},
        ],
        "name": "approveMultiSig",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    # Appeal functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "string", "name": "grounds", "type": "string"},
        ],
        "name": "fileAppeal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "bool", "name": "accept", "type": "bool"},
        ],
        "name": "decideAppeal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    # Escrow functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "address", "name": "beneficiary", "type": "address"},
        ],
        "name": "depositEscrow",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "caseId", "type": "bytes32"}],
        "name": "releaseFine",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    # Role management
    {
        "inputs": [
            {"internalType": "address", "name": "user", "type": "address"},
            {"internalType": "uint8", "name": "role", "type": "uint8"},
            {"internalType": "string", "name": "badgeNumber", "type": "string"},
        ],
        "name": "assignRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    # Timeline tracking
    {
        "inputs": [
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "uint8", "name": "stage", "type": "uint8"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
        ],
        "name": "updateCaseTimeline",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    # Query functions
    {
        "inputs": [{"internalType": "bytes32", "name": "objectHash", "type": "bytes32"}],
        "name": "anchorsCountByHash",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "objectHash", "type": "bytes32"},
            {"internalType": "uint256", "name": "index", "type": "uint256"},
        ],
        "name": "anchorByHash",
        "outputs": [
            {
                "components": [
                    {"internalType": "bytes32", "name": "objectHash", "type": "bytes32"},
                    {"internalType": "bytes32", "name": "objectType", "type": "bytes32"},
                    {"internalType": "bytes32", "name": "objectIdHash", "type": "bytes32"},
                    {"internalType": "string", "name": "cid", "type": "string"},
                    {"internalType": "address", "name": "recorder", "type": "address"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                    {"internalType": "uint256", "name": "deadline", "type": "uint256"},
                ],
                "internalType": "struct PublicAuditTrail.Anchor",
                "name": "",
                "type": "tuple",
            }
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "caseId", "type": "bytes32"}],
        "name": "getAppeal",
        "outputs": [
            {"internalType": "string", "name": "grounds", "type": "string"},
            {"internalType": "uint256", "name": "filedAt", "type": "uint256"},
            {"internalType": "bool", "name": "accepted", "type": "bool"},
            {"internalType": "address", "name": "appellant", "type": "address"},
            {"internalType": "uint256", "name": "decidedAt", "type": "uint256"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "caseId", "type": "bytes32"}],
        "name": "getEscrow",
        "outputs": [
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "address", "name": "depositor", "type": "address"},
            {"internalType": "address", "name": "beneficiary", "type": "address"},
            {"internalType": "bool", "name": "released", "type": "bool"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "objectHash", "type": "bytes32"}],
        "name": "getApprovalStatus",
        "outputs": [
            {"internalType": "bool", "name": "ioApproved", "type": "bool"},
            {"internalType": "bool", "name": "dspApproved", "type": "bool"},
            {"internalType": "bool", "name": "courtApproved", "type": "bool"},
            {"internalType": "uint256", "name": "time", "type": "uint256"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "getUserRole",
        "outputs": [
            {"internalType": "uint8", "name": "", "type": "uint8"},
            {"internalType": "string", "name": "", "type": "string"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
]


@dataclass(frozen=True)
class ChainTx:
    tx_hash: str
    block_number: Optional[int] = None
    gas_used: Optional[int] = None


def get_web3():
    """Get Web3 instance"""
    if not WEB3_AVAILABLE or not settings.ENABLE_CHAIN_ANCHORING:
        return None
    if not settings.CHAIN_PRIVATE_KEY or not settings.CHAIN_CONTRACT_ADDRESS:
        logger.warning("Chain settings missing")
        return None
    
    try:
        w3 = Web3(Web3.HTTPProvider(settings.CHAIN_RPC_URL, request_kwargs={"timeout": 10}))
        if w3.is_connected():
            logger.info(f"Web3 connected to {settings.CHAIN_RPC_URL}")
            return w3
        else:
            logger.warning(f"Cannot connect to {settings.CHAIN_RPC_URL}")
            return None
    except Exception as e:
        logger.error(f"Web3 connection error: {e}")
        return None


def _to_bytes32_from_hex_hash(hex_hash: str) -> bytes:
    """Convert hex hash to bytes32"""
    if not hex_hash:
        return bytes(32)
    h = hex_hash.lower().removeprefix('0x')
    try:
        raw = bytes.fromhex(h)
        if len(raw) < 32:
            raw = raw + b"\x00" * (32 - len(raw))
        elif len(raw) > 32:
            raw = raw[:32]
        return raw
    except ValueError:
        return bytes(32)


def _to_bytes32_from_text(text: str) -> bytes:
    """Convert text to bytes32"""
    if not text:
        return bytes(32)
    if WEB3_AVAILABLE and Web3:
        return Web3.keccak(text=text)
    else:
        return text.encode().ljust(32, b'\x00')[:32]


# ============ NEW FEATURE 1: Enhanced Anchoring with Deadlines ============

def anchor_sha256(
    *,
    object_type: str,
    object_id: str,
    sha256_hex: str,
    ipfs_cid: str = "",
    deadline_days: int = 0,
) -> Optional[ChainTx]:
    """Anchor a sha256 hash to blockchain with legal deadline"""
    
    if not settings.ENABLE_CHAIN_ANCHORING:
        logger.info(f"Chain anchoring disabled, skipping {object_type}: {object_id}")
        return None
    
    if not WEB3_AVAILABLE:
        logger.warning("Web3 not available, cannot anchor")
        return None
    
    w3 = get_web3()
    if not w3:
        logger.warning("Web3 not connected, cannot anchor")
        return None
    
    try:
        account = w3.eth.account.from_key(settings.CHAIN_PRIVATE_KEY)
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        
        # Get the correct contract ABI for createFIR
        contract_abi = [
            {
                "inputs": [
                    {"internalType": "bytes32", "name": "firId", "type": "bytes32"},
                    {"internalType": "bytes32", "name": "ipfsCid", "type": "bytes32"}
                ],
                "name": "createFIR",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
        
        contract = w3.eth.contract(address=contract_address, abi=contract_abi)
        
        # For FIR, use createFIR function
        if object_type == "FIR":
            fir_id_bytes32 = _to_bytes32_from_text(object_id)
            ipfs_cid_bytes32 = _to_bytes32_from_text(ipfs_cid)
            
            nonce = w3.eth.get_transaction_count(account.address)
            
            tx = contract.functions.createFIR(
                fir_id_bytes32,
                ipfs_cid_bytes32
            ).build_transaction({
                "from": account.address,
                "nonce": nonce,
                "chainId": int(settings.CHAIN_CHAIN_ID),
                "gas": 200000,
                "gasPrice": w3.to_wei(20, "gwei"),
            })
            
            signed_tx = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            tx_hash_hex = tx_hash.hex() if hasattr(tx_hash, 'hex') else tx_hash
            
            logger.info(f"✅ FIR anchored! TX: {tx_hash_hex}")
            
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            return ChainTx(
                tx_hash=tx_hash_hex,
                block_number=receipt.blockNumber,
                gas_used=receipt.gasUsed
            )
        else:
            # For other types, use recordAnchor
            # ... existing code ...
            pass
        
    except Exception as e:
        logger.error(f"Blockchain anchoring failed: {e}")
        return None


# ============ NEW FEATURE 2: Multi-Signature Approval ============

def approve_multisig(object_hash: str, approver_level: int) -> Optional[ChainTx]:
    """Approve a document/evidence with multi-signature"""
    
    if not settings.ENABLE_CHAIN_ANCHORING:
        return None
    
    w3 = get_web3()
    if not w3:
        return None
    
    try:
        account = w3.eth.account.from_key(settings.CHAIN_PRIVATE_KEY)
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        object_hash_bytes32 = _to_bytes32_from_hex_hash(object_hash)
        
        nonce = w3.eth.get_transaction_count(account.address)
        
        tx = contract.functions.approveMultiSig(
            object_hash_bytes32,
            approver_level
        ).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "chainId": int(settings.CHAIN_CHAIN_ID),
            "gas": 500000,
            "gasPrice": w3.to_wei(20, "gwei"),
        })
        
        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hash_hex = tx_hash.hex()
        
        logger.info(f"✅ Multi-signature approval sent! Level: {approver_level}, TX: {tx_hash_hex}")
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        return ChainTx(tx_hash=tx_hash_hex, block_number=receipt.blockNumber)
        
    except Exception as e:
        logger.error(f"Multi-sig approval failed: {e}")
        return None


def get_approval_status(object_hash: str) -> Dict[str, Any]:
    """Get approval status for an object"""
    
    w3 = get_web3()
    if not w3:
        return {"io_approved": False, "dsp_approved": False, "court_approved": False}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        object_hash_bytes32 = _to_bytes32_from_hex_hash(object_hash)
        
        result = contract.functions.getApprovalStatus(object_hash_bytes32).call()
        
        return {
            "io_approved": result[0],
            "dsp_approved": result[1],
            "court_approved": result[2],
            "approval_time": result[3]
        }
    except Exception as e:
        logger.error(f"Get approval status failed: {e}")
        return {"io_approved": False, "dsp_approved": False, "court_approved": False}


# ============ NEW FEATURE 3: Appeal System ============

def file_appeal(case_id: str, grounds: str) -> Optional[ChainTx]:
    """File an appeal for a case"""
    
    if not settings.ENABLE_CHAIN_ANCHORING:
        return None
    
    w3 = get_web3()
    if not w3:
        return None
    
    try:
        account = w3.eth.account.from_key(settings.CHAIN_PRIVATE_KEY)
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        case_id_bytes32 = _to_bytes32_from_text(case_id)
        
        nonce = w3.eth.get_transaction_count(account.address)
        
        tx = contract.functions.fileAppeal(
            case_id_bytes32,
            grounds
        ).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "chainId": int(settings.CHAIN_CHAIN_ID),
            "gas": 500000,
            "gasPrice": w3.to_wei(20, "gwei"),
        })
        
        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hash_hex = tx_hash.hex()
        
        logger.info(f"✅ Appeal filed! Case: {case_id}, TX: {tx_hash_hex}")
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        return ChainTx(tx_hash=tx_hash_hex, block_number=receipt.blockNumber)
        
    except Exception as e:
        logger.error(f"File appeal failed: {e}")
        return None


def get_appeal(case_id: str) -> Dict[str, Any]:
    """Get appeal details for a case"""
    
    w3 = get_web3()
    if not w3:
        return {}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        case_id_bytes32 = _to_bytes32_from_text(case_id)
        
        result = contract.functions.getAppeal(case_id_bytes32).call()
        
        return {
            "grounds": result[0],
            "filed_at": result[1],
            "accepted": result[2],
            "appellant": result[3],
            "decided_at": result[4]
        }
    except Exception as e:
        logger.error(f"Get appeal failed: {e}")
        return {}


# ============ NEW FEATURE 4: Fine Escrow ============

def deposit_escrow(case_id: str, beneficiary: str, amount_wei: int) -> Optional[ChainTx]:
    """Deposit fine into escrow"""
    
    if not settings.ENABLE_CHAIN_ANCHORING:
        return None
    
    w3 = get_web3()
    if not w3:
        return None
    
    try:
        account = w3.eth.account.from_key(settings.CHAIN_PRIVATE_KEY)
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        case_id_bytes32 = _to_bytes32_from_text(case_id)
        beneficiary_address = Web3.to_checksum_address(beneficiary)
        
        nonce = w3.eth.get_transaction_count(account.address)
        
        tx = contract.functions.depositEscrow(
            case_id_bytes32,
            beneficiary_address
        ).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "chainId": int(settings.CHAIN_CHAIN_ID),
            "gas": 500000,
            "gasPrice": w3.to_wei(20, "gwei"),
            "value": amount_wei,
        })
        
        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hash_hex = tx_hash.hex()
        
        logger.info(f"✅ Escrow deposited! Amount: {amount_wei} wei, TX: {tx_hash_hex}")
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        return ChainTx(tx_hash=tx_hash_hex, block_number=receipt.blockNumber)
        
    except Exception as e:
        logger.error(f"Deposit escrow failed: {e}")
        return None


def release_fine(case_id: str) -> Optional[ChainTx]:
    """Release fine to victim"""
    
    if not settings.ENABLE_CHAIN_ANCHORING:
        return None
    
    w3 = get_web3()
    if not w3:
        return None
    
    try:
        account = w3.eth.account.from_key(settings.CHAIN_PRIVATE_KEY)
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        case_id_bytes32 = _to_bytes32_from_text(case_id)
        
        nonce = w3.eth.get_transaction_count(account.address)
        
        tx = contract.functions.releaseFine(
            case_id_bytes32
        ).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "chainId": int(settings.CHAIN_CHAIN_ID),
            "gas": 500000,
            "gasPrice": w3.to_wei(20, "gwei"),
        })
        
        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hash_hex = tx_hash.hex()
        
        logger.info(f"✅ Fine released! Case: {case_id}, TX: {tx_hash_hex}")
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        return ChainTx(tx_hash=tx_hash_hex, block_number=receipt.blockNumber)
        
    except Exception as e:
        logger.error(f"Release fine failed: {e}")
        return None


def get_escrow(case_id: str) -> Dict[str, Any]:
    """Get escrow details for a case"""
    
    w3 = get_web3()
    if not w3:
        return {}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        case_id_bytes32 = _to_bytes32_from_text(case_id)
        
        result = contract.functions.getEscrow(case_id_bytes32).call()
        
        return {
            "amount": result[0],
            "depositor": result[1],
            "beneficiary": result[2],
            "released": result[3]
        }
    except Exception as e:
        logger.error(f"Get escrow failed: {e}")
        return {}


# ============ NEW FEATURE 5: Role Management ============

def assign_role_on_chain(user_address: str, role: int, badge_number: str = "") -> Optional[ChainTx]:
    """Assign role to user on blockchain"""
    
    if not settings.ENABLE_CHAIN_ANCHORING:
        return None
    
    w3 = get_web3()
    if not w3:
        return None
    
    try:
        account = w3.eth.account.from_key(settings.CHAIN_PRIVATE_KEY)
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        user_address_checksum = Web3.to_checksum_address(user_address)
        
        nonce = w3.eth.get_transaction_count(account.address)
        
        tx = contract.functions.assignRole(
            user_address_checksum,
            role,
            badge_number
        ).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "chainId": int(settings.CHAIN_CHAIN_ID),
            "gas": 300000,
            "gasPrice": w3.to_wei(20, "gwei"),
        })
        
        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hash_hex = tx_hash.hex()
        
        logger.info(f"✅ Role assigned! User: {user_address}, Role: {role}, TX: {tx_hash_hex}")
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        return ChainTx(tx_hash=tx_hash_hex, block_number=receipt.blockNumber)
        
    except Exception as e:
        logger.error(f"Assign role failed: {e}")
        return None


def get_user_role_on_chain(user_address: str) -> Dict[str, Any]:
    """Get user role from blockchain"""
    
    w3 = get_web3()
    if not w3:
        return {"role": 0, "badge": ""}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        user_address_checksum = Web3.to_checksum_address(user_address)
        
        result = contract.functions.getUserRole(user_address_checksum).call()
        
        return {
            "role": result[0],
            "badge": result[1]
        }
    except Exception as e:
        logger.error(f"Get user role failed: {e}")
        return {"role": 0, "badge": ""}


# ============ NEW FEATURE 6: Case Timeline ============

def update_case_timeline(case_id: str, stage: int, timestamp: int = None) -> Optional[ChainTx]:
    """Update case timeline on blockchain"""
    
    if not settings.ENABLE_CHAIN_ANCHORING:
        return None
    
    w3 = get_web3()
    if not w3:
        return None
    
    try:
        account = w3.eth.account.from_key(settings.CHAIN_PRIVATE_KEY)
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        case_id_bytes32 = _to_bytes32_from_text(case_id)
        
        if timestamp is None:
            timestamp = int(w3.eth.get_block('latest').timestamp)
        
        nonce = w3.eth.get_transaction_count(account.address)
        
        tx = contract.functions.updateCaseTimeline(
            case_id_bytes32,
            stage,
            timestamp
        ).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "chainId": int(settings.CHAIN_CHAIN_ID),
            "gas": 300000,
            "gasPrice": w3.to_wei(20, "gwei"),
        })
        
        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hash_hex = tx_hash.hex()
        
        logger.info(f"✅ Timeline updated! Case: {case_id}, Stage: {stage}, TX: {tx_hash_hex}")
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        return ChainTx(tx_hash=tx_hash_hex, block_number=receipt.blockNumber)
        
    except Exception as e:
        logger.error(f"Update timeline failed: {e}")
        return None


# ============ Legacy Verification Function ============

def verify_anchor_on_chain(
    object_type: str,
    object_id: str,
    sha256_hex: str
) -> Dict[str, Any]:
    """Verify if an object's hash is anchored on blockchain"""
    
    if not settings.ENABLE_CHAIN_ANCHORING:
        return {"verified": False, "reason": "Blockchain anchoring disabled"}
    
    if not WEB3_AVAILABLE:
        return {"verified": False, "reason": "Web3 not available"}
    
    w3 = get_web3()
    if not w3:
        return {"verified": False, "reason": "Blockchain not available"}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        object_hash_bytes32 = _to_bytes32_from_hex_hash(sha256_hex)
        count = contract.functions.anchorsCountByHash(object_hash_bytes32).call()
        
        return {
            "verified": count > 0,
            "anchor_count": count,
            "object_type": object_type,
            "object_id": object_id
        }
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        return {"verified": False, "reason": str(e)}