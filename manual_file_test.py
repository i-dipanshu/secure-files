#!/usr/bin/env python3
"""
Manual File Upload Test
Tests file upload functionality with existing user credentials
"""

import asyncio
import httpx
import tempfile
import time
from pathlib import Path

async def test_file_operations():
    """Test file operations with an existing user."""
    print("🔧 MANUAL FILE OPERATIONS TEST")
    print("=" * 50)
    
    # You'll need to replace this with an actual JWT token from a logged-in user
    # Get this from the browser's localStorage or by manually logging in through the UI
    TEST_TOKEN = "your_jwt_token_here"  # Replace with actual token
    
    if TEST_TOKEN == "your_jwt_token_here":
        print("⚠️  Please get a real JWT token from your browser:")
        print("   1. Open http://localhost:3000")
        print("   2. Log in with your account")
        print("   3. Open browser DevTools > Application > Local Storage")
        print("   4. Copy the 'zkp_token' value")
        print("   5. Replace TEST_TOKEN in this script")
        return False
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        auth_headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        
        # Test 1: Check authentication
        print("\n1️⃣  Testing Authentication...")
        try:
            response = await client.get(
                'http://localhost:8000/api/auth/verify',
                headers=auth_headers
            )
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"✅ Authenticated as: {user_data.get('username')}")
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Auth error: {e}")
            return False
        
        # Test 2: File Upload
        print("\n2️⃣  Testing File Upload...")
        try:
            # Create a test PDF-like file
            test_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000125 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n196\n%%EOF"
            
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
                temp_file.write(test_content)
                temp_file_path = temp_file.name
            
            # Upload the file
            with open(temp_file_path, 'rb') as file_obj:
                files = {
                    'file': ('test_manual.pdf', file_obj, 'application/pdf')
                }
                data = {
                    'display_name': 'Manual Test PDF',
                    'description': 'Test PDF file for manual verification',
                    'tags': 'test,pdf,manual',
                    'is_public': 'false'
                }
                
                response = await client.post(
                    'http://localhost:8000/api/files/upload',
                    headers=auth_headers,
                    files=files,
                    data=data
                )
            
            # Clean up temp file
            Path(temp_file_path).unlink()
            
            if response.status_code == 201:
                result = response.json()
                file_id = result.get('file_id')
                print(f"✅ File uploaded successfully! File ID: {file_id}")
                
                # Test 3: File Listing
                print("\n3️⃣  Testing File Listing...")
                response = await client.get(
                    'http://localhost:8000/api/files/',
                    headers=auth_headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    files = data.get('files', [])
                    print(f"✅ Retrieved {len(files)} files")
                    
                    # Find our uploaded file
                    uploaded_file = next((f for f in files if f.get('file_id') == file_id), None)
                    if uploaded_file:
                        print(f"✅ Found uploaded file: {uploaded_file.get('display_name')}")
                    
                    return True
                else:
                    print(f"❌ File listing failed: {response.status_code}")
                    return False
            else:
                error_data = response.json() if response.content else {'detail': 'Unknown error'}
                print(f"❌ Upload failed: {error_data}")
                return False
                
        except Exception as e:
            print(f"❌ Upload error: {e}")
            return False

if __name__ == "__main__":
    result = asyncio.run(test_file_operations())
    print(f"\n{'✅ SUCCESS' if result else '❌ FAILED'}: Manual test {'passed' if result else 'failed'}")
    
    print("\n" + "=" * 50)
    print("🎯 QUICK UI TEST INSTRUCTIONS:")
    print("=" * 50)
    print("1. Open http://localhost:3000")
    print("2. Register/Login with your account")
    print("3. Go to File Manager (Dashboard)")
    print("4. Click 'Upload File' and select any PDF")
    print("5. Fill in details and upload")
    print("6. Verify the file appears in the list")
    print("7. Click 'Share' button on any file")
    print("8. Create a share link and copy it")
    print("9. Test download functionality")
    print("\n✨ All share and download features should work!") 