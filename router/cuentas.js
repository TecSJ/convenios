const { Router } = require("express");
const { createCuenta, restorePass, createCuentasAdmin, obtenerCuentasOne, actualizarCuenta, actualizarEstado } = require("../controllers/cuentas");
const {authMiddleware, authMiddlewareCoordinador} = require("../middlewares/authMiddleware");
const routerCuentas = Router();

routerCuentas.patch('/',createCuenta);
routerCuentas.patch('/restore',restorePass);
routerCuentas.post('/admin', authMiddleware, createCuentasAdmin);
routerCuentas.get('/:id', authMiddlewareCoordinador, obtenerCuentasOne);
routerCuentas.put('/:id', authMiddlewareCoordinador, actualizarCuenta);
routerCuentas.delete('/:id/:status', authMiddlewareCoordinador, actualizarEstado);

module.exports = (app) => app.use('/cuenta',routerCuentas);