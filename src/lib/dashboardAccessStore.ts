import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { loadAppJson, saveAppJson } from '@/lib/supabaseJsonStore'
import {
  emptyDashboardAccess,
  normalizeDashboardAccess,
  type DashboardAccessMatrix,
} from '@/lib/dashboardAccess'

const JSON_KEY = 'dashboard-access.json'
const LOCAL_FILE = path.join(process.cwd(), 'data', 'dashboard-access.json')

function hasSupabaseSettings() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

function readLocalMatrix(): DashboardAccessMatrix | null {
  try {
    if (!fs.existsSync(LOCAL_FILE)) return null
    return normalizeDashboardAccess(JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')))
  } catch {
    return null
  }
}

function writeLocalMatrix(matrix: DashboardAccessMatrix) {
  try {
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true })
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(matrix, null, 2))
    return true
  } catch (error) {
    console.error('writeLocalMatrix:', error)
    return false
  }
}

export async function loadDashboardAccessMatrix(): Promise<DashboardAccessMatrix> {
  if (hasSupabaseSettings()) {
    try {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .select('dashboard_access')
        .eq('id', 'main')
        .maybeSingle()
      if (!error && data?.dashboard_access && typeof data.dashboard_access === 'object') {
        return normalizeDashboardAccess(data.dashboard_access as Record<string, string[]>)
      }
    } catch (error) {
      console.error('loadDashboardAccessMatrix settings:', error)
    }
  }

  const stored = await loadAppJson<Record<string, string[]>>(JSON_KEY)
  if (stored) return normalizeDashboardAccess(stored)

  return readLocalMatrix() || emptyDashboardAccess()
}

export async function saveDashboardAccessMatrix(input: Partial<Record<string, string[]>>) {
  const matrix = normalizeDashboardAccess(input)
  let saved = false

  if (hasSupabaseSettings()) {
    try {
      const { error } = await supabaseAdmin.from('settings').upsert(
        {
          id: 'main',
          dashboard_access: matrix,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      if (!error) saved = true
      else if (!/dashboard_access/i.test(error.message || '')) {
        console.error('saveDashboardAccessMatrix settings:', error.message)
      }
    } catch (error) {
      console.error('saveDashboardAccessMatrix settings:', error)
    }
  }

  if (await saveAppJson(JSON_KEY, matrix)) saved = true
  if (!saved) saved = writeLocalMatrix(matrix)
  return { saved, matrix }
}
