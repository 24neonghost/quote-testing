'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createSalesperson(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    if (!email || !password || !name) {
      return { error: 'Missing required fields' }
    }

    const supabaseAdmin = createAdminClient()

    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return { error: 'User already exists with this email.' }
    }

    // Create auth user
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      })

    if (authError) {
      return { error: authError.message }
    }

    if (!authUser?.user) {
      return { error: 'Failed to create auth user.' }
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        full_name: name,   // IMPORTANT: match your DB column
        email,
        role: 'sales',
        active: true
      })

    if (profileError) {
      return { error: profileError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }

  } catch (err: any) {
    return { error: err.message || 'Unexpected error occurred' }
  }
}

export async function toggleUserStatus(userId: string, active: boolean) {
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ active })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const supabaseAdmin = createAdminClient()

  const { error } =
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

  if (error) return { error: error.message }

  return { success: true }
}
