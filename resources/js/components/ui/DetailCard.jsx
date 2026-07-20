import React from "react"

export default function DetailCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</h4>
      {children}
    </div>
  )
}