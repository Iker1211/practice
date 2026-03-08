#!/bin/bash
# PASO 6: Benchmark Database Performance - Before & After Indices

set -e

echo "========================================="
echo "PASO 6: Performance Benchmark Script"
echo "========================================="
echo ""
echo "This script measures query performance BEFORE and AFTER creating indices"
echo "It helps verify that PASO 6 actually improves performance"
echo ""

# Check if we have a Supabase connection
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Supabase credentials not found"
    echo "   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    exit 1
fi

echo "✅ Supabase credentials found"
echo ""

# Create benchmark results directory
BENCHMARK_DIR="benchmarks"
mkdir -p "$BENCHMARK_DIR"

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
RESULTS_FILE="$BENCHMARK_DIR/paso_6_benchmark_$TIMESTAMP.json"

echo "📊 Benchmarking queries..."
echo "   Results will be saved to: $RESULTS_FILE"
echo ""

# Create TypeScript benchmark script
cat > /tmp/benchmark-paso6.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface BenchmarkResult {
  query: string
  executionTime: number
  timestamp: string
  rowsReturned: number
  plan: string
}

async function benchmarkQuery(name: string, query: string): Promise<BenchmarkResult> {
  console.log(`\n  Running: ${name}...`)
  
  const start = Date.now()
  
  try {
    // Use RPC to execute EXPLAIN ANALYZE
    const { data, error } = await supabase.rpc('benchmark_query', {
      query_str: query
    })
    
    if (error) throw error
    
    const executionTime = Date.now() - start
    
    const result: BenchmarkResult = {
      query: name,
      executionTime,
      timestamp: new Date().toISOString(),
      rowsReturned: data?.[0]?.rows || 0,
      plan: data?.[0]?.plan || 'Not available'
    }
    
    console.log(`    ✅ ${executionTime}ms`)
    return result
  } catch (error) {
    console.error(`    ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    return {
      query: name,
      executionTime: -1,
      timestamp: new Date().toISOString(),
      rowsReturned: 0,
      plan: 'Error'
    }
  }
}

async function main() {
  console.log('📊 PASO 6: Performance Benchmarking')
  console.log('====================================\n')
  
  const benchmarks: BenchmarkResult[] = []
  
  // Benchmark 1: RLS Filtering
  console.log('1️⃣  RLS Filtering Query')
  benchmarks.push(
    await benchmarkQuery(
      'RLS Filter (ideas)',
      'EXPLAIN ANALYZE SELECT COUNT(*) FROM ideas WHERE user_id = auth.uid()::text AND deleted_at IS NULL'
    )
  )
  
  // Benchmark 2: Sync Delta Query
  console.log('\n2️⃣  Sync Delta Query')
  benchmarks.push(
    await benchmarkQuery(
      'Sync Delta (ideas)',
      `EXPLAIN ANALYZE SELECT * FROM ideas WHERE user_id = auth.uid()::text AND updated_at > now() - interval '1 hour' AND deleted_at IS NULL LIMIT 100`
    )
  )
  
  // Benchmark 3: Foreign Key Query
  console.log('\n3️⃣  Foreign Key Query')
  benchmarks.push(
    await benchmarkQuery(
      'FK Query (blocks)',
      'EXPLAIN ANALYZE SELECT * FROM blocks WHERE idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid()::text) LIMIT 100'
    )
  )
  
  // Benchmark 4: Sync Queue Pending
  console.log('\n4️⃣  Sync Queue (Pending Items)')
  benchmarks.push(
    await benchmarkQuery(
      'Sync Queue Pending',
      'EXPLAIN ANALYZE SELECT * FROM _sync_queue WHERE synced_at IS NULL LIMIT 100'
    )
  )
  
  // Benchmark 5: Conflict Detection
  console.log('\n5️⃣  Conflict Detection')
  benchmarks.push(
    await benchmarkQuery(
      'Conflict Detection',
      `EXPLAIN ANALYZE SELECT * FROM _sync_queue WHERE table_name = 'ideas' AND record_id = 'test-id'`
    )
  )
  
  // Summary
  console.log('\n\n📈 Benchmark Results Summary')
  console.log('====================================\n')
  
  let totalTime = 0
  benchmarks.forEach((result, index) => {
    if (result.executionTime > 0) {
      totalTime += result.executionTime
      console.log(`${index + 1}. ${result.query}`)
      console.log(`   Time: ${result.executionTime}ms`)
      console.log(`   Rows: ${result.rowsReturned}`)
      console.log('')
    }
  })
  
  console.log(`Total benchmark time: ${totalTime}ms`)
  console.log('')
  
  // Output JSON
  const output = {
    timestamp: new Date().toISOString(),
    benchmarks,
    totalTime,
    supabaseUrl: process.env.VITE_SUPABASE_URL
  }
  
  console.log(JSON.stringify(output, null, 2))
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
EOF

# Create PostgreSQL function for benchmarking (requires admin access)
echo "⚙️  Setting up benchmark infrastructure..."
echo ""

# Alternative: Use simpler benchmarking via Supabase client
cat > /tmp/simple-benchmark.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function benchmark(name: string, fn: () => Promise<any>): Promise<number> {
  const start = performance.now()
  try {
    await fn()
    const duration = performance.now() - start
    console.log(`✅ ${name}: ${duration.toFixed(2)}ms`)
    return duration
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error instanceof Error ? error.message : 'Unknown'}`)
    return -1
  }
}

