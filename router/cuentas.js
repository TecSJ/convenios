const { Router } = require("express");
const { createCuenta, restorePass, createCuentasAdmin, obtenerCuentasOne, actualizarCuenta, actualizarEstado, obtenerCuentas } = require("../controllers/cuentas");
const { authMiddleware, ROLES } = require("../middlewares/authMiddleware");
const routerCuentas = Router();

routerCuentas.patch('/',createCuenta);
routerCuentas.patch('/restore',restorePass);
routerCuentas.post('/admin', authMiddleware(), createCuentasAdmin);
routerCuentas.get('/convenios', authMiddleware([ROLES.Coordinador]), obtenerCuentas);
routerCuentas.get('/:id', authMiddleware([ROLES.Coordinador]), obtenerCuentasOne);
routerCuentas.patch('/:id', authMiddleware([ROLES.Coordinador]), actualizarCuenta);
routerCuentas.delete('/:id/:status', authMiddleware([ROLES.Coordinador]), actualizarEstado);

module.exports = (app) => app.use('/cuenta',routerCuentas);