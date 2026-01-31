'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Database } from 'lucide-react'

interface MetadataEditorProps {
  value: Record<string, string>
  onChange: (metadata: Record<string, string>) => void
  disabled?: boolean
}

interface MetadataEntry {
  id: number
  key: string
  value: string
}

let nextId = 1

function objectToEntries(obj: Record<string, string>): MetadataEntry[] {
  return Object.entries(obj).map(([key, value]) => ({ id: nextId++, key, value }))
}

function entriesToObject(entries: MetadataEntry[]): Record<string, string> {
  const obj: Record<string, string> = {}
  for (const entry of entries) {
    if (entry.key.trim() !== '') {
      obj[entry.key] = entry.value
    }
  }
  return obj
}

export function MetadataEditor({ value, onChange, disabled = false }: MetadataEditorProps) {
  const [entries, setEntries] = useState<MetadataEntry[]>(() => objectToEntries(value))
  const initialized = useRef(false)

  // Sync from parent value on mount or when value changes externally
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    }
    // Only reset entries if the external value actually differs from what we have
    const currentObj = entriesToObject(entries)
    if (JSON.stringify(currentObj) !== JSON.stringify(value)) {
      setEntries(objectToEntries(value))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const notifyChange = (updated: MetadataEntry[]) => {
    setEntries(updated)
    onChange(entriesToObject(updated))
  }

  const handleKeyChange = (id: number, newKey: string) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, key: newKey } : e))
    notifyChange(updated)
  }

  const handleValueChange = (id: number, newValue: string) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, value: newValue } : e))
    notifyChange(updated)
  }

  const handleDelete = (id: number) => {
    const updated = entries.filter((e) => e.id !== id)
    notifyChange(updated)
  }

  const handleAdd = () => {
    // Add a new entry with empty key/value — this stays in local state
    // even though it won't appear in the serialized object until key is filled
    setEntries([...entries, { id: nextId++, key: '', value: '' }])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4" />
        <Label className="text-sm font-medium">Metadata</Label>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No metadata fields</p>
      ) : (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <Label className="text-xs text-muted-foreground">Key</Label>
          <Label className="text-xs text-muted-foreground">Value</Label>
          <div className="w-9" />

          {entries.map((entry) => (
            <div key={entry.id} className="contents">
              <Input
                placeholder="Key"
                value={entry.key}
                onChange={(e) => handleKeyChange(entry.id, e.target.value)}
                disabled={disabled}
                className="text-sm"
              />
              <Input
                placeholder="Value"
                value={entry.value}
                onChange={(e) => handleValueChange(entry.id, e.target.value)}
                disabled={disabled}
                className="text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(entry.id)}
                disabled={disabled}
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
        className="gap-1"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Field
      </Button>
    </div>
  )
}
