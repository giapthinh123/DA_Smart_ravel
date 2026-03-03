'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Upload, X, CheckCircle2, AlertCircle, Loader2, ImageIcon } from 'lucide-react'
import api from '@/lib/axios'

interface ImageKitAuthResponse {
    token: string
    expire: number
    signature: string
    publicKey: string
}

interface FileItem {
    id: string
    file: File
    preview: string
    status: 'queued' | 'uploading' | 'success' | 'error'
    progress: number
    url?: string
    error?: string
}

export interface ImageUploaderHandle {
    /** Upload all queued files, return list of CDN URLs */
    uploadAll: () => Promise<string[]>
    /** True when there are files waiting to upload */
    hasPending: () => boolean
}

interface ImageUploaderProps {
    folder?: string
    maxSizeMB?: number
}

async function getAuth(): Promise<ImageKitAuthResponse> {
    const res = await api.get<ImageKitAuthResponse>('/api/places/imagekit-auth')
    return res.data
}

function uploadOneFile(
    file: File,
    auth: ImageKitAuthResponse & { publicKey: string },
    folder: string,
    onProgress: (pct: number) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        const safeFileName = `place_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
        const form = new FormData()
        form.append('file', file, safeFileName)
        form.append('fileName', safeFileName)
        form.append('publicKey', auth.publicKey)
        form.append('signature', auth.signature)
        form.append('expire', String(auth.expire))
        form.append('token', auth.token)
        form.append('folder', folder)
        form.append('useUniqueFileName', 'true')

        const xhr = new XMLHttpRequest()
        xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload')
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(JSON.parse(xhr.responseText).url as string)
            } else {
                reject(new Error(JSON.parse(xhr.responseText || '{}').message || 'Upload thất bại'))
            }
        }
        xhr.onerror = () => reject(new Error('Lỗi kết nối mạng'))
        xhr.send(form)
    })
}

export const ImageUploader = forwardRef<ImageUploaderHandle, ImageUploaderProps>(
    function ImageUploader({ folder = '/places', maxSizeMB = 10 }, ref) {
        const inputRef = useRef<HTMLInputElement>(null)
        const [items, setItems] = useState<FileItem[]>([])
        const [isDragging, setIsDragging] = useState(false)
        const [sizeError, setSizeError] = useState('')

        // Expose uploadAll & hasPending to parent via ref
        useImperativeHandle(ref, () => ({
            hasPending: () => items.some(i => i.status === 'queued'),
            uploadAll: async () => {
                const queued = items.filter(i => i.status === 'queued')
                if (queued.length === 0) return []

                let auth: ImageKitAuthResponse & { publicKey: string }
                try {
                    auth = await getAuth() as ImageKitAuthResponse & { publicKey: string }
                } catch {
                    throw new Error('Không lấy được xác thực ImageKit')
                }

                const results: string[] = []
                await Promise.all(
                    queued.map(async (item) => {
                        setItems(prev => prev.map(it =>
                            it.id === item.id ? { ...it, status: 'uploading', progress: 0 } : it
                        ))
                        try {
                            const url = await uploadOneFile(
                                item.file,
                                auth,
                                folder,
                                (pct) => setItems(prev => prev.map(it =>
                                    it.id === item.id ? { ...it, progress: pct } : it
                                ))
                            )
                            setItems(prev => prev.map(it =>
                                it.id === item.id ? { ...it, status: 'success', progress: 100, url } : it
                            ))
                            results.push(url)
                        } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : 'Upload thất bại'
                            setItems(prev => prev.map(it =>
                                it.id === item.id ? { ...it, status: 'error', error: msg } : it
                            ))
                        }
                    })
                )
                return results
            },
        }), [items, folder])

        const addFiles = (files: File[]) => {
            setSizeError('')
            const invalid = files.filter(f => f.size > maxSizeMB * 1024 * 1024)
            if (invalid.length) {
                setSizeError(`${invalid.length} file vượt quá ${maxSizeMB}MB bị bỏ qua`)
            }
            const valid = files.filter(f => f.type.startsWith('image/') && f.size <= maxSizeMB * 1024 * 1024)
            if (!valid.length) return

            valid.forEach(file => {
                const reader = new FileReader()
                reader.onload = (e) => {
                    setItems(prev => [...prev, {
                        id: `${Date.now()}_${Math.random()}`,
                        file,
                        preview: e.target?.result as string,
                        status: 'queued',
                        progress: 0,
                    }])
                }
                reader.readAsDataURL(file)
            })
        }

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            addFiles(Array.from(e.target.files ?? []))
            e.target.value = ''
        }

        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            addFiles(Array.from(e.dataTransfer.files))
        }

        const removeItem = (id: string) =>
            setItems(prev => prev.filter(it => it.id !== id))

        const queuedCount = items.filter(i => i.status === 'queued').length
        const uploadingCount = items.filter(i => i.status === 'uploading').length
        const successCount = items.filter(i => i.status === 'success').length
        const errorCount = items.filter(i => i.status === 'error').length

        return (
            <div className="space-y-3">
                {/* Drop zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all select-none
                        ${isDragging
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-[1.01]'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-slate-900/40'
                        }
                    `}
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Kéo thả hoặc{' '}
                                <span className="text-blue-600 dark:text-blue-400 underline underline-offset-2">chọn ảnh</span>
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                JPG, PNG, WebP · Tối đa {maxSizeMB}MB · Chọn nhiều ảnh cùng lúc
                            </p>
                        </div>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleInputChange}
                    />
                </div>

                {/* Size error */}
                {sizeError && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {sizeError}
                        <button type="button" onClick={() => setSizeError('')} className="ml-auto">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {/* File grid */}
                {items.length > 0 && (
                    <>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-slate-900"
                                >
                                    <img
                                        src={item.preview}
                                        alt={item.file.name}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Uploading overlay */}
                                    {item.status === 'uploading' && (
                                        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1.5 p-3">
                                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                                            <div className="w-full bg-white/30 rounded-full h-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-400 rounded-full transition-all duration-150"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-white text-xs">{item.progress}%</span>
                                        </div>
                                    )}

                                    {/* Queued badge */}
                                    {item.status === 'queued' && (
                                        <div className="absolute bottom-1 left-1">
                                            <span className="text-xs text-white bg-black/50 rounded px-1.5 py-0.5">Chờ lưu</span>
                                        </div>
                                    )}

                                    {/* Success badge */}
                                    {item.status === 'success' && (
                                        <div className="absolute top-1.5 left-1.5 bg-green-500 rounded-full p-0.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    )}

                                    {/* Error overlay */}
                                    {item.status === 'error' && (
                                        <div className="absolute inset-0 bg-red-500/40 flex flex-col items-center justify-center gap-1 p-2">
                                            <AlertCircle className="h-5 w-5 text-white" />
                                            <p className="text-white text-xs text-center leading-tight line-clamp-2">{item.error}</p>
                                        </div>
                                    )}

                                    {/* Remove button */}
                                    {item.status !== 'uploading' && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeItem(item.id) }}
                                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-3">
                                {queuedCount > 0 && (
                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                        <ImageIcon className="h-3.5 w-3.5" />
                                        {queuedCount} chờ lưu
                                    </span>
                                )}
                                {uploadingCount > 0 && (
                                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        {uploadingCount} đang tải
                                    </span>
                                )}
                                {successCount > 0 && (
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {successCount} đã lưu
                                    </span>
                                )}
                                {errorCount > 0 && (
                                    <span className="flex items-center gap-1 text-red-500">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {errorCount} lỗi
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setItems([])}
                                className="hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                Xóa tất cả
                            </button>
                        </div>
                    </>
                )}
            </div>
        )
    }
)
