#!/usr/bin/env python3
"""
Master Benchmark Runner

This script runs all performance benchmarks and generates a comprehensive
performance analysis report for the ZKP File Sharing application.

Benchmarks included:
- ZKP performance benchmarks
- Authentication method comparisons
- File operations performance
- System scalability tests
"""

import os
import sys
import json
import time
import subprocess
import argparse
from datetime import datetime
from typing import Dict, List, Any

class BenchmarkRunner:
    """Master benchmark runner and report generator"""
    
    def __init__(self, output_dir: str = "results", quick_mode: bool = False):
        self.output_dir = output_dir
        self.quick_mode = quick_mode
        self.results = {}
        self.benchmark_scripts = [
            {
                "name": "ZKP Performance",
                "script": "zkp_performance_benchmark.py",
                "output": "zkp_benchmark_results.json",
                "description": "Benchmarks ZKP proof generation and verification performance"
            },
            {
                "name": "Authentication Comparison",
                "script": "auth_comparison_benchmark.py", 
                "output": "auth_comparison_results.json",
                "description": "Compares different authentication method performance"
            },
            {
                "name": "File Operations",
                "script": "file_operations_benchmark.py",
                "output": "file_operations_results.json",
                "description": "Benchmarks file upload, download, and metadata operations"
            },
            {
                "name": "System Scalability",
                "script": "system_scalability_benchmark.py",
                "output": "scalability_results.json",
                "description": "Tests system performance under concurrent load"
            }
        ]
        
        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)
    
    def check_dependencies(self) -> bool:
        """Check if all required dependencies are available"""
        required_packages = [
            "psutil", "bcrypt", "cryptography", "PyJWT", "requests"
        ]
        
        missing_packages = []
        for package in required_packages:
            try:
                __import__(package)
            except ImportError:
                missing_packages.append(package)
        
        if missing_packages:
            print(f"❌ Missing required packages: {', '.join(missing_packages)}")
            print(f"Please install: pip install {' '.join(missing_packages)}")
            return False
        
        return True
    
    def run_benchmark(self, benchmark: Dict[str, str]) -> bool:
        """Run a single benchmark script"""
        script_path = os.path.join(os.path.dirname(__file__), benchmark["script"])
        output_path = os.path.join(self.output_dir, benchmark["output"])
        
        if not os.path.exists(script_path):
            print(f"❌ Benchmark script not found: {script_path}")
            return False
        
        print(f"\n🚀 Running {benchmark['name']} benchmark...")
        print(f"   Description: {benchmark['description']}")
        
        # Prepare command
        cmd = [sys.executable, script_path, "--output", output_path]
        if self.quick_mode:
            cmd.append("--quick")
        
        try:
            # Run benchmark
            start_time = time.time()
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)  # 30 min timeout
            end_time = time.time()
            
            if result.returncode == 0:
                print(f"✅ {benchmark['name']} completed successfully in {end_time - start_time:.1f}s")
                
                # Load results if available
                if os.path.exists(output_path):
                    with open(output_path, 'r') as f:
                        self.results[benchmark['name']] = json.load(f)
                
                return True
            else:
                print(f"❌ {benchmark['name']} failed with return code {result.returncode}")
                print(f"Error output: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"⏰ {benchmark['name']} timed out after 30 minutes")
            return False
        except Exception as e:
            print(f"❌ {benchmark['name']} failed with exception: {e}")
            return False
    
    def generate_summary_report(self) -> Dict[str, Any]:
        """Generate a comprehensive summary report"""
        report = {
            "summary": {
                "timestamp": datetime.now().isoformat(),
                "mode": "quick" if self.quick_mode else "full",
                "benchmarks_run": len(self.results),
                "total_benchmarks": len(self.benchmark_scripts)
            },
            "performance_highlights": {},
            "validation_results": {},
            "recommendations": []
        }
        
        # Extract key performance metrics
        if "ZKP Performance" in self.results:
            zkp_results = self.results["ZKP Performance"]["results"]
            
            proof_gen = next((r for r in zkp_results if r["operation"] == "Proof Generation"), None)
            proof_ver = next((r for r in zkp_results if r["operation"] == "Proof Verification"), None)
            concurrent = next((r for r in zkp_results if r["operation"] == "Concurrent Authentication"), None)
            
            report["performance_highlights"]["zkp"] = {
                "proof_generation_ms": proof_gen["mean_time_ms"] if proof_gen else None,
                "proof_verification_ms": proof_ver["mean_time_ms"] if proof_ver else None,
                "concurrent_throughput": concurrent["throughput_ops_per_sec"] if concurrent else None
            }
        
        # Authentication comparison results
        if "Authentication Comparison" in self.results:
            auth_results = self.results["Authentication Comparison"]["results"]
            
            zkp_auth = next((r for r in auth_results if "ZKP" in r["method"]), None)
            password_auth = next((r for r in auth_results if "Password" in r["method"]), None)
            
            if zkp_auth and password_auth:
                speedup = zkp_auth["throughput_ops_per_sec"] / password_auth["throughput_ops_per_sec"]
                report["performance_highlights"]["auth_comparison"] = {
                    "zkp_vs_password_speedup": speedup,
                    "zkp_throughput": zkp_auth["throughput_ops_per_sec"],
                    "password_throughput": password_auth["throughput_ops_per_sec"]
                }
        
        # File operations results
        if "File Operations" in self.results:
            file_results = self.results["File Operations"]["results"]
            
            small_upload = next((r for r in file_results 
                               if r["operation"] == "Upload Processing" and r["file_size_category"] == "small"), None)
            url_gen = next((r for r in file_results 
                          if r["operation"] == "Presigned URL Generation"), None)
            
            report["performance_highlights"]["file_operations"] = {
                "small_file_upload_ms": small_upload["mean_time_ms"] if small_upload else None,
                "url_generation_ms": url_gen["mean_time_ms"] if url_gen else None
            }
        
        # Scalability results
        if "System Scalability" in self.results:
            scalability_results = self.results["System Scalability"]["results"]
            
            if scalability_results:
                max_users = max(r["concurrent_users"] for r in scalability_results)
                max_rps = max(r["requests_per_second"] for r in scalability_results)
                avg_success_rate = sum(r["success_rate_percent"] for r in scalability_results) / len(scalability_results)
                
                report["performance_highlights"]["scalability"] = {
                    "max_concurrent_users": max_users,
                    "peak_requests_per_second": max_rps,
                    "average_success_rate": avg_success_rate
                }
        
        # Validation against claims
        validation = {}
        
        # ZKP performance validation
        if "zkp" in report["performance_highlights"]:
            zkp_perf = report["performance_highlights"]["zkp"]
            validation["zkp_performance"] = {
                "proof_generation_target_2ms": zkp_perf["proof_generation_ms"] <= 2.0 if zkp_perf["proof_generation_ms"] else None,
                "proof_verification_target_1ms": zkp_perf["proof_verification_ms"] <= 1.0 if zkp_perf["proof_verification_ms"] else None,
                "throughput_target_10k": zkp_perf["concurrent_throughput"] >= 10000 if zkp_perf["concurrent_throughput"] else None
            }
        
        # Authentication comparison validation
        if "auth_comparison" in report["performance_highlights"]:
            auth_perf = report["performance_highlights"]["auth_comparison"]
            validation["auth_comparison"] = {
                "zkp_10x_faster_than_password": auth_perf["zkp_vs_password_speedup"] >= 10.0 if auth_perf["zkp_vs_password_speedup"] else None
            }
        
        # Scalability validation
        if "scalability" in report["performance_highlights"]:
            scale_perf = report["performance_highlights"]["scalability"]
            validation["scalability"] = {
                "supports_1000_users": scale_perf["max_concurrent_users"] >= 1000 if scale_perf["max_concurrent_users"] else None,
                "high_success_rate": scale_perf["average_success_rate"] >= 95.0 if scale_perf["average_success_rate"] else None
            }
        
        report["validation_results"] = validation
        
        # Generate recommendations
        recommendations = []
        
        if validation.get("zkp_performance", {}).get("proof_generation_target_2ms") == False:
            recommendations.append("Consider optimizing ZKP proof generation for sub-2ms performance")
        
        if validation.get("auth_comparison", {}).get("zkp_10x_faster_than_password") == False:
            recommendations.append("ZKP authentication speedup vs passwords is below 10x target")
        
        if validation.get("scalability", {}).get("supports_1000_users") == False:
            recommendations.append("Test with higher concurrent user loads to validate 1000+ user capacity")
        
        if not recommendations:
            recommendations.append("All performance targets met - system is ready for production deployment")
        
        report["recommendations"] = recommendations
        
        return report
    
    def print_summary_report(self, report: Dict[str, Any]):
        """Print formatted summary report"""
        print("\n" + "=" * 80)
        print("COMPREHENSIVE PERFORMANCE BENCHMARK SUMMARY")
        print("=" * 80)
        
        # Summary info
        summary = report["summary"]
        print(f"Benchmark Date: {summary['timestamp']}")
        print(f"Mode: {summary['mode'].upper()}")
        print(f"Benchmarks Completed: {summary['benchmarks_run']}/{summary['total_benchmarks']}")
        
        # Performance highlights
        print(f"\n{'PERFORMANCE HIGHLIGHTS':<50}")
        print("-" * 80)
        
        highlights = report["performance_highlights"]
        
        if "zkp" in highlights:
            zkp = highlights["zkp"]
            print(f"ZKP Proof Generation:          {zkp['proof_generation_ms']:.3f} ms")
            print(f"ZKP Proof Verification:       {zkp['proof_verification_ms']:.3f} ms")
            print(f"ZKP Concurrent Throughput:    {zkp['concurrent_throughput']:,.0f} ops/sec")
        
        if "auth_comparison" in highlights:
            auth = highlights["auth_comparison"]
            print(f"ZKP vs Password Speedup:      {auth['zkp_vs_password_speedup']:.1f}x faster")
            print(f"ZKP Authentication Throughput: {auth['zkp_throughput']:,.0f} ops/sec")
        
        if "file_operations" in highlights:
            file_ops = highlights["file_operations"]
            print(f"Small File Upload Time:       {file_ops['small_file_upload_ms']:.1f} ms")
            print(f"URL Generation Time:          {file_ops['url_generation_ms']:.3f} ms")
        
        if "scalability" in highlights:
            scale = highlights["scalability"]
            print(f"Max Concurrent Users Tested:  {scale['max_concurrent_users']:,}")
            print(f"Peak Requests/Second:         {scale['peak_requests_per_second']:,.0f}")
            print(f"Average Success Rate:         {scale['average_success_rate']:.1f}%")
        
        # Validation results
        print(f"\n{'VALIDATION AGAINST CLAIMS':<50}")
        print("-" * 80)
        
        validation = report["validation_results"]
        
        for category, tests in validation.items():
            print(f"\n{category.replace('_', ' ').title()}:")
            for test_name, result in tests.items():
                if result is not None:
                    status = "✅ PASS" if result else "❌ FAIL"
                    test_display = test_name.replace('_', ' ').title()
                    print(f"  {test_display:<35} {status}")
        
        # Recommendations
        print(f"\n{'RECOMMENDATIONS':<50}")
        print("-" * 80)
        
        for i, recommendation in enumerate(report["recommendations"], 1):
            print(f"{i}. {recommendation}")
        
        print("\n" + "=" * 80)
    
    def save_summary_report(self, report: Dict[str, Any], filename: str = "benchmark_summary.json"):
        """Save summary report to file"""
        filepath = os.path.join(self.output_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📊 Summary report saved to: {filepath}")
    
    def run_all_benchmarks(self) -> bool:
        """Run all benchmark suites"""
        print("=" * 80)
        print("ZKP FILE SHARING PERFORMANCE BENCHMARK SUITE")
        print("=" * 80)
        print(f"Mode: {'Quick' if self.quick_mode else 'Comprehensive'}")
        print(f"Output Directory: {self.output_dir}")
        print(f"Total Benchmarks: {len(self.benchmark_scripts)}")
        
        # Check dependencies
        if not self.check_dependencies():
            return False
        
        successful_runs = 0
        
        # Run each benchmark
        for benchmark in self.benchmark_scripts:
            if self.run_benchmark(benchmark):
                successful_runs += 1
        
        print(f"\n📈 Benchmark execution completed!")
        print(f"✅ Successful: {successful_runs}/{len(self.benchmark_scripts)}")
        
        if successful_runs > 0:
            # Generate and save summary report
            report = self.generate_summary_report()
            self.print_summary_report(report)
            self.save_summary_report(report)
        
        return successful_runs == len(self.benchmark_scripts)

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description="ZKP File Sharing Performance Benchmark Suite")
    parser.add_argument("--output-dir", "-o", type=str, default="results",
                       help="Output directory for results (default: results)")
    parser.add_argument("--quick", "-q", action="store_true",
                       help="Run quick benchmarks with reduced iterations")
    parser.add_argument("--benchmark", "-b", type=str, choices=["zkp", "auth", "file", "scalability"],
                       help="Run only a specific benchmark")
    
    args = parser.parse_args()
    
    # Create benchmark runner
    runner = BenchmarkRunner(output_dir=args.output_dir, quick_mode=args.quick)
    
    # Run specific benchmark if requested
    if args.benchmark:
        benchmark_map = {
            "zkp": 0,
            "auth": 1, 
            "file": 2,
            "scalability": 3
        }
        
        benchmark_index = benchmark_map[args.benchmark]
        benchmark = runner.benchmark_scripts[benchmark_index]
        
        print(f"Running single benchmark: {benchmark['name']}")
        success = runner.run_benchmark(benchmark)
        
        if success:
            print(f"✅ {benchmark['name']} completed successfully")
        else:
            print(f"❌ {benchmark['name']} failed")
            sys.exit(1)
    else:
        # Run all benchmarks
        success = runner.run_all_benchmarks()
        
        if not success:
            print("⚠️ Some benchmarks failed. Check the output above for details.")
            sys.exit(1)
    
    print(f"\n🎉 All benchmarks completed successfully!")
    print(f"📁 Results saved in: {args.output_dir}/")

if __name__ == "__main__":
    main() 