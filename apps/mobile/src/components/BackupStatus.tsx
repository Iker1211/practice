/**
 * BackupStatus Component - Mostrar estado de backups en la app
 * 
 * Uso:
 * <BackupStatus onRestore={handleRestore} />
 */

import { useState, useEffect } from 'react'
import { Button } from '@myapp/ui'
import type { BackupMetadata, DataSafetyStatus } from '@myapp/lib'

export interface BackupStatusProps {
  status?: DataSafetyStatus
  onCreateBackup?: () => void
  onRestore?: (backupId: string) => void
  onRefreshStatus?: () => void
  loading?: boolean
}

export function BackupStatus({
  status,
  onCreateBackup,
  onRestore,
  onRefreshStatus,
  loading = false,
}: BackupStatusProps) {
  const [showHistory, setShowHistory] = useState(false)

  if (!status) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm">
        <p className="text-yellow-700">Loading data safety status...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Last Backup */}
          <div>
            <p className="text-xs text-gray-600">Last Backup</p>
            <p className="text-lg font-semibold text-blue-900">{status.lastBackupAge}</p>
          </div>

          {/* Total Backups */}
          <div>
            <p className="text-xs text-gray-600">Backups Stored</p>
            <p className="text-lg font-semibold text-blue-900">{status.backupCount}</p>
          </div>

          {/* Auto-backup Status */}
          <div>
            <p className="text-xs text-gray-600">Auto-backup</p>
            <p className={`text-sm font-semibold ${status.autoBackupEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {status.autoBackupEnabled ? '✅ Enabled' : '❌ Disabled'}
            </p>
          </div>

          {/* Total Size */}
          <div>
            <p className="text-xs text-gray-600">Storage Used</p>
            <p className="text-sm font-semibold text-gray-900">
              {(status.totalBackupSize / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={onCreateBackup}
          disabled={loading}
          variant="default"
          size="sm"
          className="flex-1"
        >
          {loading ? '⏳ Creating...' : '📸 Backup Now'}
        </Button>

        <Button
          onClick={() => setShowHistory(!showHistory)}
          disabled={status.backupCount === 0}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          📋 View History
        </Button>

        <Button
          onClick={onRefreshStatus}
          disabled={loading}
          variant="ghost"
          size="sm"
        >
          🔄
        </Button>
      </div>

      {/* Backup History Modal */}
      {showHistory && status.lastBackup && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Recent Backups</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {[status.lastBackup].map((backup, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
              >
                <div>
                  <p className="font-medium">{backup.ideaCount} ideas</p>
                  <p className="text-xs text-gray-500">{new Date(backup.timestamp).toLocaleString()}</p>
                </div>
                <Button
                  onClick={() => {
                    onRestore?.(backup.id)
                    setShowHistory(false)
                  }}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-md p-3 text-xs text-green-700">
        ✅ Your ideas are automatically backed up daily and completely recoverable.
      </div>
    </div>
  )
}

/**
 * Backup Progress Component - Durante un backup en progreso
 */
export function BackupProgress({ progress = 0 }: { progress?: number }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Creating backup...</p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-600">{Math.round(progress * 100)}%</p>
    </div>
  )
}

/**
 * Recovery Confirmation Dialog
 */
export interface RestoreConfirmDialogProps {
  backupId: string
  ideaCount: number
  timestamp: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function RestoreConfirmDialog({
  backupId,
  ideaCount,
  timestamp,
  onConfirm,
  onCancel,
  loading = false,
}: RestoreConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
        <h2 className="text-xl font-bold">Restore from Backup?</h2>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
          <p className="font-semibold mb-2">⚠️ This will:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Restore {ideaCount} ideas from {new Date(timestamp).toLocaleDateString()}</li>
            <li>Save your current state before restoring</li>
            <li>NOT delete any ideas created since this backup</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={onCancel} variant="outline" disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="flex-1">
            {loading ? '⏳ Restoring...' : 'Restore'}
          </Button>
        </div>
      </div>
    </div>
  )
}
