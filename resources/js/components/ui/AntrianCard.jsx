import React from "react"

export default function AntrianCard({ id, name, bidang, jenis, tanggal, isActive, onClick, children }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3 transition-all ${
        onClick ? "cursor-pointer" : ""
      } ${
        isActive
          ? "border-orange-200 bg-orange-50/30"
          : "border-gray-100 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-orange-500"></span>
        <span className="text-[10px] font-medium text-gray-400">{id}</span>
      </div>
      <p className="mt-1 text-xs font-bold text-blue-600">{name}</p>
      <p className="text-[10px] text-gray-400 truncate">{bidang}</p>
      <p className="text-[10px] text-gray-400">{jenis} · {tanggal}</p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}   