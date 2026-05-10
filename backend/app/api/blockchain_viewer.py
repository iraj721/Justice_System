"""Blockchain Data Viewer API - Complete Justice System Integration"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import logging

from app.core.authz import get_current_user
from app.core.config import settings
from app.services.ipfs_storage import ipfs_storage

# Import Web3 with proper error handling
try:
    from web3 import Web3
    WEB3_AVAILABLE = True
except ImportError:
    Web3 = None
    WEB3_AVAILABLE = False
    print("Warning: web3 not installed. Install with: pip install web3")

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/blockchain", tags=["Blockchain"])

# Complete ABI for CompleteJusticeSystem contract
CONTRACT_ABI = [
    # User functions
    {
        "inputs": [
            {"internalType": "uint8", "name": "role", "type": "uint8"},
            {"internalType": "bytes32", "name": "emailHash", "type": "bytes32"},
            {"internalType": "bytes32", "name": "ipfsCid", "type": "bytes32"}
        ],
        "name": "registerUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "getUser",
        "outputs": [
            {"internalType": "uint8", "name": "role", "type": "uint8"},
            {"internalType": "uint8", "name": "status", "type": "uint8"},
            {"internalType": "uint40", "name": "createdAt", "type": "uint40"},
            {"internalType": "bytes32", "name": "emailHash", "type": "bytes32"},
            {"internalType": "bytes32", "name": "ipfsCid", "type": "bytes32"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    # FIR functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "firId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "ipfsCid", "type": "bytes32"}
        ],
        "name": "createFIR",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "firId", "type": "bytes32"},
            {"internalType": "uint8", "name": "newStatus", "type": "uint8"},
            {"internalType": "address", "name": "assignInvestigator", "type": "address"}
        ],
        "name": "updateFIRStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # Evidence functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "evidenceHash", "type": "bytes32"},
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "uint8", "name": "evidenceType", "type": "uint8"},
            {"internalType": "bytes32", "name": "ipfsCid", "type": "bytes32"}
        ],
        "name": "addEvidence",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "evidenceHash", "type": "bytes32"},
            {"internalType": "bool", "name": "isValid", "type": "bool"}
        ],
        "name": "verifyEvidence",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # Forensic Report functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "reportId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "evidenceHash", "type": "bytes32"},
            {"internalType": "uint8", "name": "analysisType", "type": "uint8"},
            {"internalType": "bytes32", "name": "ipfsCid", "type": "bytes32"}
        ],
        "name": "createForensicReport",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "reportId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "findingsHash", "type": "bytes32"}
        ],
        "name": "completeForensicReport",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # Hearing functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "hearingId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "uint32", "name": "scheduledAt", "type": "uint32"},
            {"internalType": "uint8", "name": "hearingType", "type": "uint8"},
            {"internalType": "bytes32", "name": "meetingLink", "type": "bytes32"}
        ],
        "name": "scheduleHearing",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "hearingId", "type": "bytes32"}],
        "name": "startHearing",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "hearingId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "notesHash", "type": "bytes32"}
        ],
        "name": "endHearing",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # Judgment functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "judgmentId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "uint8", "name": "verdict", "type": "uint8"},
            {"internalType": "bytes32", "name": "sentenceHash", "type": "bytes32"},
            {"internalType": "bytes32", "name": "ipfsCid", "type": "bytes32"}
        ],
        "name": "deliverJudgment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # Appeal functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "groundsHash", "type": "bytes32"}
        ],
        "name": "fileAppeal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "bool", "name": "accept", "type": "bool"},
            {"internalType": "bytes32", "name": "decisionHash", "type": "bytes32"}
        ],
        "name": "decideAppeal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # Escrow functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "address", "name": "beneficiary", "type": "address"}
        ],
        "name": "depositEscrow",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "caseId", "type": "bytes32"}],
        "name": "releaseEscrow",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # Document functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "docId", "type": "bytes32"},
            {"internalType": "uint8", "name": "docType", "type": "uint8"},
            {"internalType": "bytes32", "name": "hash", "type": "bytes32"},
            {"internalType": "bytes32", "name": "ipfsCid", "type": "bytes32"}
        ],
        "name": "uploadDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "docId", "type": "bytes32"},
            {"internalType": "bool", "name": "verified", "type": "bool"}
        ],
        "name": "verifyDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # Feedback functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "feedbackId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "uint8", "name": "category", "type": "uint8"},
            {"internalType": "uint8", "name": "rating", "type": "uint8"},
            {"internalType": "bytes32", "name": "messageHash", "type": "bytes32"}
        ],
        "name": "submitFeedback",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # Case Timeline functions
    {
        "inputs": [
            {"internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"internalType": "uint8", "name": "stage", "type": "uint8"}
        ],
        "name": "updateCaseStage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # Statistics
    {
        "inputs": [],
        "name": "getSystemStats",
        "outputs": [
            {"internalType": "uint256", "name": "totalUsersCount", "type": "uint256"},
            {"internalType": "uint256", "name": "totalFIRsCount", "type": "uint256"},
            {"internalType": "uint256", "name": "totalCasesCount", "type": "uint256"},
            {"internalType": "uint256", "name": "totalEvidenceCount", "type": "uint256"},
            {"internalType": "uint256", "name": "totalReportsCount", "type": "uint256"},
            {"internalType": "uint256", "name": "totalJudgmentsCount", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    # Events
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "address", "name": "user", "type": "address"},
            {"indexed": False, "internalType": "uint8", "name": "role", "type": "uint8"},
            {"indexed": False, "internalType": "uint40", "name": "timestamp", "type": "uint40"}
        ],
        "name": "UserRegistered",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "bytes32", "name": "firId", "type": "bytes32"},
            {"indexed": True, "internalType": "address", "name": "complainant", "type": "address"},
            {"indexed": False, "internalType": "uint8", "name": "status", "type": "uint8"},
            {"indexed": False, "internalType": "uint40", "name": "timestamp", "type": "uint40"}
        ],
        "name": "FIRCreated",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "bytes32", "name": "evidenceHash", "type": "bytes32"},
            {"indexed": True, "internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"indexed": True, "internalType": "address", "name": "collectedBy", "type": "address"},
            {"indexed": False, "internalType": "uint8", "name": "evidenceType", "type": "uint8"},
            {"indexed": False, "internalType": "uint32", "name": "timestamp", "type": "uint32"}
        ],
        "name": "EvidenceAdded",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "bytes32", "name": "judgmentId", "type": "bytes32"},
            {"indexed": True, "internalType": "bytes32", "name": "caseId", "type": "bytes32"},
            {"indexed": True, "internalType": "address", "name": "judge", "type": "address"},
            {"indexed": False, "internalType": "uint8", "name": "verdict", "type": "uint8"},
            {"indexed": False, "internalType": "uint32", "name": "timestamp", "type": "uint32"}
        ],
        "name": "JudgmentDelivered",
        "type": "event"
    }
]


def get_web3():
    """Get Web3 connection if available"""
    if not WEB3_AVAILABLE or Web3 is None:
        return None
    try:
        w3 = Web3(Web3.HTTPProvider(settings.CHAIN_RPC_URL, request_kwargs={"timeout": 10}))
        if w3.is_connected():
            return w3
    except Exception as e:
        logger.warning(f"Web3 connection failed: {e}")
    return None


def bytes32_to_string(bytes32_val):
    """Convert bytes32 to readable string"""
    if not bytes32_val:
        return ""
    if isinstance(bytes32_val, str):
        return bytes32_val
    try:
        if isinstance(bytes32_val, bytes):
            result = bytes32_val.rstrip(b'\x00').decode('utf-8')
            return result if result else bytes32_val.hex()[:20]
        return str(bytes32_val)[:20]
    except:
        try:
            return bytes32_val.hex()[:20] + "..."
        except:
            return str(bytes32_val)[:20]


@router.get("/status")
async def get_blockchain_status(current_user: dict = Depends(get_current_user)):
    """Check if blockchain is connected"""
    if not WEB3_AVAILABLE or Web3 is None:
        return {
            "connected": False,
            "message": "Web3 library not installed. Install with: pip install web3",
            "rpc_url": settings.CHAIN_RPC_URL,
            "contract_address": settings.CHAIN_CONTRACT_ADDRESS
        }
    
    w3 = get_web3()
    if not w3:
        return {
            "connected": False,
            "message": "Blockchain not connected. Make sure Ganache is running on port 7545",
            "rpc_url": settings.CHAIN_RPC_URL,
            "contract_address": settings.CHAIN_CONTRACT_ADDRESS
        }
    
    try:
        block_number = w3.eth.block_number
        chain_id = w3.eth.chain_id
        
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        code = w3.eth.get_code(contract_address)
        
        return {
            "connected": True,
            "chain_id": chain_id,
            "latest_block": block_number,
            "rpc_url": settings.CHAIN_RPC_URL,
            "contract_address": settings.CHAIN_CONTRACT_ADDRESS,
            "contract_deployed": len(code) > 0
        }
    except Exception as e:
        logger.error(f"Blockchain status error: {e}")
        return {"connected": False, "error": str(e)}


@router.get("/system-stats")
async def get_system_stats(current_user: dict = Depends(get_current_user)):
    """Get complete system statistics from blockchain contract"""
    if not WEB3_AVAILABLE or Web3 is None:
        return {"error": "Web3 not installed", "success": False}
    
    w3 = get_web3()
    if not w3:
        return {"error": "Blockchain not connected", "success": False}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        stats = contract.functions.getSystemStats().call()
        
        return {
            "success": True,
            "total_users": stats[0],
            "total_firs": stats[1],
            "total_cases": stats[2],
            "total_evidence": stats[3],
            "total_forensic_reports": stats[4],
            "total_judgments": stats[5],
            "chain_id": w3.eth.chain_id,
            "latest_block": w3.eth.block_number,
            "contract_address": settings.CHAIN_CONTRACT_ADDRESS
        }
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        return {"error": str(e), "success": False}


@router.get("/stats")
async def get_blockchain_stats(current_user: dict = Depends(get_current_user)):
    """Get blockchain statistics (simplified)"""
    if not WEB3_AVAILABLE or Web3 is None:
        return {"error": "Web3 not installed", "success": False, "connected": False}
    
    w3 = get_web3()
    if not w3:
        return {"error": "Blockchain not connected", "success": False, "connected": False}
    
    try:
        return {
            "success": True,
            "connected": True,
            "chain_id": w3.eth.chain_id,
            "latest_block": w3.eth.block_number,
            "contract_address": settings.CHAIN_CONTRACT_ADDRESS
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return {"error": str(e), "success": False, "connected": False}


@router.get("/anchors")
async def get_all_anchors(current_user: dict = Depends(get_current_user)):
    """Get all anchor events from blockchain (EvidenceAdded events)"""
    if not WEB3_AVAILABLE or Web3 is None:
        return {"error": "Web3 not installed", "anchors": [], "total_anchors": 0}
    
    w3 = get_web3()
    if not w3:
        return {"error": "Blockchain not connected", "anchors": [], "total_anchors": 0}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        latest_block = w3.eth.block_number
        from_block = max(0, latest_block - 10000)
        
        # Get EvidenceAdded events
        event_filter = contract.events.EvidenceAdded.create_filter(
            from_block=from_block,
            to_block='latest'
        )
        
        events = event_filter.get_all_entries()
        
        anchors = []
        for event in events:
            args = event['args']
            anchors.append({
                "tx_hash": event['transactionHash'].hex(),
                "block_number": event['blockNumber'],
                "object_hash": args['evidenceHash'].hex(),
                "object_type": "EVIDENCE",
                "case_id": args['caseId'].hex(),
                "evidence_type": args['evidenceType'],
                "collected_by": args['collectedBy'],
                "timestamp": args['timestamp'],
                "datetime": datetime.fromtimestamp(args['timestamp']).isoformat()
            })
        
        anchors.reverse()
        
        return {
            "success": True,
            "total_anchors": len(anchors),
            "latest_block": latest_block,
            "anchors": anchors
        }
        
    except Exception as e:
        logger.error(f"Error getting anchors: {e}")
        return {"error": str(e), "anchors": [], "total_anchors": 0}


@router.get("/judgments")
async def get_judgments_from_blockchain(current_user: dict = Depends(get_current_user)):
    """Get all judgment events from blockchain"""
    if not WEB3_AVAILABLE or Web3 is None:
        return {"error": "Web3 not installed", "judgments": [], "total_judgments": 0}
    
    w3 = get_web3()
    if not w3:
        return {"error": "Blockchain not connected", "judgments": [], "total_judgments": 0}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        latest_block = w3.eth.block_number
        from_block = max(0, latest_block - 10000)
        
        event_filter = contract.events.JudgmentDelivered.create_filter(
            from_block=from_block,
            to_block='latest'
        )
        
        events = event_filter.get_all_entries()
        
        judgments = []
        for event in events:
            args = event['args']
            judgments.append({
                "tx_hash": event['transactionHash'].hex(),
                "block_number": event['blockNumber'],
                "judgment_id": args['judgmentId'].hex(),
                "case_id": args['caseId'].hex(),
                "judge": args['judge'],
                "verdict": args['verdict'],
                "timestamp": args['timestamp'],
                "datetime": datetime.fromtimestamp(args['timestamp']).isoformat()
            })
        
        judgments.reverse()
        
        return {
            "success": True,
            "total_judgments": len(judgments),
            "judgments": judgments
        }
        
    except Exception as e:
        logger.error(f"Error getting judgments: {e}")
        return {"error": str(e), "judgments": [], "total_judgments": 0}


@router.get("/users")
async def get_users_from_blockchain(current_user: dict = Depends(get_current_user)):
    """Get all user registration events from blockchain"""
    if not WEB3_AVAILABLE or Web3 is None:
        return {"error": "Web3 not installed", "users": [], "total_users": 0}
    
    w3 = get_web3()
    if not w3:
        return {"error": "Blockchain not connected", "users": [], "total_users": 0}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        latest_block = w3.eth.block_number
        from_block = max(0, latest_block - 10000)
        
        event_filter = contract.events.UserRegistered.create_filter(
            from_block=from_block,
            to_block='latest'
        )
        
        events = event_filter.get_all_entries()
        
        users_list = []
        for event in events:
            args = event['args']
            users_list.append({
                "tx_hash": event['transactionHash'].hex(),
                "block_number": event['blockNumber'],
                "user": args['user'],
                "role": args['role'],
                "timestamp": args['timestamp'],
                "datetime": datetime.fromtimestamp(args['timestamp']).isoformat()
            })
        
        users_list.reverse()
        
        return {
            "success": True,
            "total_users": len(users_list),
            "users": users_list
        }
        
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        return {"error": str(e), "users": [], "total_users": 0}


@router.get("/firs")
async def get_firs_from_blockchain(current_user: dict = Depends(get_current_user)):
    """Get all FIR creation events from blockchain"""
    if not WEB3_AVAILABLE or Web3 is None:
        return {"error": "Web3 not installed", "firs": [], "total_firs": 0}
    
    w3 = get_web3()
    if not w3:
        return {"error": "Blockchain not connected", "firs": [], "total_firs": 0}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        latest_block = w3.eth.block_number
        from_block = max(0, latest_block - 10000)
        
        event_filter = contract.events.FIRCreated.create_filter(
            from_block=from_block,
            to_block='latest'
        )
        
        events = event_filter.get_all_entries()
        
        firs_list = []
        for event in events:
            args = event['args']
            firs_list.append({
                "tx_hash": event['transactionHash'].hex(),
                "block_number": event['blockNumber'],
                "fir_id": args['firId'].hex(),
                "complainant": args['complainant'],
                "status": args['status'],
                "timestamp": args['timestamp'],
                "datetime": datetime.fromtimestamp(args['timestamp']).isoformat()
            })
        
        firs_list.reverse()
        
        return {
            "success": True,
            "total_firs": len(firs_list),
            "firs": firs_list
        }
        
    except Exception as e:
        logger.error(f"Error getting firs: {e}")
        return {"error": str(e), "firs": [], "total_firs": 0}


@router.get("/summary")
async def get_blockchain_summary(current_user: dict = Depends(get_current_user)):
    """Get complete blockchain summary with all stats"""
    if not WEB3_AVAILABLE or Web3 is None:
        return {"error": "Web3 not installed", "success": False}
    
    w3 = get_web3()
    if not w3:
        return {"error": "Blockchain not connected", "success": False}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        # Get system stats
        stats = contract.functions.getSystemStats().call()
        
        # Get counts from events
        from_block = max(0, w3.eth.block_number - 10000)
        
        evidence_filter = contract.events.EvidenceAdded.create_filter(from_block=from_block, to_block='latest')
        judgment_filter = contract.events.JudgmentDelivered.create_filter(from_block=from_block, to_block='latest')
        user_filter = contract.events.UserRegistered.create_filter(from_block=from_block, to_block='latest')
        fir_filter = contract.events.FIRCreated.create_filter(from_block=from_block, to_block='latest')
        
        return {
            "success": True,
            "connected": True,
            "contract_address": settings.CHAIN_CONTRACT_ADDRESS,
            "chain_id": w3.eth.chain_id,
            "latest_block": w3.eth.block_number,
            "system_stats": {
                "total_users": stats[0],
                "total_firs": stats[1],
                "total_cases": stats[2],
                "total_evidence": stats[3],
                "total_forensic_reports": stats[4],
                "total_judgments": stats[5]
            },
            "recent_counts": {
                "evidence_events": len(evidence_filter.get_all_entries()),
                "judgment_events": len(judgment_filter.get_all_entries()),
                "user_events": len(user_filter.get_all_entries()),
                "fir_events": len(fir_filter.get_all_entries())
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting summary: {e}")
        return {"error": str(e), "success": False}


@router.get("/evidence/{evidence_id}")
async def get_evidence_blockchain_info(
    evidence_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get blockchain info for specific evidence"""
    evidence = ipfs_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    evidence_hash = evidence.get("hash", "")
    
    blockchain_data = {}
    
    if WEB3_AVAILABLE and Web3 is not None:
        w3 = get_web3()
        if w3:
            try:
                contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
                contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
                
                event_filter = contract.events.EvidenceAdded.create_filter(
                    from_block=0,
                    to_block='latest'
                )
                events = event_filter.get_all_entries()
                
                matching_events = []
                for event in events:
                    event_hash = event['args']['evidenceHash'].hex()
                    if event_hash == evidence_hash or event_hash[:32] == evidence_hash[:32]:
                        matching_events.append({
                            "tx_hash": event['transactionHash'].hex(),
                            "block_number": event['blockNumber'],
                            "case_id": event['args']['caseId'].hex(),
                            "collected_by": event['args']['collectedBy'],
                            "timestamp": event['args']['timestamp'],
                            "datetime": datetime.fromtimestamp(event['args']['timestamp']).isoformat()
                        })
                
                blockchain_data = {
                    "verified_on_chain": len(matching_events) > 0,
                    "anchor_count": len(matching_events),
                    "anchors": matching_events
                }
            except Exception as e:
                blockchain_data = {"error": str(e)}
    
    return {
        "evidence_id": evidence_id,
        "evidence_title": evidence.get("title"),
        "local_hash": evidence_hash,
        "ipfs_cid": evidence.get("ipfs_cid"),
        "created_at": evidence.get("created_at"),
        "blockchain": blockchain_data
    }


