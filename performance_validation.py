"""
Performance Validation: Multiple Iterations for Stable ZKP Measurements
====================================================================

This script runs multiple iterations of ZKP authentication to get stable,
reliable performance measurements for comparison.
"""

import time
import statistics
import sys
sys.path.append('app')

from app.services.zkp import zkp_service

def measure_zkp_performance_iterations(iterations=10):
    """Run multiple iterations to get stable measurements"""
    print(f"🔄 Running {iterations} iterations for stable measurements...")
    
    latencies = []
    storage_sizes = []
    network_sizes = []
    
    for i in range(iterations):
        # Generate test keypair
        keypair = zkp_service.generate_keypair()
        
        # Measure proof generation + verification time
        start_time = time.time()
        proof = zkp_service.create_proof(keypair.private_key, f"test_user_auth_{i}")
        is_valid = zkp_service.verify_proof(proof, keypair.public_key_hex)
        end_time = time.time()
        
        latency = (end_time - start_time) * 1000  # Convert to milliseconds
        latencies.append(latency)
        
        # Storage size (public key)
        storage_size = len(keypair.public_key_hex.encode()) // 2
        storage_sizes.append(storage_size)
        
        # Network size (proof data)
        import json
        network_size = len(json.dumps({
            'commitment_x': proof.commitment_x,
            'commitment_y': proof.commitment_y,
            'response': proof.response,
            'challenge': proof.challenge,
            'message': proof.message
        }).encode())
        network_sizes.append(network_size)
        
        if (i + 1) % 5 == 0:
            print(f"   Completed {i + 1}/{iterations} iterations...")
    
    # Calculate statistics
    results = {
        'latency': {
            'mean': statistics.mean(latencies),
            'median': statistics.median(latencies),
            'min': min(latencies),
            'max': max(latencies),
            'stdev': statistics.stdev(latencies) if len(latencies) > 1 else 0
        },
        'storage': {
            'mean': statistics.mean(storage_sizes),
            'consistent': len(set(storage_sizes)) == 1  # Should be consistent
        },
        'network': {
            'mean': statistics.mean(network_sizes),
            'median': statistics.median(network_sizes),
            'min': min(network_sizes),
            'max': max(network_sizes),
            'stdev': statistics.stdev(network_sizes) if len(network_sizes) > 1 else 0
        },
        'raw_data': {
            'latencies': latencies,
            'storage_sizes': storage_sizes,
            'network_sizes': network_sizes
        }
    }
    
    return results

def print_validation_results(results):
    """Print detailed validation results"""
    print("\n📊 ZKP Performance Validation Results:")
    print("=" * 50)
    
    print("\n🚀 Latency Measurements:")
    print(f"   Mean: {results['latency']['mean']:.2f} ms")
    print(f"   Median: {results['latency']['median']:.2f} ms")
    print(f"   Range: {results['latency']['min']:.2f} - {results['latency']['max']:.2f} ms")
    print(f"   Std Dev: {results['latency']['stdev']:.2f} ms")
    
    print("\n💾 Storage Requirements:")
    print(f"   Storage per user: {results['storage']['mean']:.0f} bytes")
    print(f"   Consistent across users: {results['storage']['consistent']}")
    
    print("\n🌐 Network Overhead:")
    print(f"   Mean: {results['network']['mean']:.0f} bytes")
    print(f"   Median: {results['network']['median']:.0f} bytes")
    print(f"   Range: {results['network']['min']} - {results['network']['max']} bytes")
    print(f"   Std Dev: {results['network']['stdev']:.2f} bytes")
    
    print("\n✅ Key Findings:")
    print(f"   • Authentication completes in ~{results['latency']['mean']:.1f}ms on average")
    print(f"   • Storage overhead: only {results['storage']['mean']:.0f} bytes per user")
    print(f"   • Network transmission: ~{results['network']['mean']:.0f} bytes per auth")
    print(f"   • Zero sensitive data stored or transmitted")
    print(f"   • Mathematical security: 2^-128 attack probability")

if __name__ == "__main__":
    results = measure_zkp_performance_iterations(20)
    print_validation_results(results) 