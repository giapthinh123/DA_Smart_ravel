"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AuthHeader } from "@/components/auth-header"
import { AuthGuard } from "@/components/auth-guard"
import { AdminOnly } from "@/components/role-gate"
import { LoaderCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/useAuthStore"
import {Switch} from '@/components/ui/switch'
import { AuthService } from "@/services/auth.service"

function ProfileContent() {
  const { user, logout, updateUser } = useAuthStore()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    fullName: user?.fullname || user?.name || "",
    phoneNumber: user?.phone || "",
    address: user?.address || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [deleteAccountData, setDeleteAccountData] = useState({
    confirmPassword: "",
    confirmText: "",
  })

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [deleteMessage, setDeleteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handleDeleteAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeleteAccountData({
      ...deleteAccountData,
      [e.target.name]: e.target.value,
    })
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validation
    if (!formData.fullName.trim()) {
      setMessage({ type: "error", text: "Full name is required" })
      return
    }
    if (!formData.phoneNumber.trim()) {
      setMessage({ type: "error", text: "Phone number is required" })
      return
    }
    if (!formData.address.trim()) {
      setMessage({ type: "error", text: "Address is required" })
      return
    }

    setIsUpdatingProfile(true)

    try {
      const updatedUser = await AuthService.updateProfile({
        fullname: formData.fullName,
        phone: formData.phoneNumber,
        address: formData.address,
      })
      
      // Update user in store
      updateUser(updatedUser)
      
      setMessage({ type: "success", text: "Profile updated successfully!" })

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to update profile" 
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    // Validation
    if (!passwordData.currentPassword) {
      setPasswordMessage({ type: "error", text: "Current password is required" })
      return
    }
    if (!passwordData.newPassword) {
      setPasswordMessage({ type: "error", text: "New password is required" })
      return
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters" })
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" })
      return
    }

    setIsChangingPassword(true)

    try {
      await AuthService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      setPasswordMessage({ type: "success", text: "Password changed successfully!" })
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      // Clear message after 3 seconds
      setTimeout(() => setPasswordMessage(null), 3000)
    } catch (error: any) {
      setPasswordMessage({ 
        type: "error", 
        text: error.message || "Failed to change password" 
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeleteMessage(null)

    // Validation
    if (!deleteAccountData.confirmPassword) {
      setDeleteMessage({ type: "error", text: "Password is required to delete account" })
      return
    }
    if (deleteAccountData.confirmText.toLowerCase() !== "delete") {
      setDeleteMessage({ type: "error", text: "Please type 'DELETE' to confirm" })
      return
    }

    setIsDeletingAccount(true)

    try {
      await AuthService.deleteAccount(deleteAccountData.confirmPassword)
      
      setDeleteMessage({ type: "success", text: "Account deleted successfully" })

      // Clear form
      setDeleteAccountData({
        confirmPassword: "",
        confirmText: "",
      })

      // Redirect after 2 seconds
      setTimeout(async () => {
        await logout()
        router.push("/")
      }, 2000)
    } catch (error: any) {
      setDeleteMessage({ 
        type: "error", 
        text: error.message || "Failed to delete account" 
      })
      setIsDeletingAccount(false)
    }
  }

  const isProfileFormValid = formData.fullName.trim() && formData.phoneNumber.trim() && formData.address.trim()
  const isPasswordFormValid =
    passwordData.currentPassword &&
    passwordData.newPassword.length >= 8 &&
    passwordData.newPassword === passwordData.confirmPassword
  const isDeleteAccountValid =
    deleteAccountData.confirmPassword &&
    deleteAccountData.confirmText.toLowerCase() === "delete"

  return (
    <>
      <div className="relative min-h-screen bg-gradient-to-br from-[#09131A] via-[#12303B] to-[#1A3D4B] text-[#F6F1E7]">
        {/* Background Layers */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,24,31,0.92),rgba(14,31,41,0.55)_42%,rgba(26,61,75,0.75))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_70%)] mix-blend-overlay opacity-75" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0B1217] via-[#0B1217]/40 to-transparent" />
        </div>

        <header className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#7D837A]">
              VietJourney
            </p>
            <p className="text-xl font-semibold text-[#F3F0E9]">
              Mapping Vietnam experiences
            </p>
          </div>
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link href="/" className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]">
              Home
            </Link>
            <Link href="/dashboard" className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]">
              Dashboard
            </Link>
            <Link href="/tours" className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]">
              Personalities
            </Link>
            <Link href="#" className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]">
              Contact
            </Link>
            <span className="mx-2 h-4 w-px bg-white/20"></span>
            
            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full bg-white/10 px-4 py-2 text-[#F3F0E9] transition hover:bg-white/20 flex items-center gap-2">
                  <span>{user?.role === 'admin' ? 'ADMIN' : user?.fullname || user?.email || 'USER'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#1A1D1C]/95 backdrop-blur-lg border-white/10">
                <DropdownMenuLabel className="text-[#F3F0E9]">
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.fullname || 'User'}</span>
                    <span className="text-xs text-[#A5ABA3]">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                
                <DropdownMenuItem 
                  onClick={() => router.push('/profile')}
                  className="text-[#F3F0E9] hover:bg-white/10 cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </DropdownMenuItem>
                
                <AdminOnly>
                  <DropdownMenuItem 
                    onClick={() => router.push('/admin')}
                    className="text-[#FFE5B4] hover:bg-white/10 cursor-pointer"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin Panel
                  </DropdownMenuItem>
                </AdminOnly>
                
                <DropdownMenuSeparator className="bg-white/10" />
                
                <DropdownMenuItem 
                  onClick={async () => {
                    await logout()
                    router.push('/login')
                  }}
                  className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

        <div className="container mx-auto px-4 py-2 md:py-1">
          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {/* Left Column - Profile & Password */}
            <div className="space-y-6 lg:col-span-2">
              {/* Profile Information Section */}
              <div className="rounded-3xl border border-white/15 bg-[rgba(10,25,33,0.9)] p-8 backdrop-blur-2xl shadow-[0_32px_110px_-60px_rgba(0,0,0,0.75)]">
                <div className="mb-6 space-y-2">
                  <h2 className="text-xl font-semibold text-white drop-shadow-[0_18px_32px_rgba(0,0,0,0.4)]">
                    Profile Information
                  </h2>
                  <p className="text-sm text-[#D0D7D8]">
                    Update your personal details
                  </p>
                </div>

                <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Avatar className="h-20 w-20 border-2 border-[#FFE5B4]/30">
                    <AvatarFallback className="text-xl bg-[#FFE5B4]/20 text-[#FFE5B4]">
                      {(user?.fullname || user?.name || user?.email || "U")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)} 
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{user.fullname || user.name || user.email}</h3>
                    <p className="text-sm text-[#FFE5B4]">{user.role}</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid gap-2">
                    <label htmlFor="fullName" className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus:border-[#FFE5B4] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]">
                      Email
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                      <input
                        id="email"
                        type="email"
                        value={user?.email }
                        disabled
                        className="h-12 w-full r  ounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 text-[#7D837A] placeholder:text-[#B6C2C6] cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-[#7D837A]">Email cannot be changed</p>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="phoneNumber" className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus:border-[#FFE5B4] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="address" className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]">
                      Address
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                      <input
                        id="address"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter your address"
                        className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus:border-[#FFE5B4] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>
                  {message && (
                    <div
                      className={`rounded-2xl border p-4 text-sm ${
                        message.type === "success"
                          ? "border-green-400/30 bg-green-400/10 text-green-300"
                          : "border-red-400/30 bg-red-400/10 text-red-300"
                      }`}
                    >
                      {message.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isProfileFormValid || isUpdatingProfile}
                    className="group relative mt-1 h-12 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFEED0] via-[#FFD79E] to-[#FFB56D] text-sm font-semibold text-[#2B1200] shadow-[0_25px_70px_-20px_rgba(255,186,102,0.85)] transition-all hover:scale-[1.02] hover:shadow-[0_38px_98px_-30px_rgba(255,186,102,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFEED0]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1820] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    >
                      <span className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,0.65),transparent_55%),radial-gradient(circle_at_85%_45%,rgba(255,255,255,0.5),transparent_60%)] mix-blend-screen" />
                      <span className="absolute left-[-40%] top-1/2 h-[220%] w-[65%] -translate-y-1/2 rotate-[18deg] bg-white/70 blur-[60px] opacity-50" />
                    </span>
                    <span className="relative z-10 flex items-center justify-center gap-2 text-[1rem] font-semibold tracking-[0.03em] text-[#2B1200] drop-shadow-[0_10px_25px_rgba(255,225,190,0.6)]">
                      {isUpdatingProfile ? (
                        <>
                          <LoaderCircle className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Information"
                      )}
                    </span>
                  </button>
                </form>
              </div>

              {/* Change Password Section */}
              <div className="rounded-3xl border border-white/15 bg-[rgba(10,25,33,0.9)] p-8 backdrop-blur-2xl shadow-[0_32px_110px_-60px_rgba(0,0,0,0.75)]">
                <div className="mb-6 space-y-2">
                  <h2 className="text-xl font-semibold text-white drop-shadow-[0_18px_32px_rgba(0,0,0,0.4)]">
                    Change Password
                  </h2>
                  <p className="text-sm text-[#D0D7D8]">
                    Update your account password
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="grid gap-2">
                    <label htmlFor="currentPassword" className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]">
                      Current Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password"
                        className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus:border-[#FFE5B4] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="newPassword" className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password (min. 8 characters)"
                        className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus:border-[#FFE5B4] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="confirmPassword" className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                        className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus:border-[#FFE5B4] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  {passwordMessage && (
                    <div
                      className={`rounded-2xl border p-4 text-sm ${
                        passwordMessage.type === "success"
                          ? "border-green-400/30 bg-green-400/10 text-green-300"
                          : "border-red-400/30 bg-red-400/10 text-red-300"
                      }`}
                    >
                      {passwordMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isPasswordFormValid || isChangingPassword}
                    className="group relative mt-1 h-12 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFEED0] via-[#FFD79E] to-[#FFB56D] text-sm font-semibold text-[#2B1200] shadow-[0_25px_70px_-20px_rgba(255,186,102,0.85)] transition-all hover:scale-[1.02] hover:shadow-[0_38px_98px_-30px_rgba(255,186,102,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFEED0]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1820] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    >
                      <span className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,0.65),transparent_55%),radial-gradient(circle_at_85%_45%,rgba(255,255,255,0.5),transparent_60%)] mix-blend-screen" />
                      <span className="absolute left-[-40%] top-1/2 h-[220%] w-[65%] -translate-y-1/2 rotate-[18deg] bg-white/70 blur-[60px] opacity-50" />
                    </span>
                    <span className="relative z-10 flex items-center justify-center gap-2 text-[1rem] font-semibold tracking-[0.03em] text-[#2B1200] drop-shadow-[0_10px_25px_rgba(255,225,190,0.6)]">
                      {isChangingPassword ? (
                        <>
                          <LoaderCircle className="w-4 h-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column - Account Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-3xl border border-white/15 bg-[rgba(10,25,33,0.9)] p-8 backdrop-blur-2xl shadow-[0_32px_110px_-60px_rgba(0,0,0,0.75)]">
                <div className="mb-6 space-y-2">
                  <h2 className="text-xl font-semibold text-white drop-shadow-[0_18px_32px_rgba(0,0,0,0.4)]">
                    Account Information
                  </h2>
                  <p className="text-sm text-[#D0D7D8]">
                    Your account details
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4] mb-2">
                      Account Created
                    </p>
                    <p className="text-base text-white">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }) : "N/A"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4] mb-2">
                      User Role
                    </p>
                    <p className="text-base text-white">{user.role}</p>
                  </div>
                </div>
              </div>

              {/* Delete Account Section */}
              <div className="rounded-3xl border border-red-500/30 bg-[rgba(10,25,33,0.9)] p-8 backdrop-blur-2xl shadow-[0_32px_110px_-60px_rgba(220,38,38,0.3)]">
                <div className="mb-6 space-y-2">
                  <h2 className="text-xl font-semibold text-red-400 drop-shadow-[0_18px_32px_rgba(0,0,0,0.4)]">
                    Danger Zone
                  </h2>
                  <p className="text-sm text-[#D0D7D8]">
                    Permanently delete your account
                  </p>
                </div>

                <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm text-red-300">
                      <p className="font-semibold mb-1">Warning!</p>
                      <p>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleDeleteAccount} className="space-y-5">
                  <div className="grid gap-2">
                    <label htmlFor="confirmPassword" className="text-sm uppercase tracking-[0.25em] text-red-400">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-red-500/20 opacity-65" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={deleteAccountData.confirmPassword}
                        onChange={handleDeleteAccountChange}
                        placeholder="Enter your password"
                        className="h-12 w-full rounded-2xl border border-red-500/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus:border-red-400 focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="confirmText" className="text-sm uppercase tracking-[0.25em] text-red-400">
                      Type "DELETE" to confirm
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-red-500/20 opacity-65" />
                      <input
                        id="confirmText"
                        name="confirmText"
                        type="text"
                        value={deleteAccountData.confirmText}
                        onChange={handleDeleteAccountChange}
                        placeholder="Type DELETE"
                        className="h-12 w-full rounded-2xl border border-red-500/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus:border-red-400 focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  {deleteMessage && (
                    <div
                      className={`rounded-2xl border p-4 text-sm ${
                        deleteMessage.type === "success"
                          ? "border-green-400/30 bg-green-400/10 text-green-300"
                          : "border-red-400/30 bg-red-400/10 text-red-300"
                      }`}
                    >
                      {deleteMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isDeleteAccountValid || isDeletingAccount}
                    className="group relative mt-1 h-12 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-sm font-semibold text-white shadow-[0_25px_70px_-20px_rgba(220,38,38,0.6)] transition-all hover:scale-[1.02] hover:shadow-[0_38px_98px_-30px_rgba(220,38,38,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1820] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    >
                      <span className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,0.3),transparent_55%),radial-gradient(circle_at_85%_45%,rgba(255,255,255,0.2),transparent_60%)] mix-blend-screen" />
                    </span>
                    <span className="relative z-10 flex items-center justify-center gap-2 text-[1rem] font-semibold tracking-[0.03em] drop-shadow-[0_10px_25px_rgba(0,0,0,0.4)]">
                      {isDeletingAccount ? (
                        <>
                          <LoaderCircle className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Account Permanently
                        </>
                      )}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10 bg-[#061017]/80 py-10 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:justify-between">
            <div className="max-w-sm">
              <p className="mb-2 text-sm uppercase tracking-[0.3em] text-[#7D837A]">
                VietJourney
              </p>
              <h3 className="mb-4 text-xl font-semibold text-white">
                Connect and discover experiences over land
              </h3>
              <p className="mb-2 text-sm text-[#D0D7D8]">
                43 Building, 348 Arau They Street,
              </p>
              <p className="mb-2 text-sm text-[#D0D7D8]">
                Can Giay District, Ha Noi, Vietnam
              </p>
              <p className="text-sm text-[#D0D7D8]">
                help@vietjourneycommander.com
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <h4 className="mb-4 text-sm font-semibold text-white">Platform</h4>
                <ul className="space-y-2 text-sm text-[#D0D7D8]">
                  <li><a href="#" className="hover:text-[#FFE5B4]">Tailored experiences</a></li>
                  <li><a href="#" className="hover:text-[#FFE5B4]">Signature journeys</a></li>
                  <li><a href="#" className="hover:text-[#FFE5B4]">Themed escapes</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-sm font-semibold text-white">Support</h4>
                <ul className="space-y-2 text-sm text-[#D0D7D8]">
                  <li><a href="#" className="hover:text-[#FFE5B4]">Help centre</a></li>
                  <li><a href="#" className="hover:text-[#FFE5B4]">Terms of privacy</a></li>
                  <li><a href="#" className="hover:text-[#FFE5B4]">Legal</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-sm font-semibold text-white">Stay looped</h4>
                <p className="mb-3 text-sm text-[#D0D7D8]">
                  Receive curated travel moments straight to your inbox
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email..."
                    className="h-10 flex-1 rounded-lg border border-white/20 bg-[rgba(7,18,26,0.92)] px-3 text-sm text-white placeholder:text-[#B6C2C6] focus:border-[#FFE5B4] focus:outline-none"
                  />
                  <button className="rounded-lg bg-gradient-to-r from-[#FFEED0] via-[#FFD79E] to-[#FFB56D] px-4 text-sm font-semibold text-[#2B1200] transition hover:scale-105">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 px-6 pt-8 text-center text-sm text-[#7D837A]">
            <p>© 2025 VietJourney. All rights reserved</p>
            <p className="mt-2">Design aligned with the Welcome experiences.</p>
          </div>
        </footer>
      </div>
    </>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}
