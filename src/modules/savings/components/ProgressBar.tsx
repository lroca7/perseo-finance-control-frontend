import { STATUS_CLASS } from '../labels'
import type { GoalTrackingStatus } from '../api/types'

interface Props {
  /** Fracción 0..1 (por encima de 1 se recorta visualmente). */
  value: number
  status: GoalTrackingStatus
}

export default function ProgressBar({ value, status }: Props) {
  const width = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      className="sv-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <div className={`sv-progress-fill sv-${STATUS_CLASS[status]}`} style={{ width: `${width}%` }} />
    </div>
  )
}
