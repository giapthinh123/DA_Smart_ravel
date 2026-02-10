'use client'

import { useState } from 'react'
import { AuthService } from '@/services/auth.service'
import { CityService } from '@/services/city.service'

export default function ApiTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [email, setEmail] = useState('test@test.com')
  const [password, setPassword] = useState('test1234')

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const testLogin = async () => {
    try {
      addLog('🔄 Testing login...')
      const result = await AuthService.login({ email, password })
      addLog(`✅ Login successful! Token: ${result.token.substring(0, 20)}...`)
      addLog(`   User: ${result.user.email}`)
      
      // Check localStorage
      const storedToken = localStorage.getItem('auth_token')
      addLog(`   Token in localStorage: ${storedToken ? storedToken.substring(0, 20) + '...' : 'NOT FOUND'}`)
    } catch (error: any) {
      addLog(`❌ Login failed: ${error.message}`)
    }
  }

  const testCities = async () => {
    try {
      addLog('🔄 Testing getCities...')
      const cities = await CityService.getCities()
      addLog(`✅ Got ${cities.length} cities`)
      addLog(`   First city: ${cities[0]?.city || 'N/A'}`)
    } catch (error: any) {
      addLog(`❌ getCities failed: ${error.message}`)
      addLog(`   Error details: ${JSON.stringify(error)}`)
    }
  }

  const testAuth = async () => {
    try {
      addLog('🔄 Testing getCurrentUser (authenticated)...')
      const user = await AuthService.getCurrentUser()
      addLog(`✅ Got user: ${user.email}`)
    } catch (error: any) {
      addLog(`❌ getCurrentUser failed: ${error.message}`)
      addLog(`   Error details: ${JSON.stringify(error)}`)
    }
  }

  const checkToken = () => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    const tokenExpiry = localStorage.getItem('token_expiry')
    
    addLog('📋 Current localStorage state:')
    addLog(`   auth_token: ${token ? token.substring(0, 30) + '...' : 'NOT SET'}`)
    addLog(`   user_data: ${userData ? 'SET' : 'NOT SET'}`)
    addLog(`   token_expiry: ${tokenExpiry ? new Date(parseInt(tokenExpiry)).toLocaleString() : 'NOT SET'}`)
    
    if (tokenExpiry) {
      const isExpired = Date.now() > parseInt(tokenExpiry)
      addLog(`   Token expired: ${isExpired ? 'YES' : 'NO'}`)
    }
  }

  const testDirectAPI = async () => {
    try {
      addLog('🔄 Testing direct fetch to /api/citys...')
      const response = await fetch('/api/citys')
      addLog(`   Response status: ${response.status}`)
      const data = await response.json()
      addLog(`✅ Direct fetch successful! Got ${Array.isArray(data) ? data.length : 0} items`)
    } catch (error: any) {
      addLog(`❌ Direct fetch failed: ${error.message}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Debug Tool</h1>
      
      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border p-2 rounded flex-1"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="border p-2 rounded flex-1"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button onClick={testLogin} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            1. Test Login
          </button>
          <button onClick={checkToken} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            2. Check Token
          </button>
          <button onClick={testCities} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            3. Test Cities API
          </button>
          <button onClick={testAuth} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
            4. Test Auth API
          </button>
          <button onClick={testDirectAPI} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
            5. Direct Fetch
          </button>
          <button onClick={() => setLogs([])} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Clear Logs
          </button>
        </div>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-[500px] overflow-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Click buttons above to test APIs.</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))
        )}
      </div>
    </div>
  )
}
