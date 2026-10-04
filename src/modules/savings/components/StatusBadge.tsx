import { STATUS_CLASS, STATUS_LABEL } from '../labels'
import type { GoalTrackingStatus } from '../api/types'

export default function StatusBadge({ status }: { status: GoalTrackingStatus }) {
  return <span className={`sv-badge sv-${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
}
