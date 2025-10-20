const { Router } = require("express");
const { createCuenta, restorePass, createCuentasAdmin } = require("../controllers/cuentas");
const authMiddleware = require("../middlewares/authMiddleware");
const routerCuentas = Router();

routerCuentas.patch('/',createCuenta);
routerCuentas.patch('/restore',restorePass);
routerCuentas.post('/admin', authMiddleware, createCuentasAdmin);

module.exports = (app) => app.use('/cuenta',routerCuentas);