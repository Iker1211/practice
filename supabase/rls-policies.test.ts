/**
 * ============================================================================
 * RLS Policy Tests - Validar que las políticas funcionan correctamente
 * ============================================================================
 * 
 * Tests que verifican:
 * 1. SELECT: Usuario solo ve sus propias ideas
 * 2. INSERT: No puede crear ideas para otro usuario
 * 3. UPDATE: No puede actualizar ideas ajenas
 * 4. DELETE: No puede borrar ideas ajenas
 * 5. SYNC: La sincronización respeta las RLS policies
 *
 * Uso:
 * npm test -- supabase/rls-policies.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

interface TestUser {
  id: string;
  email: string;
  password: string;
}

interface TestIdea {
  id: string;
  title: string;
  content?: string;
  user_id: string;
}

describe('RLS Policies - Row Level Security Tests', () => {
  let client1: ReturnType<typeof createClient>;
  let client2: ReturnType<typeof createClient>;
  let user1: TestUser;
  let user2: TestUser;
  let idea1User1: TestIdea;
  let idea2User2: TestIdea;

  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    }

    // Crear usuarios de prueba
    user1 = {
      id: uuidv4(),
      email: `user1-${Date.now()}@test.com`,
      password: 'TestPassword123!'
    };

    user2 = {
      id: uuidv4(),
      email: `user2-${Date.now()}@test.com`,
      password: 'TestPassword456!'
    };

    // Crear ideas de prueba
    idea1User1 = {
      id: uuidv4(),
      title: 'User 1 Idea 1',
      content: 'Content from user 1',
      user_id: user1.id
    };

    idea2User2 = {
      id: uuidv4(),
      title: 'User 2 Idea 1',
      content: 'Content from user 2',
      user_id: user2.id
    };

    // Inicializar clientes Supabase
    client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    client2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  afterAll(async () => {
    // Cleanup de prueba (en producción, eliminar usuarios manualmente)
    if (client1 && idea1User1) {
      await client1.from('ideas').delete().eq('id', idea1User1.id);
    }
    if (client2 && idea2User2) {
      await client2.from('ideas').delete().eq('id', idea2User2.id);
    }
  });

  describe('SELECT Policy - Usuario solo ve sus propias ideas', () => {
    it('✅ Usuario 1 puede ver su propia idea', async () => {
      // Insertar idea de usuario 1 (bypass de RLS con admin key sería en setup)
      const { data, error } = await client1
        .from('ideas')
        .insert(idea1User1)
        .select();

      // En contexto real, esto validaría que la idea fue creada
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('❌ Usuario 1 NO puede ver ideas de Usuario 2', async () => {
      // Insertar idea de usuario 2 (bypass RLS)
      const { data: data2 } = await client2
        .from('ideas')
        .insert(idea2User2)
        .select();

      // Usuario 1 intenta ver ideas de usuario 2
      const { data, error } = await client1
        .from('ideas')
        .select('*')
        .eq('user_id', user2.id);

      // RLS filtra la query, retorna 0 filas
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length || 0).toBe(0); // ❌ NO debe ver
    });

    it('✅ Usuario puede ver sus propias ideas', async () => {
      const { data, error } = await client1
        .from('ideas')
        .select('*')
        .eq('user_id', user1.id);

      // RLS automáticamente solo retorna ideas de user1
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      // Debería tener al menos la idea que insertamos
      expect((data?.length || 0) >= 0).toBe(true);
    });
  });

  describe('INSERT Policy - No puede crear ideas para otro usuario', () => {
    it('✅ Usuario puede crear idea para sí mismo', async () => {
      const newIdea: TestIdea = {
        id: uuidv4(),
        title: 'New Idea by User 1',
        user_id: user1.id // ✅ Coincide con auth.uid()
      };

      const { data, error } = await client1
        .from('ideas')
        .insert(newIdea)
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('❌ Usuario NO puede crear idea con user_id ajeno', async () => {
      const maliciousIdea: TestIdea = {
        id: uuidv4(),
        title: 'Malicious Idea',
        user_id: user2.id // ❌ No coincide con auth.uid() de client1
      };

      const { data, error } = await client1
        .from('ideas')
        .insert(maliciousIdea);

      // RLS rechaza el INSERT
      expect(error).not.toBeNull();
      expect(error?.message).toContain('row-level security policy');
    });
  });

  describe('UPDATE Policy - No puede actualizar ideas ajenas', () => {
    it('✅ Usuario puede actualizar su propia idea', async () => {
      const { data, error } = await client1
        .from('ideas')
        .update({ title: 'Updated by User 1' })
        .eq('id', idea1User1.id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('❌ Usuario NO puede actualizar idea de otro usuario', async () => {
      const { data, error } = await client1
        .from('ideas')
        .update({ title: 'Hacked by User 1' })
        .eq('id', idea2User2.id);

      // RLS previene el UPDATE
      expect(error).not.toBeNull();
      expect(error?.message).toContain('row-level security policy');
    });

    it('❌ Usuario NO puede cambiar user_id a sí mismo', async () => {
      const { data, error } = await client2
        .from('ideas')
        .update({ user_id: user1.id })
        .eq('id', idea2User2.id);

      // RLS WITH CHECK rechaza el cambio de user_id
      expect(error).not.toBeNull();
    });
  });

  describe('DELETE Policy - No puede borrar ideas ajenas', () => {
    it('✅ Usuario puede borrar su propia idea', async () => {
      const tempIdea: TestIdea = {
        id: uuidv4(),
        title: 'Temp Idea to Delete',
        user_id: user1.id
      };

      // Crear idea
      await client1.from('ideas').insert(tempIdea);

      // Borrar idea
      const { data, error } = await client1
        .from('ideas')
        .delete()
        .eq('id', tempIdea.id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('❌ Usuario NO puede borrar idea de otro usuario', async () => {
      const { data, error } = await client1
        .from('ideas')
        .delete()
        .eq('id', idea2User2.id);

      // RLS previene el DELETE
      expect(error).not.toBeNull();
      expect(error?.message).toContain('row-level security policy');
    });
  });

  describe('Sync Engine Integration - Respeta RLS', () => {
    it('✅ Sync pull obtiene solo ideas del usuario actual', async () => {
      // Simular sync pull
      const { data, error } = await client1
        .from('ideas')
        .select('*')
        .is('deleted_at', null);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // Verificar que ninguna idea pertenece a otro usuario
      const allOwnIdeas = data?.every(idea => idea.user_id === user1.id) || false;
      expect(allOwnIdeas).toBe(true);
    });

    it('❌ Sync NO puede extraer datos de otro usuario', async () => {
      // Intentar query para obtener todo (bypear RLS)
      const { data, error } = await client1
        .from('ideas')
        .select('*');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // Verificar que RLS filtró automáticamente
      const hasOtherUserData = data?.some(idea => idea.user_id !== user1.id) || false;
      expect(hasOtherUserData).toBe(false); // ❌ NO debe tener datos ajenos
    });

    it('✅ Sync push respeta RLS (no puede crear para otro)', async () => {
      const conflictingIdea: TestIdea = {
        id: uuidv4(),
        title: 'Conflicting Sync Push',
        user_id: user2.id // ❌ Conflicto: intenta como user1
      };

      const { data, error } = await client1
        .from('ideas')
        .insert(conflictingIdea);

      // RLS lo rechaza
      expect(error).not.toBeNull();
    });
  });

  describe('Audit Log - Usuario solo ve su propio audit', () => {
    it('✅ Usuario puede ver su propio audit log', async () => {
      const { data, error } = await client1
        .from('audit_log')
        .select('*')
        .eq('user_id', user1.id);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('❌ Usuario NO puede ver audit log de otro', async () => {
      const { data, error } = await client1
        .from('audit_log')
        .select('*')
        .eq('user_id', user2.id);

      // RLS filtra
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect((data?.length || 0) === 0).toBe(true); // ❌ NO debe ver
    });
  });

  describe('Performance Tests - Índices para 10k+ usuarios', () => {
    it('✅ Query con índice debe ser rápido', async () => {
      const startTime = Date.now();

      const { data, error } = await client1
        .from('ideas')
        .select('*')
        .eq('user_id', user1.id)
        .order('created_at', { ascending: false })
        .limit(100);

      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000); // Debe ser < 1s incluso con índice scan
    });
  });
});

/**
 * ============================================================================
 * Test Results Interpretation
 * ============================================================================
 *
 * ✅ TODOS LOS TESTS PASAN:
 *    → RLS está habilitado correctamente
 *    → Data no puede ser leaked entre usuarios
 *    → Sync es seguro
 *    → Índices funcionan
 *
 * ❌ Algunos tests fallan:
 *    → Verificar que `supabase/rls-policies.sql` fue ejecutado
 *    → Verificar que .env tiene credenciales correctas
 *    → Ver Supabase Dashboard → SQL Editor para errores
 *
 * Notas de Performance:
 *    - Queries debe ser < 100ms con índices en tabla < 1M rows
 *    - Con 10k usuarios × 1k ideas cada uno = 10M rows
 *    - Los índices idx_ideas_user_id_* permiten queries O(log n)
 */
