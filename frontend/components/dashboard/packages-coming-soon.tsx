"use client"

import React from "react"

export default function PackagesComingSoon() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/3 p-12 backdrop-blur flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-center max-w-2xl">
        {/* Icon */}
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE5B4]/20 to-[#FFB56D]/20 border border-[#FFE5B4]/30">
          <svg 
            className="h-10 w-10 text-[#FFE5B4]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="mb-4 text-3xl font-semibold text-white">
          Package tours are being refined
        </h3>

        {/* Description */}
        <p className="mb-8 text-base text-[#D0D7D8] leading-relaxed">
          We are crafting curated journeys designed around your passions.
        </p>

        {/* Additional info */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-[#A5ABA3] mb-4">
            Our team is carefully curating pre-designed travel bundles that combine the best of Vietnam's experiences. These packages will offer seamless booking with optimal pricing.
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-[#FFE5B4]">
            <svg className="h-4 w-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Coming soon
          </div>
        </div>
      </div>
    </div>
  )
}

