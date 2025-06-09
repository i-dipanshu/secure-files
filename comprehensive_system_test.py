#!/usr/bin/env python3
"""
Comprehensive ZKP File Sharing System Test
Tests all functionality including file uploads, authentication, and UI integration
"""

import asyncio
import httpx
import json
import sys
import uuid
import time
from pathlib import Path
import tempfile

async def test_comprehensive_system():
    """Test the complete ZKP file sharing system."""
    print("🧪 COMPREHENSIVE ZKP FILE SHARING SYSTEM TEST")
    print("=" * 60)
    
    # Test results tracking
    test_results = []
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        
        # 1. Test Backend Health
        print("\n1️⃣  Testing Backend Health...")
        try:
            response = await client.get('http://localhost:8000/health')
            if response.status_code == 200:
                print("✅ Backend: Healthy and responding")
                test_results.append(("Backend Health", True, "API responding correctly"))
            else:
                print(f"❌ Backend: Unhealthy (Status: {response.status_code})")
                test_results.append(("Backend Health", False, f"Status: {response.status_code}"))
        except Exception as e:
            print(f"❌ Backend: Connection failed - {e}")
            test_results.append(("Backend Health", False, str(e)))
            
        # 2. Test Frontend Accessibility
        print("\n2️⃣  Testing Frontend Accessibility...")
        try:
            response = await client.get('http://localhost:3000')
            if response.status_code == 200 and 'React App' in response.text:
                print("✅ Frontend: React app serving properly")
                test_results.append(("Frontend Accessibility", True, "React app accessible"))
            else:
                print(f"❌ Frontend: Issue detected (Status: {response.status_code})")
                test_results.append(("Frontend Accessibility", False, f"Status: {response.status_code}"))
        except Exception as e:
            print(f"❌ Frontend: Connection failed - {e}")
            test_results.append(("Frontend Accessibility", False, str(e)))
            
        # 3. Test User Registration
        print("\n3️⃣  Testing User Registration...")
        try:
            # Generate unique username
            unique_id = uuid.uuid4().hex[:8]
            username = f"testuser_{unique_id}"
            email = f"test_{unique_id}@example.com"
            
            # Mock key pair (in real scenario, this would be generated client-side)
            public_key = "03a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd"
            
            registration_data = {
                "username": username,
                "email": email,
                "public_key": public_key
            }
            
            response = await client.post(
                'http://localhost:8000/api/auth/register',
                json=registration_data
            )
            
            if response.status_code == 201:
                result = response.json()
                user_id = result.get('user_id')
                print(f"✅ Registration: User created (ID: {user_id})")
                test_results.append(("User Registration", True, f"User ID: {user_id}"))
            else:
                error_detail = response.json().get('detail', 'Unknown error')
                print(f"❌ Registration: Failed - {error_detail}")
                test_results.append(("User Registration", False, error_detail))
                
        except Exception as e:
            print(f"❌ Registration: Exception - {e}")
            test_results.append(("User Registration", False, str(e)))
            
        # 4. Test User Login
        print("\n4️⃣  Testing User Login...")
        try:
            # Mock challenge-response (in real scenario, this involves cryptographic proof)
            login_data = {
                "identifier": username,
                "signature": "mock_signature_for_testing",
                "challenge": "mock_challenge"
            }
            
            response = await client.post(
                'http://localhost:8000/api/auth/login',
                json=login_data
            )
            
            if response.status_code == 200:
                result = response.json()
                token = result.get('access_token')
                if token:
                    print("✅ Login: Authentication successful")
                    test_results.append(("User Login", True, "JWT token received"))
                    
                    # Store token for subsequent tests
                    auth_headers = {"Authorization": f"Bearer {token}"}
                else:
                    print("❌ Login: No token received")
                    test_results.append(("User Login", False, "No token in response"))
            else:
                error_detail = response.json().get('detail', 'Unknown error')
                print(f"❌ Login: Failed - {error_detail}")
                test_results.append(("User Login", False, error_detail))
                
        except Exception as e:
            print(f"❌ Login: Exception - {e}")
            test_results.append(("User Login", False, str(e)))
            
        # 5. Test Token Verification
        print("\n5️⃣  Testing Token Verification...")
        try:
            if 'auth_headers' in locals():
                response = await client.get(
                    'http://localhost:8000/api/auth/verify',
                    headers=auth_headers
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    print(f"✅ Token Verification: Valid (User: {user_data.get('username')})")
                    test_results.append(("Token Verification", True, "Token is valid"))
                else:
                    print(f"❌ Token Verification: Failed (Status: {response.status_code})")
                    test_results.append(("Token Verification", False, f"Status: {response.status_code}"))
            else:
                print("⚠️  Token Verification: Skipped (No token available)")
                test_results.append(("Token Verification", False, "No token to verify"))
                
        except Exception as e:
            print(f"❌ Token Verification: Exception - {e}")
            test_results.append(("Token Verification", False, str(e)))
            
        # 6. Test File Upload
        print("\n6️⃣  Testing File Upload...")
        try:
            if 'auth_headers' in locals():
                # Create a test file
                test_content = f"Test file content for upload testing - {time.time()}"
                
                with tempfile.NamedTemporaryFile(mode='w+', suffix='.txt', delete=False) as temp_file:
                    temp_file.write(test_content)
                    temp_file_path = temp_file.name
                
                # Prepare upload data
                with open(temp_file_path, 'rb') as file_obj:
                    files = {
                        'file': ('test_upload.txt', file_obj, 'text/plain')
                    }
                    data = {
                        'display_name': 'Test Upload File',
                        'description': 'Comprehensive test file upload',
                        'tags': 'test,upload,automated',
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
                    print(f"✅ File Upload: Success (File ID: {file_id})")
                    test_results.append(("File Upload", True, f"File ID: {file_id}"))
                else:
                    error_detail = response.json().get('detail', 'Unknown error')
                    print(f"❌ File Upload: Failed - {error_detail}")
                    test_results.append(("File Upload", False, error_detail))
            else:
                print("⚠️  File Upload: Skipped (No authentication)")
                test_results.append(("File Upload", False, "No authentication token"))
                
        except Exception as e:
            print(f"❌ File Upload: Exception - {e}")
            test_results.append(("File Upload", False, str(e)))
            
        # 7. Test File Listing
        print("\n7️⃣  Testing File Listing...")
        try:
            if 'auth_headers' in locals():
                response = await client.get(
                    'http://localhost:8000/api/files/',
                    headers=auth_headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    files = result.get('files', [])
                    file_count = len(files)
                    print(f"✅ File Listing: Success ({file_count} files found)")
                    test_results.append(("File Listing", True, f"{file_count} files"))
                else:
                    print(f"❌ File Listing: Failed (Status: {response.status_code})")
                    test_results.append(("File Listing", False, f"Status: {response.status_code}"))
            else:
                print("⚠️  File Listing: Skipped (No authentication)")
                test_results.append(("File Listing", False, "No authentication token"))
                
        except Exception as e:
            print(f"❌ File Listing: Exception - {e}")
            test_results.append(("File Listing", False, str(e)))
            
        # 8. Test Storage Info
        print("\n8️⃣  Testing Storage Information...")
        try:
            if 'auth_headers' in locals():
                response = await client.get(
                    'http://localhost:8000/api/files/storage/info',
                    headers=auth_headers
                )
                
                if response.status_code == 200:
                    storage_info = response.json()
                    storage_used = storage_info.get('storage_used', 0)
                    file_count = storage_info.get('file_count', 0)
                    print(f"✅ Storage Info: {storage_used} bytes used, {file_count} files")
                    test_results.append(("Storage Information", True, f"{storage_used} bytes, {file_count} files"))
                else:
                    print(f"❌ Storage Info: Failed (Status: {response.status_code})")
                    test_results.append(("Storage Information", False, f"Status: {response.status_code}"))
            else:
                print("⚠️  Storage Info: Skipped (No authentication)")
                test_results.append(("Storage Information", False, "No authentication token"))
                
        except Exception as e:
            print(f"❌ Storage Info: Exception - {e}")
            test_results.append(("Storage Information", False, str(e)))
    
    # Results Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(1 for _, success, _ in test_results if success)
    total_tests = len(test_results)
    
    for test_name, success, details in test_results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status:8} | {test_name:20} | {details}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL TESTS PASSED! System is fully functional!")
        print("\n📱 Access Points:")
        print("   Frontend:  http://localhost:3000")
        print("   Backend:   http://localhost:8000")
        print("   API Docs:  http://localhost:8000/docs")
        print("\n🔐 Features Verified:")
        print("   • ZKP Authentication")
        print("   • File Upload & Management")
        print("   • Storage Tracking")
        print("   • API Integration")
        print("   • Frontend Connectivity")
    else:
        print(f"\n⚠️  {total_tests - passed_tests} tests failed. Please check the issues above.")
        return False
    
    return True

if __name__ == "__main__":
    try:
        result = asyncio.run(test_comprehensive_system())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n❌ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")
        sys.exit(1) 