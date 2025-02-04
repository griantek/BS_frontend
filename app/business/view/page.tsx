'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ViewPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the business dashboard
    router.push('/business')
  }, [router])

  return null
}
