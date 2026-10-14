/** MigraciÃ³n de octubre 2026 desde el Excel (generado por script, no editar a mano). */
export interface GastoMigrado { fecha: string; valor: number; categoria: string; descripcion: string }

export const MIGRACION_ANIO = 2026;
export const MIGRACION_MES = 10;

export const MIGRACION_CATEGORIAS: string[] = ["Supermercado", "Domicilios", "Arriendo", "Transporte", "Medicinas", "Casa", "Lucy", "Compras", "Entretenimiento", "Regalos", "Viajes", "Peluqueria", "Mascotas", "Veterinaria", "Otros", "Aseo Personal", "Paseos", "Donaciones", "Prestamos", "Tienda", "Bancarios", "Tarjetazo", "Emprendimientos"];

export const MIGRACION_GASTOS: GastoMigrado[] = [
  {
    "fecha": "2026-10-02",
    "valor": 55000,
    "categoria": "Regalos",
    "descripcion": "Cumple Fabian"
  },
  {
    "fecha": "2026-10-02",
    "valor": 84800,
    "categoria": "Compras",
    "descripcion": "Shorts"
  },
  {
    "fecha": "2026-10-02",
    "valor": 56000,
    "categoria": "Supermercado",
    "descripcion": "Exito"
  },
  {
    "fecha": "2026-10-04",
    "valor": 30000,
    "categoria": "Supermercado",
    "descripcion": "Mercado Campesino"
  },
  {
    "fecha": "2026-10-03",
    "valor": 120000,
    "categoria": "Domicilios",
    "descripcion": "Frisby"
  },
  {
    "fecha": "2026-10-06",
    "valor": 32000,
    "categoria": "Compras",
    "descripcion": "Mermeladas"
  },
  {
    "fecha": "2026-10-06",
    "valor": 100000,
    "categoria": "Compras",
    "descripcion": "Cayetana"
  },
  {
    "fecha": "2026-10-07",
    "valor": 130000,
    "categoria": "Lucy",
    "descripcion": "Sandalias"
  },
  {
    "fecha": "2026-10-09",
    "valor": 10000,
    "categoria": "Compras",
    "descripcion": "Boletas"
  },
  {
    "fecha": "2026-10-09",
    "valor": 20000,
    "categoria": "Compras",
    "descripcion": "Paletas Chechi"
  },
  {
    "fecha": "2026-10-10",
    "valor": 50000,
    "categoria": "Domicilios",
    "descripcion": "LasaÃ±as"
  },
  {
    "fecha": "2026-10-10",
    "valor": 90000,
    "categoria": "Lucy",
    "descripcion": "Medicina"
  },
  {
    "fecha": "2026-10-10",
    "valor": 80000,
    "categoria": "Aseo Personal",
    "descripcion": "Shampoo / Tratamiento"
  },
  {
    "fecha": "2026-10-11",
    "valor": 10000,
    "categoria": "Compras",
    "descripcion": "Parqueo Chicharrones"
  },
  {
    "fecha": "2026-10-11",
    "valor": 20000,
    "categoria": "Compras",
    "descripcion": "Sodas Chicharrones"
  },
  {
    "fecha": "2026-10-11",
    "valor": 4000,
    "categoria": "Compras",
    "descripcion": "Entradas F Patacon"
  },
  {
    "fecha": "2026-10-11",
    "valor": 40000,
    "categoria": "Compras",
    "descripcion": "Patacones"
  },
  {
    "fecha": "2026-10-11",
    "valor": 18000,
    "categoria": "Compras",
    "descripcion": "Patacones"
  },
  {
    "fecha": "2026-10-11",
    "valor": 5000,
    "categoria": "Compras",
    "descripcion": "Parqueo Patacones"
  },
  {
    "fecha": "2026-10-12",
    "valor": 50000,
    "categoria": "Mascotas",
    "descripcion": "Apoyo Apolo"
  }
];

export const MIGRACION_TOTAL = 1004800;

/** Bloques de octubre 2026 (ingresos, facturas, ahorro, deudas). Solo filas con datos. */
export interface MigracionIngreso { categoria: string; fecha: string | null; proyectado: number | null; recibido: number | null }
export interface MigracionFactura { categoria: string; fecha: string | null; valor: number | null; pagado: boolean; valorPagado: number | null }
export interface MigracionAhorro { nombre: string; meta: number | null; ahorrado: number | null }
export interface MigracionDeuda { nombre: string; pendiente: number | null; pagado: number | null }

export const MIGRACION_INGRESOS: MigracionIngreso[] = [
  { categoria: "Salario", fecha: null, proyectado: null, recibido: 2100000 },
];

export const MIGRACION_FACTURAS: MigracionFactura[] = [
  { categoria: "Agua", fecha: null, valor: null, pagado: false, valorPagado: 335000 },
  { categoria: "Aportes en Linea", fecha: null, valor: null, pagado: false, valorPagado: 574000 },
];

export const MIGRACION_AHORROS: MigracionAhorro[] = [
  { nombre: "RGC", meta: null, ahorrado: 989778 },
  { nombre: "Global", meta: null, ahorrado: 50000 },
];

export const MIGRACION_DEUDAS: MigracionDeuda[] = [
  { nombre: "TC Falabella", pendiente: null, pagado: 300000 },
  { nombre: "TC Bancolombia", pendiente: null, pagado: 316000 },
  { nombre: "Carro", pendiente: null, pagado: 650000 },
];
