const { Router } = require("express");
const { authMiddleware, ROLES } = require("../middlewares/authMiddleware");
const { registrarOrganizacion } = require("../controllers/organizaciones");

const routerOrganizacion = Router();

routerOrganizacion.post('/', authMiddleware([ROLES.Gestor, ROLES.Organizacion, ROLES.Director_Unidad, ROLES.Coordinador, ROLES.Director_General]), registrarOrganizacion);

module.exports = (app) => app.use('/organizacion', routerOrganizacion);