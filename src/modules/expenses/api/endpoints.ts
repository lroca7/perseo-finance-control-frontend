import { api } from '../../../shared/api/client'
import type { ExpenseCategory, ExpenseItem, ExpenseMonth, ImportResult } from './types'

export const expensesApi = {
  categories: {
    list: (userId: string) => api.get<ExpenseCategory[]>(`/expenses/categories?userId=${userId}`),
    create: (userId: string, nombre: string) =>
      api.post<ExpenseCategory>(`/expenses/categories?userId=${userId}`, { nombre }),
    update: (userId: string, id: string, nombre: string, activa: boolean) =>
      api.put<ExpenseCategory>(`/expenses/categories/${id}?userId=${userId}`, { nombre, activa }),
    remove: (userId: string, id: string) =>
      api.delete<void>(`/expenses/categories/${id}?userId=${userId}`)
  },
  billCategories: {
    list: (userId: string) => api.get<ExpenseCategory[]>(`/expenses/bill-categories?userId=${userId}`),
    create: (userId: string, nombre: string) =>
      api.post<ExpenseCategory>(`/expenses/bill-categories?userId=${userId}`, { nombre }),
    update: (userId: string, id: string, nombre: string, activa: boolean) =>
      api.put<ExpenseCategory>(`/expenses/bill-categories/${id}?userId=${userId}`, { nombre, activa }),
    remove: (userId: string, id: string) =>
      api.delete<void>(`/expenses/bill-categories/${id}?userId=${userId}`)
  },
  months: {
    get: (userId: string, anio: number, mes: number) =>
      api.get<ExpenseMonth>(`/expenses/months/${anio}/${mes}?userId=${userId}`),
    saveBudgets: (userId: string, anio: number, mes: number, presupuestos: Record<string, number | null>) =>
      api.put<ExpenseMonth>(`/expenses/months/${anio}/${mes}/budgets?userId=${userId}`, { presupuestos }),
    saveIncomes: (
      userId: string,
      anio: number,
      mes: number,
      ingresos: Array<{ categoria: string; fecha: string | null; proyectado: number | null; recibido: number | null }>
    ) => api.put<ExpenseMonth>(`/expenses/months/${anio}/${mes}/incomes?userId=${userId}`, { ingresos }),
    saveBills: (
      userId: string,
      anio: number,
      mes: number,
      facturas: Array<{
        categoriaId: string
        fecha: string | null
        valor: number | null
        pagado: boolean
        valorPagado: number | null
      }>
    ) => api.put<ExpenseMonth>(`/expenses/months/${anio}/${mes}/bills?userId=${userId}`, { facturas }),
    saveSavings: (
      userId: string,
      anio: number,
      mes: number,
      ahorros: Array<{ nombre: string; meta: number | null; ahorrado: number | null }>
    ) => api.put<ExpenseMonth>(`/expenses/months/${anio}/${mes}/month-savings?userId=${userId}`, { ahorros }),
    saveDebts: (
      userId: string,
      anio: number,
      mes: number,
      deudas: Array<{ nombre: string; pendiente: number | null; pagado: number | null }>
    ) => api.put<ExpenseMonth>(`/expenses/months/${anio}/${mes}/month-debts?userId=${userId}`, { deudas }),
    createExpense: (
      userId: string,
      anio: number,
      mes: number,
      body: { fecha: string; valor: number; categoriaId: string; descripcion: string }
    ) => api.post<ExpenseItem>(`/expenses/months/${anio}/${mes}/expenses?userId=${userId}`, body),
    importMonth: (
      userId: string,
      anio: number,
      mes: number,
      body: {
        gastos: Array<{ fecha: string; valor: number; categoria: string; descripcion: string }>
        ingresos: Array<{ categoria: string; fecha: string | null; proyectado: number | null; recibido: number | null }>
        facturas: Array<{
          categoria: string
          fecha: string | null
          valor: number | null
          pagado: boolean
          valorPagado: number | null
        }>
        ahorro: Array<{ nombre: string; meta: number | null; ahorrado: number | null }>
        deudas: Array<{ nombre: string; pendiente: number | null; pagado: number | null }>
      },
      forzar = false
    ) =>
      api.post<ImportResult>(
        `/expenses/months/${anio}/${mes}/import?userId=${userId}&forzar=${forzar}`,
        body
      )
  },
  expenses: {
    update: (
      userId: string,
      id: string,
      body: { fecha: string; valor: number; categoriaId: string; descripcion: string }
    ) => api.put<ExpenseItem>(`/expenses/expenses/${id}?userId=${userId}`, body),
    remove: (userId: string, id: string) =>
      api.delete<void>(`/expenses/expenses/${id}?userId=${userId}`)
  }
}
