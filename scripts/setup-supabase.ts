#!/usr/bin/env node

/**
 * ============================================================================
 * Configurar Credenciales de Supabase
 * ============================================================================
 * 
 * Este script guía al usuario a obtener y configurar sus credenciales
 * de Supabase en el archivo .env
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

const envPath = path.join(process.cwd(), '.env');

const main = async () => {
  console.log('\n═════════════════════════════════════════════════════════════');
  console.log('        Configurar Supabase - PASO 5.1 Prerequisito');
  console.log('═════════════════════════════════════════════════════════════\n');

  console.log('📋 PASO 1: Obtener Credenciales de Supabase');
  console.log('─────────────────────────────────────────────\n');

  console.log('1. Abre: https://app.supabase.com');
  console.log('2. Selecciona tu proyecto');
  console.log('3. Panel izquierdo → Settings → API');
  console.log('4. Copia estos valores:\n');

  console.log('   📌 Project URL (busca "Project URL")');
  console.log('      Ejemplo: https://xyzabc.supabase.co\n');

  console.log('   📌 Anon Public Key (busca "anon" • "public")');
  console.log('      Ejemplo: eyJhbGciOiJIUzI1NiIs...\n');

  // Get from user
  console.log('📝 PASO 2: Ingresa tus Credenciales');
  console.log('────────────────────────────────────\n');

  const supabaseUrl = await question('👤 VITE_SUPABASE_URL: ');
  const supabaseAnonKey = await question('🔑 VITE_SUPABASE_ANON_KEY: ');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '\n❌ ERROR: Las credenciales no pueden estar vacías\n'
    );
    rl.close();
    process.exit(1);
  }

  if (!supabaseUrl.includes('supabase.co')) {
    console.error(
      '\n❌ ERROR: VITE_SUPABASE_URL no parece válida (debe contener "supabase.co")\n'
    );
    rl.close();
    process.exit(1);
  }

  // Read current .env
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Update or create .env
  const lines = envContent.split('\n');
  const newLines: string[] = [];
  let urlSet = false;
  let keySet = false;

  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      newLines.push(`VITE_SUPABASE_URL=${supabaseUrl}`);
      urlSet = true;
    } else if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      newLines.push(`VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`);
      keySet = true;
    } else {
      newLines.push(line);
    }
  }

  if (!urlSet) {
    newLines.push(`VITE_SUPABASE_URL=${supabaseUrl}`);
  }
  if (!keySet) {
    newLines.push(`VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`);
  }

  // Write back
  fs.writeFileSync(envPath, newLines.join('\n'));

  console.log('\n✅ SUPABASE CONFIGURADO');
  console.log('════════════════════════\n');

  console.log('✨ Credenciales guardadas en: .env\n');

  console.log('🎯 Próximo paso:\n');
  console.log('   npm run paso:5-1\n');

  rl.close();
};

main().catch(console.error);
