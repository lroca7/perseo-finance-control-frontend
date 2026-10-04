interface Props {
  label: string
  value: string
  tone?: 'good' | 'bad' | 'accent'
  hint?: string
}

export default function MetricCard({ label, value, tone, hint }: Props) {
  return (
    <div className={`sv-metric${tone ? ` sv-tone-${tone}` : ''}`}>
      <div className="sv-metric-label">{label}</div>
      <div className="sv-metric-value">{value}</div>
      {hint && <div className="sv-metric-hint">{hint}</div>}
    </div>
  )
}
