const { Router } = require("express");
const { authMiddleware, ROLES } = require("../middlewares/authMiddleware");
const { obtenerConvenios } = require("../controllers/convenio");
const routerConvenios = Router();


routerConvenios.get("/", authMiddleware([ROLES.Gestor, ROLES.Organizacion, ROLES.Revisor, ROLES.Director_Unidad, ROLES.Coordinador, ROLES.Director_General]), obtenerConvenios);

module.exports = (app) => app.use('/convenios',routerConvenios);