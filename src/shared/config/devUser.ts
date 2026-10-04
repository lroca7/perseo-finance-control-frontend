// NOTA: mientras no exista login (HU-T.8 pendiente), se usa un userId fijo de desarrollo
// (el sembrado por la migración V2). Cuando se agregue auth, esto se reemplaza por el usuario
// resuelto del token y deja de viajar como query param. Lo usan todos los módulos.
export const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'
