const { Router } = require("express");
const { authMiddleware, ROLES } = require("../middlewares/authMiddleware");
const routerConvenios = Router();
const { draft, ActualizarDraft, obtenerConvenio, obtenerConvenios } = require("../controllers/convenios");


routerConvenios.get("/", authMiddleware([ROLES.Gestor, ROLES.Organizacion, ROLES.Revisor, ROLES.Director_Unidad, ROLES.Coordinador, ROLES.Director_General]), obtenerConvenios);
routerConvenios.post('/draft', draft);
routerConvenios.patch('/draft', ActualizarDraft);
routerConvenios.get('/draft/:numeroConvenio', obtenerConvenio);

module.exports = (app) => app.use('/convenios', routerConvenios);