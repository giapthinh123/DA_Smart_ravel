"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AuthGuard } from "@/components/auth-guard"
import { LoaderCircle } from "lucide-react"
import { toast } from "@/lib/toast"
import { useAuthStore } from "@/store/useAuthStore"
import { AuthService } from "@/services/auth.service"
import { UserMenu } from "@/components/user-menu"
import { Footer } from "@/components/footer"
import { useTranslations } from "next-intl"
function ProfileContent() {
  const { user, logout, updateUser } = useAuthStore()
  const router = useRouter()
  const t = useTranslations("ProfilePage")

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



  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // Guard: all hooks must be called before this check
  if (!user) {
    return null
  }


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

    // Validation
    if (!formData.fullName.trim()) {
      toast.warning('Vui lòng nhập họ tên.', 'Thiếu thông tin')
      return
    }
    if (!formData.phoneNumber.trim()) {
      toast.warning('Vui lòng nhập số điện thoại.', 'Thiếu thông tin')
      return
    }
    if (!formData.address.trim()) {
      toast.warning('Vui lòng nhập địa chỉ.', 'Thiếu thông tin')
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
      toast.success('Thông tin cá nhân đã được cập nhật!', 'Cập nhật thành công')
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.', 'Cập nhật thất bại')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!passwordData.currentPassword) {
      toast.warning('Vui lòng nhập mật khẩu hiện tại.', 'Thiếu thông tin')
      return
    }
    if (!passwordData.newPassword) {
      toast.warning('Vui lòng nhập mật khẩu mới.', 'Thiếu thông tin')
      return
    }
    if (passwordData.newPassword.length < 8) {
      toast.warning('Mật khẩu mới phải có ít nhất 8 ký tự.', 'Mật khẩu quá ngắn')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warning('Mật khẩu xác nhận không khớp.', 'Không khớp')
      return
    }

    setIsChangingPassword(true)

    try {
      await AuthService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      toast.success('Mật khẩu đã được thay đổi thành công!', 'Đổi mật khẩu thành công')
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      toast.error(error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.', 'Đổi mật khẩu thất bại')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!deleteAccountData.confirmPassword) {
      toast.warning('Vui lòng nhập mật khẩu để xác nhận xóa tài khoản.', 'Thiếu thông tin')
      return
    }
    if (deleteAccountData.confirmText.toLowerCase() !== "delete") {
      toast.warning("Vui lòng nhập 'DELETE' để xác nhận.", 'Xác nhận không đúng')
      return
    }

    setIsDeletingAccount(true)

    try {
      await AuthService.deleteAccount(deleteAccountData.confirmPassword)

      toast.success('Tài khoản đã được xóa thành công. Đang chuyển hướng...', 'Xóa tài khoản')

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
      toast.error(error.message || 'Không thể xóa tài khoản. Vui lòng thử lại.', 'Xóa thất bại')
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
      <div className="min-h-screen bg-[#F0FDFA] text-[#3F3F46]">
        <header className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#5FCBC4]">
                {t("brand")}
              </p>
              <p className="text-xl font-semibold text-[#0F4C5C]">
                {t("tagline")}
              </p>
            </div>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <Link href="/" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                {t("home")}
              </Link>
              <Link href="/planner" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                {t("planner")}
              </Link>
              <Link href="/tours" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                {t("tours")}
              </Link>
              <Link href="#" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                {t("contact")}
              </Link>
              <span className="mx-2 h-4 w-px bg-[#E4E4E7]"></span>
              <UserMenu />
            </nav>
          </div>
        </header>

        <div className="container mx-auto px-4 py-4 pb-12">
          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {/* Left Column - Profile & Password */}
            <div className="space-y-6 lg:col-span-2">
              {/* Profile Information Section */}
              <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-sm">
                <div className="mb-6 space-y-1">
                  <h2 className="text-xl font-semibold text-[#0F4C5C]">
                    {t("profileInfo")}
                  </h2>
                  <p className="text-sm text-[#A1A1AA]">
                    {t("profileInfoDesc")}
                  </p>
                </div>

                <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[#E4E4E7] bg-[#F0FDFA] p-4">
                  <Avatar className="h-20 w-20 border-2 border-[#5FCBC4]/40">
                    <AvatarFallback className="text-xl bg-[#CCFBF1] text-[#0F4C5C]">
                      {(user?.fullname || user?.name || user?.email || "U")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-[#0F4C5C] text-lg">{user?.fullname || user?.name || user?.email}</h3>
                    <p className="text-sm text-[#5FCBC4]">{user?.role}</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid gap-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-[#0F4C5C]">
                      {t("fullName")}
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder={t("fullNamePlaceholder")}
                      className="h-12 w-full rounded-xl border border-[#E4E4E7] bg-white px-4 text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/20 transition-colors"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium text-[#0F4C5C]">
                      {t("email")}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={user?.email}
                      disabled
                      className="h-12 w-full rounded-xl border border-[#E4E4E7] bg-[#F0FDFA] px-4 text-[#A1A1AA] cursor-not-allowed"
                    />
                    <p className="text-xs text-[#A1A1AA]">{t("emailCannotChange")}</p>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="phoneNumber" className="text-sm font-medium text-[#0F4C5C]">
                      {t("phoneNumber")}
                    </label>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder={t("phoneNumberPlaceholder")}
                      className="h-12 w-full rounded-xl border border-[#E4E4E7] bg-white px-4 text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/20 transition-colors"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="address" className="text-sm font-medium text-[#0F4C5C]">
                      {t("address")}
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder={t("addressPlaceholder")}
                      className="h-12 w-full rounded-xl border border-[#E4E4E7] bg-white px-4 text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/20 transition-colors"
                    />
                  </div>



                  <button
                    type="submit"
                    disabled={!isProfileFormValid || isUpdatingProfile}
                    className="h-12 w-full rounded-xl bg-[#5FCBC4] text-sm font-semibold text-white transition-all hover:bg-[#4AB8B0] hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isUpdatingProfile ? (
                        <>
                          <LoaderCircle className="w-4 h-4 animate-spin" />
                          {t("updating")}
                        </>
                      ) : (
                        t("updateInfo")
                      )}
                    </span>
                  </button>
                </form>
              </div>

              {/* Change Password Section */}
              <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-sm">
                <div className="mb-6 space-y-1">
                  <h2 className="text-xl font-semibold text-[#0F4C5C]">
                    {t("changePassword")}
                  </h2>
                  <p className="text-sm text-[#A1A1AA]">
                    {t("changePasswordDesc")}
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="grid gap-2">
                    <label htmlFor="currentPassword" className="text-sm font-medium text-[#0F4C5C]">
                      {t("currentPassword")}
                    </label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder={t("currentPasswordPlaceholder")}
                      className="h-12 w-full rounded-xl border border-[#E4E4E7] bg-white px-4 text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/20 transition-colors"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="newPassword" className="text-sm font-medium text-[#0F4C5C]">
                      {t("newPassword")}
                    </label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder={t("newPasswordPlaceholder")}
                      className="h-12 w-full rounded-xl border border-[#E4E4E7] bg-white px-4 text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/20 transition-colors"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="confirmNewPassword" className="text-sm font-medium text-[#0F4C5C]">
                      {t("confirmNewPassword")}
                    </label>
                    <input
                      id="confirmNewPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder={t("confirmNewPasswordPlaceholder")}
                      className="h-12 w-full rounded-xl border border-[#E4E4E7] bg-white px-4 text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/20 transition-colors"
                    />
                  </div>



                  <button
                    type="submit"
                    disabled={!isPasswordFormValid || isChangingPassword}
                    className="h-12 w-full rounded-xl bg-[#5FCBC4] text-sm font-semibold text-white transition-all hover:bg-[#4AB8B0] hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isChangingPassword ? (
                        <>
                          <LoaderCircle className="w-4 h-4 animate-spin" />
                          {t("changing")}
                        </>
                      ) : (
                        t("changePasswordBtn")
                      )}
                    </span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column - Account Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 shadow-sm">
                <div className="mb-6 space-y-1">
                  <h2 className="text-xl font-semibold text-[#0F4C5C]">
                    {t("accountInfo")}
                  </h2>
                  <p className="text-sm text-[#A1A1AA]">
                    {t("accountInfoDesc")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#E4E4E7] bg-[#F0FDFA] p-4">
                    <p className="text-sm font-medium text-[#5FCBC4] mb-1">
                      {t("accountCreated")}
                    </p>
                    <p className="text-base text-[#3F3F46]">
                      {user?.created_at ? new Date(user?.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }) : "N/A"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E4E4E7] bg-[#F0FDFA] p-4">
                    <p className="text-sm font-medium text-[#5FCBC4] mb-1">
                      {t("userRole")}
                    </p>
                    <p className="text-base text-[#3F3F46]">{user?.role}</p>
                  </div>
                </div>
              </div>

              {/* Delete Account Section */}
              <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
                <div className="mb-6 space-y-1">
                  <h2 className="text-xl font-semibold text-red-600">
                    {t("dangerZone")}
                  </h2>
                  <p className="text-sm text-[#A1A1AA]">
                    {t("dangerZoneDesc")}
                  </p>
                </div>

                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm text-red-600">
                      <p className="font-semibold mb-1">{t("warningTitle")}</p>
                      <p>{t("warningDesc")}</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleDeleteAccount} className="space-y-5">
                  <div className="grid gap-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-red-600">
                      {t("confirmPasswordLabel")}
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={deleteAccountData.confirmPassword}
                      onChange={handleDeleteAccountChange}
                      placeholder={t("confirmPasswordPlaceholder")}
                      className="h-12 w-full rounded-xl border border-red-200 bg-white px-4 text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-colors"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="confirmText" className="text-sm font-medium text-red-600">
                      {t("confirmDeleteLabel")}
                    </label>
                    <input
                      id="confirmText"
                      name="confirmText"
                      type="text"
                      value={deleteAccountData.confirmText}
                      onChange={handleDeleteAccountChange}
                      placeholder={t("confirmDeletePlaceholder")}
                      className="h-12 w-full rounded-xl border border-red-200 bg-white px-4 text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-colors"
                    />
                  </div>



                  <button
                    type="submit"
                    disabled={!isDeleteAccountValid || isDeletingAccount}
                    className="h-12 w-full rounded-xl bg-red-500 text-sm font-semibold text-white transition-all hover:bg-red-600 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isDeletingAccount ? (
                        <>
                          <LoaderCircle className="w-4 h-4 animate-spin" />
                          {t("deleting")}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {t("deleteAccountBtn")}
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
        <Footer />
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
