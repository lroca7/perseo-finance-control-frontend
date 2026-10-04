import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cardsApi } from '../api/endpoints'
import type { CardResponse } from '../api/types'
import { fmt } from '../../../shared/utils/format'
import { ApiError } from '../../../shared/api/client'

export default function CardsPage() {
  const [cards, setCards] = useState<CardResponse[]>([])
  const [estimados, setEstimados] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [banco, setBanco] = useState('')
  const [alias, setAlias] = useState('')
  const [cupoTotal, setCupoTotal] = useState('')
  const [tasaEA, setTasaEA] = useState('')
  const [cargosFijosMensuales, setCargosFijosMensuales] = useState('')

  const cargar = () => {
    setLoading(true)
    cardsApi
      .listar()
      .then((lista) => {
        setCards(lista)
        // El estimado se pide aparte: es un cálculo bajo demanda que nunca
        // se guarda, no un campo del listado de tarjetas.
        lista.forEach((c) => {
          cardsApi
            .estimarMes(c.id)
            .then((est) => setEstimados((prev) => ({ ...prev, [c.id]: est.total })))
            .catch(() => { /* si falla el estimado de una tarjeta, no rompe el listado */ })
        })
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const eliminarTarjeta = async (id: string, alias: string) => {
    if (!window.confirm(`¿Eliminar "${alias}"? Esto borra también todas sus líneas de crédito y abonos.`)) return
    try {
      await cardsApi.eliminar(id)
      cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo eliminar la tarjeta')
    }
  }

  const crear = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await cardsApi.crear({
        banco,
        alias,
        cupoTotal: Number(cupoTotal) || 0,
        tasaEA: Number(tasaEA) || 0,
        cargosFijosMensuales: Number(cargosFijosMensuales) || 0
      })
      setBanco('')
      setAlias('')
      setCupoTotal('')
      setTasaEA('')
      setCargosFijosMensuales('')
      setShowForm(false)
      cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear la tarjeta')
    }
  }

  return (
    <div>
      <div className="panel">
        <h2 style={{ fontSize: 15.5, marginBottom: 10 }}>Tus tarjetas</h2>

        {loading && <p className="muted">Cargando…</p>}
        {error && <div className="warning">⚠ {error}</div>}

        {!loading && cards.length === 0 && (
          <p className="muted">
            Todavía no tienes tarjetas cargadas. Agrega la primera para empezar a simular.
          </p>
        )}

        <div className="overflow">
          {cards.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Banco</th>
                  <th>Tarjeta</th>
                  <th className="num">Cupo total</th>
                  <th className="num">Tasa E.A.</th>
                  <th className="num">Saldo en líneas</th>
                  <th className="num">Aprox. este mes</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id}>
                    <td>{c.banco}</td>
                    <td>{c.alias}</td>
                    <td className="num">{fmt(c.cupoTotal)}</td>
                    <td className="num">{c.tasaEA}%</td>
                    <td className="num">{fmt(c.saldoTotalLineas)}</td>
                    <td className="num">{estimados[c.id] != null ? fmt(estimados[c.id]) : '…'}</td>
                    <td>
                      <Link to={`/cards/${c.id}`}>Ver líneas →</Link>
                    </td>
                    <td>
                      <button className="remove" onClick={() => eliminarTarjeta(c.id, c.alias)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          {!showForm ? (
            <button className="ghost" onClick={() => setShowForm(true)}>
              + Agregar tarjeta
            </button>
          ) : (
            <form onSubmit={crear}>
              <div className="field">
                <label>Banco</label>
                <input value={banco} onChange={(e) => setBanco(e.target.value)} required />
              </div>
              <div className="field">
                <label>Alias / últimos dígitos</label>
                <input
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Visa Platinum ****7460"
                  required
                />
              </div>
              <div className="field">
                <label>Cupo total</label>
                <input
                  type="number"
                  value={cupoTotal}
                  onChange={(e) => setCupoTotal(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Tasa E.A. %</label>
                <input
                  type="number"
                  step="0.01"
                  value={tasaEA}
                  onChange={(e) => setTasaEA(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Cargos fijos mensuales (manejo + seguro, etc.)</label>
                <input
                  type="number"
                  value={cargosFijosMensuales}
                  onChange={(e) => setCargosFijosMensuales(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="primary">Guardar</button>
                <button type="button" className="ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
