'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    console.log('Root page mounted, redirecting to dashboard...')
    router.push('/dashboard')
  }, [router])

  return <LoadingSpinner />
}
