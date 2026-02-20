
import { useState } from 'react';
import { CapacitorDatabaseAdapter } from '../db/client';

const dbAdapter = new CapacitorDatabaseAdapter();

export function DatabaseTest() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const runTest = async () => {
    setStatus('testing');
    setMessage(null);

    try {
      // 1. Crear una nueva idea
      const newIdea = {
        id: crypto.randomUUID(),
        title: 'Test Idea ' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
      };

      await dbAdapter.execute(
        'INSERT INTO ideas (id, title, created_at, updated_at, version) VALUES (?, ?, ?, ?, ?)',
        [newIdea.id, newIdea.title, newIdea.created_at, newIdea.updated_at, newIdea.version]
      );

      // 2. Verificar que la idea se insertó
      const result = await dbAdapter.execute<{ id: string }[]>(
        'SELECT id FROM ideas WHERE id = ?',
        [newIdea.id]
      );

      if (result && result.length > 0) {
        setStatus('success');
        setMessage(`✅ Idea creada con ID: ${newIdea.id}`);
      } else {
        setStatus('error');
        setMessage('❌ Error: No se pudo verificar la inserción de la idea.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
      <h2>Test de Base de Datos Local</h2>
      <button onClick={runTest} disabled={status === 'testing'}>
        {status === 'testing' ? 'Probando...' : 'Ejecutar Test'}
      </button>
      {message && (
        <div style={{ marginTop: '1rem', color: status === 'error' ? 'red' : 'green' }}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
