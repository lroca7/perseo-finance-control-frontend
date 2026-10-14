import { useEffect, useState } from 'react'

/** dd/mm/aaaa -> ISO (o null si no es una fecha válida). */
export function displayToIso(text: string): string | null {
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2])
  const y = Number(m[3])
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

/** ISO -> dd/mm/aaaa (o '' si no aplica). */
export function isoToDisplay(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

interface Props {
  id?: string
  value: string // ISO yyyy-mm-dd o ''
  onChange: (iso: string) => void
  ariaLabel: string
  /** Avisa si el texto es inválido (no vacío). Sirve para bloquear el guardado. */
  onInvalid?: (invalido: boolean) => void
}

/**
 * Campo de fecha con formato fijo dd/mm/aaaa (el input nativo muestra el orden
 * según el idioma del navegador y no se puede forzar). Escribe solo dígitos;
 * las barras se ponen solas. Vacío o inválido reporta ''.
 */
export default function DateField({ id, value, onChange, ariaLabel, onInvalid }: Props) {
  const [text, setText] = useState(() => isoToDisplay(value))

  useEffect(() => {
    // Solo cuando el valor externo cambia (limpiar, editar): si el texto actual
    // ya representa ese valor se conserva (no interrumpe la escritura).
    if (displayToIso(text) !== value) {
      setText(isoToDisplay(value))
      onInvalid?.(false)
    }
  }, [value])

  const invalido = text !== '' && displayToIso(text) === null

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="dd/mm/aaaa"
      aria-label={ariaLabel}
      aria-invalid={invalido || undefined}
      title="Formato dd/mm/aaaa"
      value={text}
      maxLength={10}
      onChange={(e) => {
        const digitos = e.target.value.replace(/\D/g, '').slice(0, 8)
        let t = digitos
        if (digitos.length > 4) t = `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
        else if (digitos.length > 2) t = `${digitos.slice(0, 2)}/${digitos.slice(2)}`
        setText(t)
        onChange(displayToIso(t) ?? '')
        onInvalid?.(t !== '' && displayToIso(t) === null)
      }}
      style={invalido ? { borderColor: 'var(--bad)' } : undefined}
    />
  )
}
