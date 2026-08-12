#!/usr/bin/env node
/**
 * Sync public CMS data from production into local data/*.json fallbacks
 * (used when Supabase env vars are not configured).
 *
 * Usage: npm run sync:data
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dataDir = path.join(root, 'data')
const BASE = (process.env.LIVE_SITE_URL || 'https://www.isleandecho.com').replace(/\/$/, '')

fs.mkdirSync(dataDir, { recursive: true })

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} → ${res.status} ${res.statusText}`)
  return res.json()
}

function writeJson(file, value) {
  const out = path.join(dataDir, file)
  fs.writeFileSync(out, JSON.stringify(value, null, 2))
  return out
}

const results = []

// Tours → data/tours.json (array)
{
  const json = await fetchJson(`${BASE}/api/tours`)
  const tours = Array.isArray(json.data) ? json.data : []
  if (tours.length === 0) throw new Error('Live /api/tours returned no tours')
  writeJson('tours.json', tours)
  results.push(`tours: ${tours.length}`)
}

// Destinations → data/destinations.json (array)
{
  const json = await fetchJson(`${BASE}/api/destinations?includeTourCount=false`)
  const destinations = Array.isArray(json.data) ? json.data : []
  writeJson('destinations.json', destinations)
  results.push(`destinations: ${destinations.length}`)
}

// Blog → data/blog.json (bare array)
{
  const json = await fetchJson(`${BASE}/api/blog`)
  const posts = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
  writeJson('blog.json', posts)
  const published = posts.filter((p) => p.status === 'Published').length
  results.push(`blog: ${posts.length} (${published} published)`)
}

// Site content → data/site-content.json (content object only)
{
  const json = await fetchJson(`${BASE}/api/site-content`)
  const content = json?.data && typeof json.data === 'object' ? json.data : json
  if (!content || typeof content !== 'object') throw new Error('Live /api/site-content returned empty data')
  writeJson('site-content.json', content)
  results.push(`site-content: ${Object.keys(content).length} sections`)
}

console.log(`Synced from ${BASE}:`)
for (const line of results) console.log(`  • ${line}`)
console.log('\nRestart npm run dev if it is already running.')
