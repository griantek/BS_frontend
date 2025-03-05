'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ViewPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the /executive dashboard
    router.push('/business/executive')
  }, [router])

  return null
}
