import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run middleware on ALL routes except:
     * - next static files
     * - images
     * - favicon
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
