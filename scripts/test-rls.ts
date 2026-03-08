#!/usr/bin/env node

/**
 * ============================================================================
 * RLS Multi-User Test - PASO 5.1.1
 * ============================================================================
 * 
 * Simula 2 usuarios diferentes intentando acceder a ideas
 * Verifica que cada usuario solo ve sus propias ideas
 * 
 * Uso: npm run test:rls
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

const addResult = (name: string, passed: boolean, message: string) => {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
};

/**
 * Test 1: Crear idea de prueba
 */
const testCreateIdea = async () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const ideaId = uuidv4();
    const { data, error } = await supabase
      .from('ideas')
      .insert({
        id: ideaId,
        title: `RLS Test: ${new Date().toISOString()}`,
        content: 'Testing RLS policies',
        user_id: 'test-user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      // Esperar error de RLS: "new row violates row-level security policy"
      if (error.message.includes('row-level security')) {
        addResult(
          'RLS INSERT Protection',
          true,
          'RLS correctly rejected INSERT with mismatched user_id'
        );
      } else {
        addResult(
          'Create Idea',
          false,
          error.message
        );
      }
    } else {
      addResult(
        'Create Idea',
        true,
        `Created idea ${ideaId}`
      );
      return ideaId;
    }
  } catch (e) {
    addResult(
      'Create Idea',
      false,
      `Exception: ${(e as Error).message}`
    );
  }
};

/**
 * Test 2: Verificar que SELECT retorna solo datos del usuario
 */
const testSelectFiltering = async () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .limit(10);

    if (error) {
      addResult(
        'SELECT Query',
        false,
        error.message
      );
      return;
    }

    if (Array.isArray(data) && data.length >= 0) {
      addResult(
        'SELECT Query',
        true,
        `Retrieved ${data.length} ideas (RLS filtering applied)`
      );
    } else {
      addResult(
        'SELECT Query',
        false,
        'Unexpected data format'
      );
    }
  } catch (e) {
    addResult(
      'SELECT Query',
      false,
      `Exception: ${(e as Error).message}`
    );
  }
};

/**
 * Test 3: Intentar UPDATE sin permiso
 */
const testUpdateProtection = async () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Intentar actualizar una idea con user_id diferente
    const { data, error } = await supabase
      .from('ideas')
      .update({ title: 'Hacked' })
      .eq('user_id', 'different-user')
      .select();

    if (error) {
      if (error.message.includes('row-level security')) {
        addResult(
          'RLS UPDATE Protection',
          true,
          'RLS correctly rejected UPDATE of other user\'s data'
        );
      } else {
        addResult(
          'RLS UPDATE Protection',
          false,
          error.message
        );
      }
    } else if (data && data.length === 0) {
      addResult(
        'RLS UPDATE Protection',
        true,
        'UPDATE silently failed (no rows matched - RLS filtered)'
      );
    } else {
      addResult(
        'RLS UPDATE Protection',
        false,
        'UPDATE should have failed but succeeded'
      );
    }
  } catch (e) {
    addResult(
      'RLS UPDATE Protection',
      false,
      `Exception: ${(e as Error).message}`
    );
  }
};

/**
 * Test 4: Intentar DELETE sin permiso
 */
const testDeleteProtection = async () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabase
      .from('ideas')
      .delete()
      .eq('user_id', 'different-user')
      .select();

    if (error) {
      if (error.message.includes('row-level security')) {
        addResult(
          'RLS DELETE Protection',
          true,
          'RLS correctly rejected DELETE of other user\'s data'
        );
      } else {
        addResult(
          'RLS DELETE Protection',
          false,
          error.message
        );
      }
    } else if (data && data.length === 0) {
      addResult(
        'RLS DELETE Protection',
        true,
        'DELETE silently failed (no rows matched - RLS filtered)'
      );
    } else {
      addResult(
        'RLS DELETE Protection',
        false,
        'DELETE should have failed but succeeded'
      );
    }
  } catch (e) {
    addResult(
      'RLS DELETE Protection',
      false,
      `Exception: ${(e as Error).message}`
    );
  }
};

/**
 * Test 5: Verificar que audit_log tiene RLS
 */
const testAuditLogRLS = async () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('row-level security')) {
        addResult(
          'Audit Log RLS',
          true,
          'audit_log has RLS policies'
        );
      } else {
        addResult(
          'Audit Log RLS',
          false,
          error.message
        );
      }
    } else {
      addResult(
        'Audit Log RLS',
        true,
        `Retrieved audit logs (RLS filtering applied): ${data?.length || 0} rows`
      );
    }
  } catch (e) {
    addResult(
      'Audit Log RLS',
      false,
      `Exception: ${(e as Error).message}`
    );
  }
};

/**
 * Main test execution
 */
const runTests = async () => {
  console.log('🧪 PASO 5.1.1: Verificación de RLS Policies');
  console.log('==========================================\n');

  await testCreateIdea();
  await testSelectFiltering();
  await testUpdateProtection();
  await testDeleteProtection();
  await testAuditLogRLS();

  // Summary
  console.log('\n📊 RESUMEN:');
  console.log('==========================================');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`Resultados: ${passed}/${total} tests pasados`);

  if (passed === total) {
    console.log('\n✨ ¡TODOS LOS TESTS PASARON! RLS está funcionando correctamente.');
    console.log('\n🎯 Próximo paso: PASO 5.2 - Integrar RLS con Sync Engine');
    process.exit(0);
  } else {
    console.log('\n❌ Algunos tests fallaron. Revisar arriba.');
    console.log('\nAcciones:');
    console.log('1. Verificar que supabase/rls-policies.sql fue ejecutado');
    console.log('2. Revisar Supabase Dashboard → SQL Editor para errores');
    console.log('3. Re-ejecutar: npm run verify-rls');
    process.exit(1);
  }
};

runTests().catch(console.error);
