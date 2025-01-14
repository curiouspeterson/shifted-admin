import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'

export const POST = createRouteHandler(
  async (req, { supabase }) => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new AppError(error.message, 500)
    }

    return NextResponse.json({ success: true })
  }
) 