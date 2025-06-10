#!/usr/bin/env python3
"""
Performance Benchmarking Demo

This script provides a quick demonstration of the benchmarking capabilities
without running the full test suite.
"""

import time
import sys
import os
import json

# Add performance directory to path
sys.path.append(os.path.dirname(__file__))

def demo_zkp_performance():
    """Demo ZKP performance benchmarking"""
    print("🔐 ZKP Performance Demo")
    print("-" * 40)
    
    try:
        from zkp_performance_benchmark import ZKPPerformanceBenchmark
        
        # Quick benchmark with few iterations
        benchmark = ZKPPerformanceBenchmark(iterations=10)
        
        # Demo proof generation
        print("Testing proof generation...")
        start = time.perf_counter()
        gen_result = benchmark.benchmark_proof_generation()
        end = time.perf_counter()
        
        print(f"✅ Proof generation: {gen_result.mean_time_ms:.3f}ms avg")
        print(f"   Throughput: {gen_result.throughput_ops_per_sec:,.0f} ops/sec")
        
        # Demo proof verification  
        print("Testing proof verification...")
        ver_result = benchmark.benchmark_proof_verification()
        
        print(f"✅ Proof verification: {ver_result.mean_time_ms:.3f}ms avg")
        print(f"   Throughput: {ver_result.throughput_ops_per_sec:,.0f} ops/sec")
        
        return True
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        return False

def demo_auth_comparison():
    """Demo authentication method comparison"""
    print("\n🔑 Authentication Comparison Demo")
    print("-" * 40)
    
    try:
        from auth_comparison_benchmark import AuthenticationBenchmark
        
        # Quick comparison with few iterations
        benchmark = AuthenticationBenchmark(iterations=10)
        
        # Demo ZKP vs Password
        print("Comparing ZKP vs Password authentication...")
        
        zkp_result = benchmark.benchmark_zkp_verification()
        password_result = benchmark.benchmark_password_verification()
        
        speedup = zkp_result.throughput_ops_per_sec / password_result.throughput_ops_per_sec
        
        print(f"✅ ZKP: {zkp_result.mean_time_ms:.3f}ms - {zkp_result.throughput_ops_per_sec:,.0f} ops/sec")
        print(f"✅ Password: {password_result.mean_time_ms:.1f}ms - {password_result.throughput_ops_per_sec:,.0f} ops/sec")
        print(f"🚀 ZKP is {speedup:.1f}x faster than password authentication!")
        
        return True
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        return False

def demo_file_operations():
    """Demo file operations benchmarking"""
    print("\n📁 File Operations Demo")
    print("-" * 40)
    
    try:
        from file_operations_benchmark import FileOperationsBenchmark
        
        # Quick file operations test
        benchmark = FileOperationsBenchmark(iterations=5)
        
        print("Testing small file upload processing...")
        upload_result = benchmark.benchmark_file_upload_processing("small")
        
        print(f"✅ Small file upload: {upload_result.mean_time_ms:.1f}ms avg")
        print(f"   Throughput: {upload_result.throughput_mbps:.1f} MB/s")
        
        print("Testing URL generation...")
        url_result = benchmark.benchmark_presigned_url_generation("small")
        
        print(f"✅ URL generation: {url_result.mean_time_ms:.3f}ms avg")
        print(f"   Throughput: {url_result.operations_per_sec:,.0f} ops/sec")
        
        # Cleanup
        benchmark.cleanup()
        
        return True
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        return False

def demo_scalability():
    """Demo system scalability testing"""
    print("\n⚡ System Scalability Demo")
    print("-" * 40)
    
    try:
        from system_scalability_benchmark import SystemScalabilityBenchmark
        
        # Quick scalability test
        benchmark = SystemScalabilityBenchmark()
        
        print("Testing concurrent authentication (10 users, 5 requests each)...")
        result = benchmark.benchmark_concurrent_authentication(10, 5)
        
        print(f"✅ Concurrent users: {result.concurrent_users}")
        print(f"   Total requests: {result.total_requests}")
        print(f"   Requests/sec: {result.requests_per_second:,.0f}")
        print(f"   Success rate: {result.success_rate_percent:.1f}%")
        print(f"   Avg response: {result.avg_response_time_ms:.1f}ms")
        
        return True
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        return False

def main():
    """Run the complete demo"""
    print("=" * 60)
    print("ZKP FILE SHARING PERFORMANCE BENCHMARKING DEMO")
    print("=" * 60)
    print("This demo shows the benchmarking capabilities with quick tests.")
    print("For full benchmarking, run: python run_all_benchmarks.py")
    print()
    
    # Check if dependencies are available
    try:
        import psutil
        import bcrypt
        import cryptography
        print("✅ All dependencies available")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Install with: pip install -r requirements.txt")
        return
    
    start_time = time.time()
    
    # Run demo tests
    demos = [
        demo_zkp_performance,
        demo_auth_comparison, 
        demo_file_operations,
        demo_scalability
    ]
    
    successful = 0
    for demo in demos:
        try:
            if demo():
                successful += 1
        except KeyboardInterrupt:
            print("\n⚠️ Demo interrupted by user")
            break
        except Exception as e:
            print(f"❌ Demo failed: {e}")
    
    end_time = time.time()
    
    print(f"\n🎯 Demo Results")
    print("-" * 40)
    print(f"Successful demos: {successful}/{len(demos)}")
    print(f"Total time: {end_time - start_time:.1f} seconds")
    
    if successful == len(demos):
        print("✅ All demos completed successfully!")
        print("\n🚀 Ready to run full benchmarks:")
        print("   python run_all_benchmarks.py --quick")
    else:
        print("⚠️ Some demos failed. Check dependencies and try again.")

if __name__ == "__main__":
    main() 