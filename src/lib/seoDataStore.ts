import fs from 'fs'
import path from 'path'
import { loadAppJson, saveAppJson } from '@/lib/supabaseJsonStore'

const LOCAL_DIR = path.join(process.cwd(), 'data', 'seo')

function localPath(file: string) {
  return path.join(LOCAL_DIR, file)
}

function readLocal<T>(file: string, fallback: T): T {
  try {
    const full = localPath(file)
    if (fs.existsSync(full)) return JSON.parse(fs.readFileSync(full, 'utf8')) as T
  } catch (error) {
    console.error(`seoDataStore read ${file}:`, error)
  }
  return fallback
}

function writeLocal(file: string, value: unknown) {
  try {
    if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true })
    fs.writeFileSync(localPath(file), JSON.stringify(value, null, 2))
    return true
  } catch (error) {
    console.error(`seoDataStore write ${file}:`, error)
    return false
  }
}

export async function loadSeoJson<T>(key: string, fallback: T): Promise<T> {
  const fromStorage = await loadAppJson<T>(`seo-${key}`)
  if (fromStorage != null) return fromStorage
  return readLocal(key, fallback)
}

export async function saveSeoJson<T>(key: string, value: T): Promise<T> {
  const stored = await saveAppJson(`seo-${key}`, value)
  if (!stored) writeLocal(key, value)
  return value
}
