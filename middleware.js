import { NextResponse } from 'next/server'
import supabase from './lib/supabase'

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const protectedRoutes = ['/confirmation', '/scan']

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (!session || error) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const tokenExpiry = new Date(session.expires_at * 1000)
    if (tokenExpiry < new Date()) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}