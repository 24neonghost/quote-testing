import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createSalesperson(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password || !name) {
    return { error: 'Missing required fields' }
  }

  const supabaseAdmin = createAdminClient()

  // 1. Create auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  })

  if (authError) return { error: authError.message }

  // 2. Create profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authUser.user.id,
      name,
      role: 'sales',
      active: true
    })

  if (profileError) return { error: profileError.message }

  revalidatePath('/admin/users')
  return { success: true }
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
  
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword
  })

  if (error) return { error: error.message }

  return { success: true }
}
