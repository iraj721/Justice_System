"""JSON encoder for MongoDB ObjectId"""
from bson import ObjectId
import json
from typing import Any

class MongoJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for MongoDB ObjectId"""
    def default(self, obj: Any) -> Any:
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)


def convert_objectid_to_str(data: Any) -> Any:
    """Recursively convert ObjectId to string in dict/list"""
    if isinstance(data, dict):
        return {k: convert_objectid_to_str(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    return data