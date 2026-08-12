import { supabaseAdmin } from '@/lib/supabaseClient'

const BUCKET = 'site-content'

function hasSupabase() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (buckets?.some((b) => b.name === BUCKET)) return true
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: false,
    allowedMimeTypes: ['application/json'],
    fileSizeLimit: '5MB',
  })
  if (error) {
    console.error('app json bucket create:', error.message)
    return false
  }
  return true
}

export async function loadAppJson<T>(key: string): Promise<T | null> {
  if (!hasSupabase()) return null
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(key)
    if (error || !data) return null
    return JSON.parse(await data.text()) as T
  } catch (e) {
    console.error(`loadAppJson ${key}:`, e)
    return null
  }
}

export async function saveAppJson(key: string, value: unknown): Promise<boolean> {
  if (!hasSupabase()) return false
  try {
    if (!(await ensureBucket())) return false
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(key, blob, { contentType: 'application/json', upsert: true })
    if (error) {
      console.error(`saveAppJson ${key}:`, error.message)
      return false
    }
    return true
  } catch (e) {
    console.error(`saveAppJson ${key}:`, e)
    return false
  }
}
