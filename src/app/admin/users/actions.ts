'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/* =====================================================
   CREATE USER (Admin or Sales)
===================================================== */
export async function createSalesperson(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const role = formData.get('role') as string

    if (!email || !password || !name || !phone || !role) {
      return { error: 'All fields are required.' }
    }

    const supabaseAdmin = createAdminClient()

    // Check if profile already exists
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return { error: 'A user with this email already exists.' }
    }

    // Create Auth user
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

    // Create profile row
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        full_name: name,   // MUST match your DB column
        email,
        phone,
        role,
        active: true
      })

    if (profileError) {
      return { error: profileError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }

  } catch (err: any) {
    return { error: err.message || 'Unexpected error occurred.' }
  }
}


/* =====================================================
   TOGGLE USER STATUS
===================================================== */
export async function toggleUserStatus(userId: string, active: boolean) {
  try {
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ active })
      .eq('id', userId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }

  } catch (err: any) {
    return { error: err.message }
  }
}


/* =====================================================
   RESET USER PASSWORD
===================================================== */
export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    if (!newPassword) {
      return { error: 'Password cannot be empty.' }
    }

    const supabaseAdmin = createAdminClient()

    const { error } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      })

    if (error) {
      return { error: error.message }
    }

    return { success: true }

  } catch (err: any) {
    return { error: err.message }
  }
}


/* =====================================================
   DELETE USER (Auth + Profile)
===================================================== */
export async function deleteUser(userId: string) {
  try {
    const supabaseAdmin = createAdminClient()

    // 1. Delete profile first
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      return { error: profileError.message }
    }

    // 2. Delete auth user
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      return { error: authError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }

  } catch (err: any) {
    return { error: err.message }
  }
}
