"""Blockchain Service - Complete Justice System Integration"""
from web3 import Web3
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Contract ABI for CompleteJusticeSystem (simplified for service)
CONTRACT_ABI = [
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
    {
        "inputs": [],
        "name": "totalUsers",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]


def get_web3():
    """Get Web3 connection"""
    try:
        w3 = Web3(Web3.HTTPProvider(settings.CHAIN_RPC_URL, request_kwargs={"timeout": 5}))
        if w3.is_connected():
            return w3
    except Exception as e:
        logger.warning(f"Web3 connection failed: {e}")
    return None


async def get_blockchain_status():
    """Check if blockchain is connected"""
    w3 = get_web3()
    if not w3:
        return {
            "connected": False,
            "message": "Ganache not running on port 7545",
            "rpc_url": settings.CHAIN_RPC_URL
        }
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        code = w3.eth.get_code(contract_address)
        
        return {
            "connected": True,
            "chain_id": w3.eth.chain_id,
            "latest_block": w3.eth.block_number,
            "contract_address": settings.CHAIN_CONTRACT_ADDRESS,
            "contract_deployed": len(code) > 0
        }
    except Exception as e:
        logger.error(f"Blockchain status error: {e}")
        return {
            "connected": False,
            "error": str(e),
            "rpc_url": settings.CHAIN_RPC_URL
        }


async def get_system_stats():
    """Get system statistics from blockchain"""
    w3 = get_web3()
    if not w3:
        return None
    
    try:
        contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        
        stats = contract.functions.getSystemStats().call()
        
        return {
            "total_users": stats[0],
            "total_firs": stats[1],
            "total_cases": stats[2],
            "total_evidence": stats[3],
            "total_forensic_reports": stats[4],
            "total_judgments": stats[5]
        }
    except Exception as e:
        logger.error(f"Get system stats failed: {e}")
        return None