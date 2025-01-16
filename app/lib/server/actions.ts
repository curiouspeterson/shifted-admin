/**
 * Server Actions
 * Last Updated: 2025-01-16
 * 
 * Server actions for data mutations and cache revalidation.
 * Uses Next.js 14 server actions with proper typing and error handling.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database/database.types'

type Tables = Database['public']['Tables']
type RevalidateKind = 'layout' | 'page'

/**
 * Revalidate paths
 */
function revalidatePages(paths: string[], kind: RevalidateKind = 'layout') {
  paths.forEach(path => revalidatePath(path, kind))
}

/**
 * Revalidate table data
 */
export async function revalidateTableData(
  table: keyof Tables
) {
  revalidatePages(['/', `/dashboard/${table}`])
}

/**
 * Revalidate user data
 */
export async function revalidateUserData(userId: string) {
  revalidatePages(['/', '/dashboard', `/profile/${userId}`])
}

/**
 * Revalidate team data
 */
export async function revalidateTeamData(teamId: string) {
  revalidatePages(['/', '/dashboard', `/teams/${teamId}`])
}

/**
 * Create employee
 */
export async function createEmployee(data: Tables['employees']['Insert']) {
  const supabase = createClient()
  const { data: employee, error } = await supabase
    .from('employees')
    .insert(data)
    .select()
    .single()

  if (error) throw error

  revalidatePages(['/', '/dashboard/employees'])
  return employee
}

/**
 * Update employee
 */
export async function updateEmployee(
  id: string,
  data: Tables['employees']['Update']
) {
  const supabase = createClient()
  const { data: employee, error } = await supabase
    .from('employees')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidatePages(['/', '/dashboard/employees', `/employees/${id}`])
  return employee
}

/**
 * Create schedule
 */
export async function createSchedule(data: Tables['schedules']['Insert']) {
  const supabase = createClient()
  const { data: schedule, error } = await supabase
    .from('schedules')
    .insert(data)
    .select()
    .single()

  if (error) throw error

  revalidatePages(['/', '/dashboard/schedules'])
  return schedule
}

/**
 * Update schedule
 */
export async function updateSchedule(
  id: string,
  data: Tables['schedules']['Update']
) {
  const supabase = createClient()
  const { data: schedule, error } = await supabase
    .from('schedules')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidatePages(['/', '/dashboard/schedules', `/schedules/${id}`])
  return schedule
}

/**
 * Add team member
 */
export async function addTeamMember(
  teamId: string,
  data: Tables['team_members']['Insert']
) {
  const supabase = createClient()
  const { data: member, error } = await supabase
    .from('team_members')
    .insert({ ...data, team_id: teamId })
    .select()
    .single()

  if (error) throw error

  revalidatePages(['/', '/dashboard/teams', `/teams/${teamId}`])
  return member
}

/**
 * Update team member
 */
export async function updateTeamMember(
  teamId: string,
  memberId: string,
  data: Tables['team_members']['Update']
) {
  const supabase = createClient()
  const { data: member, error } = await supabase
    .from('team_members')
    .update(data)
    .eq('id', memberId)
    .eq('team_id', teamId)
    .select()
    .single()

  if (error) throw error

  revalidatePages(['/', '/dashboard/teams', `/teams/${teamId}`])
  return member
}

/**
 * Remove team member
 */
export async function removeTeamMember(teamId: string, memberId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('team_id', teamId)

  if (error) throw error

  revalidatePages(['/', '/dashboard/teams', `/teams/${teamId}`])
} 