import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { compact, money } from '../utils/format'

export interface ChartSeries {
  name: string
  /** Color CSS; admite variables del tema, por ejemplo 'var(--accent)'. */
  color: string
  dashed?: boolean
  dotted?: boolean
  width?: number
  /** x = mes. No hace falta que todas las series tengan los mismos meses. */
  points: { x: number; y: number }[]
}

export interface ChartMarker {
  x: number
  y: number
  label: string
  color: string
}

interface Props {
  series: ChartSeries[]
  target?: number
  targetLabel?: string
  /** Mes actual: dibuja una línea vertical "Hoy". */
  todayX?: number
  markers?: ChartMarker[]
  ariaLabel: string
  height?: number
}

/**
 * Gráfica de líneas reutilizable (Recharts). Une las series en una sola tabla de datos por mes;
 * `connectNulls` permite series con puntos dispersos (por ejemplo la proyección, con solo dos).
 */
export default function LineChart({
  series,
  target,
  targetLabel,
  todayX,
  markers = [],
  ariaLabel,
  height = 280
}: Props) {
  const xs = Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.x)))).sort((a, b) => a - b)
  const data = xs.map((x) => {
    const row: Record<string, number | undefined> = { x }
    for (const s of series) {
      const point = s.points.find((p) => p.x === x)
      if (point) row[s.name] = point.y
    }
    return row
  })

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 4 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 'dataMax']}
            allowDecimals={false}
            tickFormatter={(v: number) => `Mes ${v}`}
            stroke="var(--muted)"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            width={62}
            domain={[0, 'auto']}
            tickFormatter={(v: number) => compact(v)}
            stroke="var(--muted)"
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => money(Number(value))}
            labelFormatter={(label) => `Mes ${label}`}
            contentStyle={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 12
            }}
            labelStyle={{ color: 'var(--muted)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />

          {target != null && (
            <ReferenceLine
              y={target}
              stroke="var(--good)"
              strokeDasharray="6 4"
              label={{ value: targetLabel ?? 'Meta', position: 'insideTopLeft', fill: 'var(--good)', fontSize: 11 }}
            />
          )}
          {todayX != null && todayX > 0 && (
            <ReferenceLine
              x={todayX}
              stroke="var(--muted)"
              label={{ value: 'Hoy', position: 'insideTopRight', fill: 'var(--muted)', fontSize: 11 }}
            />
          )}

          {series.map((s) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={s.color}
              strokeWidth={s.width ?? 2}
              strokeDasharray={s.dashed ? '6 4' : s.dotted ? '2 4' : undefined}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}

          {markers.map((m) => (
            <ReferenceDot
              key={`${m.label}-${m.x}`}
              x={m.x}
              y={m.y}
              r={5}
              fill={m.color}
              stroke="none"
              label={{ value: m.label, position: 'bottom', fill: m.color, fontSize: 11 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
