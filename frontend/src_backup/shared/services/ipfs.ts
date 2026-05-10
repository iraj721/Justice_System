// frontend/src/shared/services/ipfs.ts
import { API_BASE_URL } from "../env";

export async function uploadFileToIPFS(file: File, token: string): Promise<{ cid: string; url: string; name: string; hash: string }> {
    // Step 1: Calculate hash locally BEFORE upload (FAST)
    const fileHash = await calculateFileHash(file);
    console.log(`📋 Local hash calculated: ${fileHash.substring(0, 20)}...`);
    
    // Step 2: Upload to IPFS
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/ipfs/upload`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to upload to IPFS");
    }

    const result = await response.json();
    
    return {
        cid: result.cid,
        url: result.url,
        name: result.name,
        hash: fileHash  // Return the locally calculated hash
    };
}

async function calculateFileHash(file: File): Promise<string> {
    // Read file as buffer
    const buffer = await file.arrayBuffer();
    // Calculate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}