#!/usr/bin/env python3
"""
Comprehensive Production Test Suite for ZKP File Sharing System

This script tests all major functionality to ensure production readiness.
"""

import asyncio
import httpx
import json
import time
import tempfile
import os
import uuid
from typing import Dict, Any, Optional

# Test configuration
API_BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

class ProductionTester:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=API_BASE_URL, timeout=30.0)
        self.test_results = {}
        self.user_token = None
        self.user_id = None
        self.test_file_id = None
        self.private_key = None  # Store private key for reuse
        # Generate unique username to avoid conflicts
        self.test_username = f"prodtest_{str(uuid.uuid4())[:8]}"
        self.test_email = f"{self.test_username}@example.com"
        
    async def run_all_tests(self):
        """Run all production tests."""
        print("🚀 Starting Comprehensive Production Test Suite")
        print("=" * 60)
        
        tests = [
            ("Infrastructure Health", self.test_infrastructure),
            ("User Registration", self.test_user_registration),
            ("User Authentication", self.test_user_login),
            ("Token Verification", self.test_token_verification),
            ("File Upload", self.test_file_upload),
            ("File Listing", self.test_file_listing),
            ("File Details", self.test_file_details),
            ("File Metadata Update", self.test_file_update),
            ("Download URL Generation", self.test_download_url),
            ("File Download", self.test_file_download),
            ("Storage Information", self.test_storage_info),
            ("File Deletion", self.test_file_deletion),
            ("Error Handling", self.test_error_handling),
            ("Performance", self.test_performance),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                print(f"\n🧪 Testing: {test_name}")
                result = await test_func()
                if result:
                    print(f"✅ {test_name}: PASSED")
                    passed += 1
                else:
                    print(f"❌ {test_name}: FAILED")
                    failed += 1
                self.test_results[test_name] = result
            except Exception as e:
                print(f"💥 {test_name}: ERROR - {str(e)}")
                failed += 1
                self.test_results[test_name] = False
        
        await self.client.aclose()
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {passed / (passed + failed) * 100:.1f}%")
        
        if failed == 0:
            print("\n🎉 ALL TESTS PASSED - PRODUCTION READY! 🎉")
        else:
            print(f"\n⚠️ {failed} test(s) failed - Review required")
        
        return failed == 0
    
    async def test_infrastructure(self) -> bool:
        """Test basic infrastructure health."""
        try:
            # Test backend health
            response = await self.client.get("/health")
            if response.status_code != 200:
                return False
            
            # Test frontend availability
            async with httpx.AsyncClient() as client:
                frontend_response = await client.get(FRONTEND_URL)
                if frontend_response.status_code not in [200, 304]:
                    print(f"   Frontend not accessible: {frontend_response.status_code}")
                    return False
            
            print("   ✓ Backend API healthy")
            print("   ✓ Frontend accessible")
            return True
        except Exception as e:
            print(f"   Infrastructure error: {e}")
            return False
    
    async def test_user_registration(self) -> bool:
        """Test user registration with ZKP."""
        try:
            # Generate keypair
            keypair_response = await self.client.post(
                "/api/auth/utils/generate-keypair",
                json={"username": self.test_username}
            )
            if keypair_response.status_code != 200:
                return False
            
            keypair_data = keypair_response.json()["data"]
            self.private_key = keypair_data["private_key"]  # Store for later use
            
            # Generate proof for registration
            proof_response = await self.client.post(
                "/api/auth/utils/generate-proof",
                json={
                    "username": self.test_username,
                    "private_key": keypair_data["private_key"]
                }
            )
            if proof_response.status_code != 200:
                return False
            
            proof_data = proof_response.json()["data"]
            
            # Register user
            register_response = await self.client.post(
                "/api/auth/register",
                json={
                    "username": self.test_username,
                    "email": self.test_email,
                    "public_key": keypair_data["public_key"],
                    "zkp_proof": proof_data["zkp_proof"]
                }
            )
            
            if register_response.status_code == 201:
                user_data = register_response.json()["data"]
                self.user_id = user_data["user_id"]
                print(f"   ✓ User registered: {user_data['username']}")
                return True
            
            return False
        except Exception as e:
            print(f"   Registration error: {e}")
            return False
    
    async def test_user_login(self) -> bool:
        """Test user login and JWT token generation."""
        try:
            # Generate new proof for login using stored private key
            proof_response = await self.client.post(
                "/api/auth/utils/generate-proof",
                json={
                    "username": self.test_username,
                    "private_key": self.private_key
                }
            )
            
            if proof_response.status_code != 200:
                return False
            
            proof_data = proof_response.json()["data"]
            
            # Login
            login_response = await self.client.post(
                "/api/auth/login",
                json={
                    "identifier": self.test_username,
                    "zkp_proof": proof_data["zkp_proof"]
                }
            )
            
            if login_response.status_code == 200:
                login_data = login_response.json()["data"]
                self.user_token = login_data["access_token"]
                print(f"   ✓ Login successful, token expires in {login_data['expires_in']}s")
                return True
            
            return False
        except Exception as e:
            print(f"   Login error: {e}")
            return False
    
    async def test_token_verification(self) -> bool:
        """Test JWT token verification."""
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = await self.client.get("/api/auth/verify", headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()["data"]
                print(f"   ✓ Token valid for user: {user_data['username']}")
                return True
            
            return False
        except Exception as e:
            print(f"   Token verification error: {e}")
            return False
    
    async def test_file_upload(self) -> bool:
        """Test file upload functionality."""
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            
            # Create test file
            test_content = "Production test file content - ZKP File Sharing System"
            
            files = {"file": ("test_prod.txt", test_content, "text/plain")}
            data = {
                "display_name": "Production Test File",
                "description": "Test file for production validation",
                "tags": "test,production,zkp"
            }
            
            response = await self.client.post(
                "/api/files/upload",
                headers=headers,
                files=files,
                data=data
            )
            
            if response.status_code == 201:
                file_data = response.json()["data"]
                self.test_file_id = file_data["file_id"]
                print(f"   ✓ File uploaded: {file_data['filename']} ({file_data['file_size']} bytes)")
                return True
            
            return False
        except Exception as e:
            print(f"   File upload error: {e}")
            return False
    
    async def test_file_listing(self) -> bool:
        """Test file listing with pagination."""
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = await self.client.get("/api/files/", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ Listed {len(data['files'])} files, total: {data['total']}")
                return True
            
            return False
        except Exception as e:
            print(f"   File listing error: {e}")
            return False
    
    async def test_file_details(self) -> bool:
        """Test file details retrieval."""
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = await self.client.get(f"/api/files/{self.test_file_id}", headers=headers)
            
            if response.status_code == 200:
                file_data = response.json()
                print(f"   ✓ File details retrieved: {file_data['display_name']}")
                return True
            
            return False
        except Exception as e:
            print(f"   File details error: {e}")
            return False
    
    async def test_file_update(self) -> bool:
        """Test file metadata update."""
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            update_data = {
                "display_name": "Updated Production Test File",
                "description": "Updated description for production test",
                "tags": ["test", "production", "zkp", "updated"]
            }
            
            response = await self.client.put(
                f"/api/files/{self.test_file_id}",
                headers=headers,
                json=update_data
            )
            
            if response.status_code == 200:
                file_data = response.json()
                print(f"   ✓ File updated: {file_data['display_name']}")
                return True
            
            return False
        except Exception as e:
            print(f"   File update error: {e}")
            return False
    
    async def test_download_url(self) -> bool:
        """Test download URL generation."""
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = await self.client.get(
                f"/api/files/{self.test_file_id}/download",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data["success"] and "download_url" in data:
                    print(f"   ✓ Download URL generated, expires in {data['expires_in']}s")
                    return True
            
            return False
        except Exception as e:
            print(f"   Download URL error: {e}")
            return False
    
    async def test_file_download(self) -> bool:
        """Test actual file download via presigned URL."""
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = await self.client.get(
                f"/api/files/{self.test_file_id}/download",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                download_url = data["download_url"]
                
                # Test actual download
                async with httpx.AsyncClient() as download_client:
                    download_response = await download_client.get(download_url)
                    if download_response.status_code == 200:
                        content = download_response.text
                        if "Production test file content" in content:
                            print(f"   ✓ File downloaded successfully ({len(content)} bytes)")
                            return True
            
            return False
        except Exception as e:
            print(f"   File download error: {e}")
            return False
    
    async def test_storage_info(self) -> bool:
        """Test storage usage information."""
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = await self.client.get("/api/files/storage/info", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ Storage: {data['storage_used']} bytes used ({data['storage_percentage']:.1f}%)")
                return True
            
            return False
        except Exception as e:
            print(f"   Storage info error: {e}")
            return False
    
    async def test_file_deletion(self) -> bool:
        """Test file deletion."""
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = await self.client.delete(f"/api/files/{self.test_file_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ File deleted: {data['message']}")
                return True
            
            return False
        except Exception as e:
            print(f"   File deletion error: {e}")
            return False
    
    async def test_error_handling(self) -> bool:
        """Test error handling for invalid requests."""
        try:
            # Test invalid file ID
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = await self.client.get("/api/files/invalid-id", headers=headers)
            
            if response.status_code == 404:
                print("   ✓ 404 error handled correctly for invalid file ID")
                return True
            
            return False
        except Exception as e:
            print(f"   Error handling test error: {e}")
            return False
    
    async def test_performance(self) -> bool:
        """Test basic performance metrics."""
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            
            # Test response times
            start_time = time.time()
            response = await self.client.get("/health")
            health_time = time.time() - start_time
            
            start_time = time.time()
            response = await self.client.get("/api/files/", headers=headers)
            files_time = time.time() - start_time
            
            if health_time < 1.0 and files_time < 2.0:
                print(f"   ✓ Performance: Health {health_time:.3f}s, Files {files_time:.3f}s")
                return True
            else:
                print(f"   ⚠️ Slow response: Health {health_time:.3f}s, Files {files_time:.3f}s")
                return False
            
        except Exception as e:
            print(f"   Performance test error: {e}")
            return False


async def main():
    """Run the production test suite."""
    tester = ProductionTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n🎉 SYSTEM IS PRODUCTION READY! 🎉")
        exit(0)
    else:
        print("\n❌ PRODUCTION READINESS ISSUES FOUND")
        exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 