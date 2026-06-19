import { Loader2 } from 'lucide-react'

export default function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
      <Loader2 size={22} className="animate-spin text-[#3730A9]" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}