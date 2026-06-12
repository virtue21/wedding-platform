type Props = {
  icon: string
  title: string
  body: string
  tip?: string
}

export default function SectionGuide({ icon, title, body, tip }: Props) {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 flex gap-3 mb-6">
      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
      <div className="text-sm">
        <p className="font-medium text-stone-700">{title}</p>
        <p className="text-stone-500 mt-0.5 leading-relaxed">{body}</p>
        {tip && (
          <p className="text-amber-600 mt-1.5 text-xs font-medium">💡 {tip}</p>
        )}
      </div>
    </div>
  )
}
