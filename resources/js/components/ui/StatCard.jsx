import React from "react"

export default function StatCard({ icon: Icon, value, title, subtitle, badgeText, badgeColor }) {
  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {badgeText && (
        <span className={`absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-medium ${badgeColor}`}>
          {badgeText}
        </span>
      )}
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}