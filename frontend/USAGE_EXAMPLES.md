# 💡 Frontend Authorization - Usage Examples

## 🎯 Page-Level Protection

### Basic Protected Page
```tsx
// app/dashboard/page.tsx
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  )
}
```

### Admin-Only Page
```tsx
// app/admin/page.tsx
import { AuthGuard } from '@/components/auth-guard'

export default function AdminPage() {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminDashboard />
    </AuthGuard>
  )
}
```

### Manager or Admin Page
```tsx
// app/reports/page.tsx
import { AuthGuard } from '@/components/auth-guard'

export default function ReportsPage() {
  return (
    <AuthGuard requiredRoles={['admin', 'manager']}>
      <ReportsView />
    </AuthGuard>
  )
}
```

## 🧩 Component-Level Protection

### Hide Buttons Based on Role
```tsx
import { AdminOnly, ManagerOrAdmin } from '@/components/role-gate'

function Toolbar() {
  return (
    <div className="flex gap-2">
      {/* Everyone sees this */}
      <button>View</button>
      
      {/* Only managers and admins */}
      <ManagerOrAdmin>
        <button>Export</button>
      </ManagerOrAdmin>
      
      {/* Only admins */}
      <AdminOnly>
        <button className="text-red-500">Delete All</button>
      </AdminOnly>
    </div>
  )
}
```

### Show Different Content
```tsx
import { RoleGate } from '@/components/role-gate'
import { useAuthStore } from '@/store/useAuthStore'

function Dashboard() {
  const { user } = useAuthStore()
  
  return (
    <div>
      <h1>Welcome, {user?.fullname}!</h1>
      
      {/* Admin Dashboard */}
      <RoleGate allowedRoles={['admin']}>
        <AdminDashboard />
      </RoleGate>
      
      {/* Manager Dashboard */}
      <RoleGate allowedRoles={['manager']}>
        <ManagerDashboard />
      </RoleGate>
      
      {/* User Dashboard */}
      <RoleGate allowedRoles={['user']}>
        <UserDashboard />
      </RoleGate>
    </div>
  )
}
```

## 🪝 Using Hooks

### Check Permissions in Logic
```tsx
import { usePermissions } from '@/components/auth-guard'

function UserList() {
  const { isAdmin, hasRole } = usePermissions()
  
  async function handleDelete(userId: string) {
    // Check permission before calling API
    if (!isAdmin) {
      toast.error('Only admins can delete users')
      return
    }
    
    try {
      // Backend will validate again
      await api.delete(`/users/${userId}`)
      toast.success('User deleted')
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Permission denied')
      }
    }
  }
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          {user.name}
          {isAdmin && (
            <button onClick={() => handleDelete(user.id)}>
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Conditional Rendering
```tsx
import { usePermissions } from '@/components/auth-guard'
import { useAuthStore } from '@/store/useAuthStore'

function Header() {
  const { user } = useAuthStore()
  const { isAdmin, isManagerOrAdmin } = usePermissions()
  
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      
      {isManagerOrAdmin && (
        <Link href="/reports">Reports</Link>
      )}
      
      {isAdmin && (
        <Link href="/admin">Admin</Link>
      )}
      
      <div className="user-badge">
        {user?.fullname}
        <span className="role-badge">{user?.role}</span>
      </div>
    </nav>
  )
}
```

## 🔐 API Calls with Authorization

### Service with Role Checking
```tsx
// services/user.service.ts
import api from '@/lib/axios'
import { useAuthStore } from '@/store/useAuthStore'

