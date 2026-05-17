"""Storage Service - Now using MongoDB (Centralized)"""
from app.services.mongo_storage import mongo_storage

# Re-export mongo_storage as ipfs_storage for backward compatibility
ipfs_storage = mongo_storage