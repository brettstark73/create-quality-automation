#!/bin/bash

#
# Startup Performance Benchmark
#
# Measures CLI startup time for various commands to establish performance baseline
# and validate lazy loading optimizations.
#

set -e

echo "============================================================"
echo "QA Architect CLI Startup Performance Benchmark"
echo "============================================================"
echo ""

RUNS=10
NODE_CMD="node setup.js"

# Function to measure command execution time
benchmark_command() {
  local cmd=$1
  local description=$2
  local total=0

  echo "📊 Benchmarking: $description"
  echo "   Command: $cmd"
  echo "   Runs: $RUNS"

  for i in $(seq 1 $RUNS); do
    # Use time command to measure execution
    start=$(node -e "console.log(Date.now())")
    eval "$cmd" > /dev/null 2>&1
    end=$(node -e "console.log(Date.now())")
    elapsed=$((end - start))
    total=$((total + elapsed))

    # Show progress dots
    printf "."
  done

  avg=$((total / RUNS))
  echo ""
  echo "   Average: ${avg}ms"
  echo ""
}

# Benchmark different commands
echo "Starting benchmarks...\n"

benchmark_command "$NODE_CMD --help" "--help (should be fastest)"
benchmark_command "$NODE_CMD --version" "--version"
benchmark_command "QAA_DEVELOPER=true $NODE_CMD --license-status 2>/dev/null || true" "--license-status"
benchmark_command "$NODE_CMD --check-maturity 2>/dev/null || true" "--check-maturity"

echo "============================================================"
echo "Benchmark Complete"
echo "============================================================"
echo ""
echo "Performance Targets:"
echo "  --help:           < 100ms  (current implementation)"
echo "  --help (lazy):    < 50ms   (with lazy loading)"
echo "  --version:        < 100ms"
echo "  --license-status: < 150ms"
echo "  --check-maturity: < 200ms"
echo ""
echo "To run with hyperfine (more accurate):"
echo "  brew install hyperfine"
echo "  hyperfine --warmup 3 'node setup.js --help'"
echo ""
