import { useSyncExternalStore } from 'react'
import { change, getSnapshot, subscribe } from '../core/storage'
export const useRecords = () => useSyncExternalStore(subscribe, getSnapshot)
export function useRecord<T>(key: string, base: T): [T, (v: T | ((old: T) => T)) => Promise<void>] {
  const all = useRecords()
  return [(all[key] as T) ?? base, (v) => change(key, base, v)]
}
export function download(name: string, data: Blob | string, type = 'application/json') {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 15000)
}
