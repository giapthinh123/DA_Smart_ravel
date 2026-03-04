"use client"

import { useState, useEffect } from "react"
import { Smartphone, Trash2, Clock, AlertCircle } from "lucide-react"
import { toast } from "@/lib/toast"
import api from "@/lib/axios"
import { useTranslations } from "next-intl"

interface Device {
  device_id: string
  device_name: string
  added_at: string
  last_used: string
}

export function DevicesSection() {
  const t = useTranslations("DevicesSection")
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  useEffect(() => {
    loadDevices()
  }, [])
  
  const loadDevices = async () => {
    try {
      const response = await api.get('/api/devices')
      setDevices(response.data.devices || [])
    } catch (error) {
      toast.error(t("loadError"), t("error"))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm(t("confirmDelete"))) return
    
    setIsDeleting(deviceId)
    try {
      await api.delete(`/api/devices/${deviceId}`)
      toast.success(t("deleteSuccess"), t("success"))
      loadDevices()
    } catch (error) {
      toast.error(t("deleteError"), t("error"))
    } finally {
      setIsDeleting(null)
    }
  }
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }
  
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 p-6 backdrop-blur-2xl shadow-xl shadow-[#5FCBC4]/10">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 p-6 backdrop-blur-2xl shadow-xl shadow-[#5FCBC4]/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0F172A]">
          {t("title")} ({devices.length}/2)
        </h2>
      </div>
      
      {/* Info banner */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">{t("info")}</p>
      </div>
      
      {/* Devices list */}
      {devices.length === 0 ? (
        <div className="text-center py-8">
          <Smartphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("noDevices")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device, index) => (
            <div 
              key={device.device_id} 
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#5FCBC4]/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#5FCBC4]/15 flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5 text-[#5FCBC4]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-[#0F172A] truncate">
                      {t("device")} {index + 1}
                    </p>
                    {index === 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        {t("current")}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t("added")}: {formatDate(device.added_at)}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t("lastUsed")}: {formatDate(device.last_used)}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleRemoveDevice(device.device_id)}
                disabled={isDeleting === device.device_id}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title={t("remove")}
              >
                {isDeleting === device.device_id ? (
                  <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer note */}
      {devices.length < 2 && (
        <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-sm text-gray-600">
            {t("availableSlots", { count: 2 - devices.length })}
          </p>
        </div>
      )}
    </div>
  )
}
