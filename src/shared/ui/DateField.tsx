interface Props {
  id?: string
  value: string // ISO yyyy-mm-dd o ''
  onChange: (iso: string) => void
  ariaLabel: string
  /** Se conserva por compatibilidad; el picker nativo siempre entrega fecha válida o vacío. */
  onInvalid?: (invalido: boolean) => void
}

/**
 * Selector de fecha con el calendario nativo del navegador.
 * Entrega ISO yyyy-mm-dd (o '' si se limpia). El formato visible
 * lo decide el idioma del navegador (en español: dd/mm/aaaa).
 */
export default function DateField({ id, value, onChange, ariaLabel, onInvalid }: Props) {
  return (
    <input
      id={id}
      type="date"
      aria-label={ariaLabel}
      value={value}
      min="2000-01-01"
      max="2100-12-31"
      autoComplete="off"
      onChange={(e) => {
        onChange(e.target.value)
        onInvalid?.(false)
      }}
    />
  )
}
