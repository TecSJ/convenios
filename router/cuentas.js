const { Router } = require("express");
const { createCuenta, restorePass } = require("../controllers/cuentas");
const routerCuentas = Router();

routerCuentas.patch('/',createCuenta);
routerCuentas.patch('/restore',restorePass);

module.exports = (app) => app.use('/cuenta',routerCuentas);