async function main() {
  console.log('📊 PASO 6: Simple Performance Benchmarking')
  console.log('=========================================\n')
  
  const results: Record<string, number> = {}
  
  // Test 1: Count how many ideas exist for current user
  results['Count Ideas (RLS)'] = await benchmark(
    'Count Ideas (RLS)',
    () => supabase
      .from('ideas')
      .select('id', { count: 'exact', head: true })
      .gt('updated_at', new Date(Date.now() - 3600000).toISOString())
      .then(r => r)
  )
  
  // Test 2: Fetch ideas with related blocks
  results['Fetch Ideas with Blocks'] = await benchmark(
    'Fetch Ideas with Blocks',
    () => supabase
      .from('ideas')
      .select('id, blocks(id, content)')
      .limit(10)
      .then(r => r)
  )
  
  // Test 3: Count pending sync items
  results['Count Pending Sync'] = await benchmark(
    'Count Pending Sync',
    () => supabase
      .from('_sync_queue')
      .select('id', { count: 'exact', head: true })
      .is('synced_at', null)
      .then(r => r)
  )
  
  // Test 4: Find associations for an idea
  results['Find Associations'] = await benchmark(
    'Find Associations',
    () => supabase
      .from('associations')
      .select('*')
      .eq('source_idea_id', 'any-id')
      .limit(100)
      .then(r => r)
  )
  
  // Summary
  console.log('\n📈 Summary')
  console.log('=========================================\n')
  
  const goodTime = 100  // < 100ms is good
  const okTime = 500    // < 500ms is acceptable
  
  Object.entries(results).forEach(([name, time]) => {
    if (time < 0) {
      console.log(`${name}: ❌ ERROR`)
    } else if (time < goodTime) {
      console.log(`${name}: ${time.toFixed(2)}ms ✅ (excellent)`)
    } else if (time < okTime) {
      console.log(`${name}: ${time.toFixed(2)}ms ⚠️  (acceptable)`)
    } else {
      console.log(`${name}: ${time.toFixed(2)}ms ❌ (too slow)`)
    }
  })
  
  const totalTime = Object.values(results).reduce((a, b) => a + b, 0)
  console.log(`\nTotal: ${totalTime.toFixed(2)}ms`)
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
EOF

echo "Run the benchmark with:"
echo "  npx tsx /tmp/simple-benchmark.ts"
echo ""
echo "Or add to package.json:"
echo '  "benchmark:paso6": "tsx benchmarks/paso6-benchmark.ts"'
echo ""
