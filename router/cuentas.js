const { Router } = require("express");
const { createCuenta, restorePass, createCuentasAdmin, obtenerCuentasOne, actualizarCuenta, actualizarEstado, obtenerCuentas } = require("../controllers/cuentas");
const { authMiddleware, ROLES } = require("../middlewares/authMiddleware");
const routerCuentas = Router();

routerCuentas.patch('/',createCuenta);
routerCuentas.patch('/restore',restorePass);
routerCuentas.post('/admin', authMiddleware(), createCuentasAdmin);
routerCuentas.get('/convenios', authMiddleware([ROLES.COORDINADOR]), obtenerCuentas);
routerCuentas.get('/:id', authMiddleware([ROLES.COORDINADOR]), obtenerCuentasOne);
routerCuentas.patch('/:id', authMiddleware([ROLES.COORDINADOR]), actualizarCuenta);
routerCuentas.delete('/:id/:status', authMiddleware([ROLES.COORDINADOR]), actualizarEstado);

module.exports = (app) => app.use('/cuenta',routerCuentas);