class UserService {
  /**
   * Get all users - Admin only
   */
  static async getAllUsers() {
    try {
      const response = await api.get('/api/users')
      return response.data.users
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('Admin access required')
      }
      throw error
    }
  }
  
  /**
   * Update user role - Admin only
   */
  static async updateUserRole(userId: string, role: string) {
    try {
      const response = await api.put(`/api/users/${userId}/role`, { role })
      return response.data
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('Admin access required')
      }
      throw error
    }
  }
  
  /**
   * Get own profile - Any authenticated user
   */
  static async getProfile() {
    const response = await api.get('/api/users/profile')
    return response.data.user
  }
}
```

### Component Using Service
```tsx
import { useState, useEffect } from 'react'
import { UserService } from '@/services/user.service'
import { AdminOnly } from '@/components/role-gate'
import { toast } from 'sonner'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    loadUsers()
  }, [])
  
  async function loadUsers() {
    setLoading(true)
    try {
      // Backend validates admin role
      const data = await UserService.getAllUsers()
      setUsers(data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  async function changeRole(userId: string, newRole: string) {
    try {
      await UserService.updateUserRole(userId, newRole)
      toast.success('Role updated')
      loadUsers() // Reload list
    } catch (error) {
      toast.error(error.message)
    }
  }
  
  return (
    <AdminOnly fallback={<p>Access denied</p>}>
      <div>
        <h2>User Management</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <select 
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminOnly>
  )
}
```

## 🎨 Styled Components with Roles

### Role Badge
```tsx
import { useAuthStore } from '@/store/useAuthStore'
import { Badge } from '@/components/ui/badge'

function RoleBadge() {
  const { user } = useAuthStore()
  
  const roleColors = {
    admin: 'destructive',
    manager: 'default',
    user: 'secondary'
  } as const
  
  return (
    <Badge variant={roleColors[user?.role || 'user']}>
      {user?.role?.toUpperCase()}
    </Badge>
  )
}
```

### Conditional Styling
```tsx
import { usePermissions } from '@/components/auth-guard'
import { cn } from '@/lib/utils'

function ActionButton({ onClick, children }) {
  const { isAdmin } = usePermissions()
  
  return (
    <button
      onClick={onClick}
      disabled={!isAdmin}
      className={cn(
        "px-4 py-2 rounded",
        isAdmin 
          ? "bg-red-500 hover:bg-red-600 cursor-pointer" 
          : "bg-gray-300 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  )
}
```

## 🚦 Navigation Guards

### Protected Link Component
```tsx
import Link from 'next/link'
import { usePermissions } from '@/components/auth-guard'
import { UserRole } from '@/types/domain'

interface ProtectedLinkProps {
  href: string
  requiredRoles?: UserRole[]
  children: React.ReactNode
}

function ProtectedLink({ href, requiredRoles, children }: ProtectedLinkProps) {
  const { hasRole } = usePermissions()
  
  if (requiredRoles && !hasRole(requiredRoles)) {
    return null // Don't show link
  }
  
  return <Link href={href}>{children}</Link>
}

// Usage
<ProtectedLink href="/admin" requiredRoles={['admin']}>
  Admin Panel
</ProtectedLink>
```

### Sidebar with Role-based Items
```tsx
import { usePermissions } from '@/components/auth-guard'

function Sidebar() {
  const { isAdmin, isManagerOrAdmin } = usePermissions()
  
  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', show: true },
    { label: 'Profile', href: '/profile', show: true },
    { label: 'Reports', href: '/reports', show: isManagerOrAdmin },
    { label: 'Users', href: '/admin/users', show: isAdmin },
    { label: 'Settings', href: '/admin/settings', show: isAdmin },
  ]
  
  return (
    <nav>
      {menuItems.filter(item => item.show).map(item => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

## ⚡ Advanced Patterns

### Higher Order Component
```tsx
import { withAuthGuard } from '@/components/auth-guard'

// Original component
function SecretPage() {
  return <div>Secret Content</div>
}

// Protected version
export default withAuthGuard(SecretPage, ['admin'])
```

### Custom Hook for Route Access
```tsx
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { canAccessRoute } from '@/lib/auth-guard'

function useRouteProtection() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()
  
  function checkAccess() {
    if (!isAuthenticated) {
      router.push('/login')
      return false
    }
    
    if (!canAccessRoute(pathname, user?.role)) {
      router.push('/unauthorized')
      return false
    }
    
    return true
  }
  
  return { checkAccess }
}

// Usage in component
function ProtectedPage() {
  const { checkAccess } = useRouteProtection()
  
  useEffect(() => {
    checkAccess()
  }, [])
  
  return <div>Protected Content</div>
}
```

### Dynamic Role Checking
```tsx
import { useState } from 'react'
import { usePermissions } from '@/components/auth-guard'
import { UserRole } from '@/types/domain'

function DynamicRoleComponent() {
  const { hasRole, userRole } = usePermissions()
  const [requiredRole, setRequiredRole] = useState<UserRole>('admin')
  
  return (
    <div>
      <select 
        value={requiredRole}
        onChange={(e) => setRequiredRole(e.target.value as UserRole)}
      >
        <option value="user">User</option>
        <option value="manager">Manager</option>
        <option value="admin">Admin</option>
      </select>
      
      {hasRole([requiredRole]) ? (
        <p>✅ You have {requiredRole} access</p>
      ) : (
        <p>❌ You need {requiredRole} role (you are: {userRole})</p>
      )}
    </div>
  )
}
```

## 🎯 Complete Example: User Management Page

```tsx
'use client'

import { useState, useEffect } from 'react'
import { AuthGuard, usePermissions } from '@/components/auth-guard'
import { AdminOnly } from '@/components/role-gate'
import { toast } from 'sonner'
import api from '@/lib/axios'

function UserManagementPage() {
  const [users, setUsers] = useState([])
  const { isAdmin } = usePermissions()
  
  useEffect(() => {
    loadUsers()
  }, [])
  
  async function loadUsers() {
    try {
      const response = await api.get('/api/users')
      setUsers(response.data.users)
    } catch (error) {
      toast.error('Failed to load users')
    }
  }
  
  async function deleteUser(userId: string) {
    if (!confirm('Are you sure?')) return
    
    try {
      await api.delete(`/api/users/${userId}`)
      toast.success('User deleted')
      loadUsers()
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Permission denied')
      } else {
        toast.error('Failed to delete user')
      }
    }
  }
  
  async function changeRole(userId: string, newRole: string) {
    try {
      await api.put(`/api/users/${userId}/role`, { role: newRole })
      toast.success('Role updated')
      loadUsers()
    } catch (error) {
      toast.error('Failed to update role')
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      
      <table className="w-full">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <AdminOnly>
              <th>Actions</th>
            </AdminOnly>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.fullname}</td>
              <td>
                <AdminOnly fallback={<span>{user.role}</span>}>
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </AdminOnly>
              </td>
              <AdminOnly>
                <td>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </td>
              </AdminOnly>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Export with guard
export default function Page() {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <UserManagementPage />
    </AuthGuard>
  )
}
```

## 📝 Best Practices

1. **Always use AuthGuard for pages**
```tsx
✅ <AuthGuard requiredRoles={['admin']}><Page /></AuthGuard>
❌ if (user.role === 'admin') <Page />
```

2. **Use RoleGate for UI elements**
```tsx
✅ <AdminOnly><Button /></AdminOnly>
❌ {user?.role === 'admin' && <Button />}
```

3. **Always handle API errors**
```tsx
try {
  await api.delete('/admin/resource')
} catch (error) {
  if (error.response?.status === 403) {
    // Handle permission denied
  }
}
```

4. **Remember: Frontend = UX, Backend = Security**
```tsx
// Frontend check - for user experience
if (!isAdmin) {
  toast.error('Admin only')
  return
}

// Backend validates again - actual security
await api.delete('/users/123')
```

---

**Remember**: All frontend checks are for UX only. Backend ALWAYS validates permissions! 🔒
