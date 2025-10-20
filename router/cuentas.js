const { Router } = require("express");
const { createCuenta, restorePass, createCuentasAdmin, obtenerCuentasOne, actualizarCuenta } = require("../controllers/cuentas");
const {authMiddleware, authMiddlewareCoordinador} = require("../middlewares/authMiddleware");
const routerCuentas = Router();

routerCuentas.patch('/',createCuenta);
routerCuentas.patch('/restore',restorePass);
routerCuentas.post('/admin', authMiddleware, createCuentasAdmin);
routerCuentas.get('/:id', authMiddlewareCoordinador, obtenerCuentasOne);
routerCuentas.put('/:id', authMiddlewareCoordinador, actualizarCuenta);

module.exports = (app) => app.use('/cuenta',routerCuentas);