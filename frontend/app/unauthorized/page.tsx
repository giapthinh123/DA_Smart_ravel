'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <svg
                className="h-12 w-12 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Current user:</strong> {user?.email || 'Not logged in'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Your role:</strong>{' '}
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {user?.role || 'guest'}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={() => router.push('/planner')} className="w-full">
              Go to Planner
            </Button>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              Go Back
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            If you believe this is an error, please contact your administrator
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
