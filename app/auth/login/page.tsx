import { Suspense } from 'react'
import LoginClient from './client'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  )
}
