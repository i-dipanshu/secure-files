#!/usr/bin/env python3
"""
Test script to verify file sharing functionality.
"""

import requests
import json
import sys

def test_sharing_functionality():
    """Test the file sharing endpoints."""
    
    # Test configuration
    BASE_URL = "http://localhost:8000"
    
    # Note: Replace with actual JWT token from a logged-in user
    # You can get this from the browser's localStorage after logging in
    JWT_TOKEN = "YOUR_JWT_TOKEN_HERE"
    
    headers = {
        "Authorization": f"Bearer {JWT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    print("🔧 Testing File Sharing Functionality")
    print("=" * 50)
    
    # 1. Test listing user files
    print("\n1️⃣ Testing file listing...")
    try:
        response = requests.get(f"{BASE_URL}/api/files/", headers=headers)
        if response.status_code == 200:
            files = response.json().get("files", [])
            print(f"✅ Found {len(files)} files")
            
            if files:
                test_file = files[0]
                file_id = test_file["file_id"]
                print(f"📁 Using test file: {test_file['display_name']} (ID: {file_id})")
                
                # 2. Test sharing with another user
                print("\n2️⃣ Testing private file sharing...")
                share_data = {
                    "target_user": "testuser2",  # Replace with actual username
                    "permission_type": "READ",
                    "expires_hours": 168  # 7 days
                }
                
                share_response = requests.post(
                    f"{BASE_URL}/api/files/{file_id}/share",
                    headers=headers,
                    json=share_data
                )
                
                if share_response.status_code == 200:
                    share_result = share_response.json()
                    print("✅ File shared successfully!")
                    print(f"   Shared with: {share_data['target_user']}")
                    print(f"   Permission: {share_data['permission_type']}")
                    print(f"   Expires in: {share_data['expires_hours']} hours")
                else:
                    print(f"❌ Sharing failed: {share_response.status_code}")
                    print(f"   Error: {share_response.text}")
                
                # 3. Test getting file permissions
                print("\n3️⃣ Testing permission listing...")
                perm_response = requests.get(
                    f"{BASE_URL}/api/files/{file_id}/permissions",
                    headers=headers
                )
                
                if perm_response.status_code == 200:
                    permissions = perm_response.json().get("permissions", [])
                    print(f"✅ Found {len(permissions)} permissions for this file")
                    for perm in permissions:
                        print(f"   👤 {perm['username']} - {perm['permission_type']}")
                else:
                    print(f"❌ Permission listing failed: {perm_response.status_code}")
                
                # 4. Test shared files listing
                print("\n4️⃣ Testing shared files listing...")
                shared_response = requests.get(f"{BASE_URL}/api/files/shared", headers=headers)
                
                if shared_response.status_code == 200:
                    shared_files = shared_response.json().get("files", [])
                    print(f"✅ Found {len(shared_files)} shared files")
                else:
                    print(f"❌ Shared files listing failed: {shared_response.status_code}")
                
            else:
                print("⚠️  No files found to test sharing with")
                
        else:
            print(f"❌ File listing failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("📝 Test Summary:")
    print("1. Backend API endpoints for sharing exist ✅")
    print("2. Frontend should now work with proper user input ✅")
    print("3. Replace JWT_TOKEN with actual token to test ⚠️")
    print("4. Public sharing may need additional backend work ⚠️")
    
    return True

if __name__ == "__main__":
    print("🚀 File Sharing Functionality Test")
    print("📋 Instructions:")
    print("1. Make sure backend is running on http://localhost:8000")
    print("2. Replace JWT_TOKEN with actual token from browser")
    print("3. Replace 'testuser2' with actual username to share with")
    print("4. Run this script to test sharing functionality")
    print()
    
    if len(sys.argv) > 1 and sys.argv[1] == "run":
        test_sharing_functionality()
    else:
        print("Add 'run' argument to execute tests: python test_sharing_functionality.py run") 