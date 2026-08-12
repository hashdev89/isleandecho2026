#!/usr/bin/env node
/**
 * Sync local data/*.json with the live site + shared Supabase.
 *
 * Pulls tours, destinations, blog, site content, bookings, users, settings
 * from production. Pushes local vehicles + rental settings into Supabase
 * so the live site uses the same fleet (those were previously local-only).
 *
 * Usage: npm run sync:data
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dataDir = path.join(root, 'data')

function loadDotEnv(file) {
  const envPath = path.join(root, file)
  if (!fs.existsSync(envPath)) return
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadDotEnv('.env.local')
loadDotEnv('.env')

const BASE = (process.env.LIVE_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.isleandecho.com').replace(
  /\/$/,
  ''
)

fs.mkdirSync(dataDir, { recursive: true })

function writeJson(file, value) {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(value, null, 2))
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} → ${res.status} ${res.statusText}`)
  return res.json()
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || url.includes('placeholder')) return null
  return createClient(url, key)
}

async function uploadJson(client, key, value) {
  const { data: buckets } = await client.storage.listBuckets()
  if (!buckets?.some((b) => b.name === 'site-content')) {
    await client.storage.createBucket('site-content', {
      public: false,
      allowedMimeTypes: ['application/json'],
      fileSizeLimit: '5MB',
    })
  }
  const body = JSON.stringify(value, null, 2)
  const { error } = await client.storage
    .from('site-content')
    .upload(key, Buffer.from(body), { contentType: 'application/json', upsert: true })
  if (error) throw new Error(error.message)
}

const results = []
const warnings = []

async function pull(label, file, loader) {
  try {
    const value = await loader()
    writeJson(file, value)
    const count = Array.isArray(value) ? value.length : Object.keys(value || {}).length
    results.push(`${label}: ${count}`)
  } catch (e) {
    warnings.push(`${label}: ${e instanceof Error ? e.message : e}`)
  }
}

await pull('tours', 'tours.json', async () => {
  const json = await fetchJson(`${BASE}/api/tours`)
  const tours = Array.isArray(json.data) ? json.data : []
  if (tours.length === 0) throw new Error('Live /api/tours returned no tours')
  return tours
})

await pull('destinations', 'destinations.json', async () => {
  const json = await fetchJson(`${BASE}/api/destinations?includeTourCount=false`)
  return Array.isArray(json.data) ? json.data : []
})

await pull('blog', 'blog.json', async () => {
  const json = await fetchJson(`${BASE}/api/blog`)
  return Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
})

await pull('site-content', 'site-content.json', async () => {
  const json = await fetchJson(`${BASE}/api/site-content`)
  const content = json?.data && typeof json.data === 'object' ? json.data : json
  if (!content || typeof content !== 'object') throw new Error('empty site content')
  return content
})

await pull('bookings', 'bookings.json', async () => {
  const client = supabaseAdmin()
  if (client) {
    const { data, error } = await client.from('bookings').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }
  const json = await fetchJson(`${BASE}/api/bookings`)
  return Array.isArray(json.data) ? json.data : []
})

await pull('users', 'users.json', async () => {
  const client = supabaseAdmin()
  if (client) {
    const { data, error } = await client.from('users').select('*').order('created_at', { ascending: false })
    if (!error && data) return data
  }
  const json = await fetchJson(`${BASE}/api/users`)
  return Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : json?.users || []
})

await pull('settings', 'settings.json', async () => {
  const json = await fetchJson(`${BASE}/api/settings`)
  return json?.data && typeof json.data === 'object' ? json.data : json
})

const client = supabaseAdmin()

async function syncSharedJson(label, file, storageKey) {
  const localPath = path.join(dataDir, file)
  let local = null
  if (fs.existsSync(localPath)) {
    try {
      local = JSON.parse(fs.readFileSync(localPath, 'utf8'))
    } catch {
      local = null
    }
  }

  if (!client) {
    if (local) results.push(`${label}: local only (no Supabase)`)
    return
  }

  const { data, error } = await client.storage.from('site-content').download(storageKey)
  let remote = null
  if (!error && data) {
    try {
      remote = JSON.parse(await data.text())
    } catch {
      remote = null
    }
  }

  const remoteHasData = Array.isArray(remote) ? remote.length > 0 : remote && Object.keys(remote).length > 0
  const localHasData = Array.isArray(local) ? local.length > 0 : local && Object.keys(local).length > 0

  if (remoteHasData) {
    writeJson(file, remote)
    results.push(`${label}: pulled ${Array.isArray(remote) ? remote.length : 'settings'} from live`)
    return
  }

  if (localHasData) {
    await uploadJson(client, storageKey, local)
    results.push(`${label}: pushed local data to live`)
    return
  }

  warnings.push(`${label}: nothing to sync`)
}

await syncSharedJson('vehicles', 'vehicles.json', 'vehicles.json')
await syncSharedJson('rental-settings', 'rental-settings.json', 'rental-settings.json')

console.log(`Synced with ${BASE}:`)
for (const line of results) console.log(`  • ${line}`)
if (warnings.length) {
  console.log('\nWarnings:')
  for (const line of warnings) console.log(`  • ${line}`)
}
console.log('\nRestart npm run dev if it is already running.')