@router.get("/verify/{evidence_id}")
async def verify_evidence_online(
    evidence_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Verify if evidence exists on blockchain"""
    evidence = ipfs_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    if not WEB3_AVAILABLE or Web3 is None:
        return {
            "verified": False,
            "message": "Web3 not installed",
            "evidence_id": evidence_id
        }
    
    w3 = get_web3()
    if not w3:
        return {
            "verified": False,
            "message": "Blockchain not connected",
            "evidence_id": evidence_id
        }
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        evidence_hash = evidence.get("hash", "")
        
        event_filter = contract.events.EvidenceAdded.create_filter(
            from_block=0,
            to_block='latest'
        )
        events = event_filter.get_all_entries()
        
        found = False
        for event in events:
            event_hash = event['args']['evidenceHash'].hex()
            if event_hash == evidence_hash or event_hash[:32] == evidence_hash[:32]:
                found = True
                break
        
        return {
            "verified": found,
            "evidence_id": evidence_id,
            "evidence_title": evidence.get("title"),
            "hash_on_blockchain": found,
            "message": "✅ Evidence is verified on blockchain!" if found else "❌ Evidence not found on blockchain"
        }
        
    except Exception as e:
        return {"verified": False, "error": str(e)}


@router.get("/contract-info")
async def get_contract_info(current_user: dict = Depends(get_current_user)):
    """Get detailed contract information"""
    if not WEB3_AVAILABLE or Web3 is None:
        return {"error": "Web3 not installed"}
    
    w3 = get_web3()
    if not w3:
        return {"error": "Blockchain not connected"}
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        
        code = w3.eth.get_code(contract_address)
        balance = w3.eth.get_balance(contract_address)
        
        return {
            "address": contract_address,
            "is_contract": len(code) > 0,
            "balance_eth": w3.from_wei(balance, 'ether'),
            "deployed": len(code) > 0
        }
    except Exception as e:
        return {"error": str(e)}