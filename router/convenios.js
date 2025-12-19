const { Router } = require("express");
const { authMiddleware, ROLES } = require("../middlewares/authMiddleware");
const routerConvenios = Router();
const { draft, ActualizarDraft, obtenerConvenio, obtenerConvenios, convenioEmpresas, convenioDependencia, convenioPersona, generarPdf } = require("../controllers/convenios");


routerConvenios.get("/", authMiddleware([ROLES.Gestor, ROLES.Organizacion, ROLES.Revisor, ROLES.Director_Unidad, ROLES.Coordinador, ROLES.Director_General]), obtenerConvenios);
routerConvenios.post('/draft', draft);
routerConvenios.patch('/draft', ActualizarDraft);
routerConvenios.get('/draft/:numeroConvenio', obtenerConvenio);
routerConvenios.post('/empresa', convenioEmpresas);
routerConvenios.post('/dependencia', convenioDependencia);
routerConvenios.post('/persona', convenioPersona);
routerConvenios.post('/pdf', generarPdf);

module.exports = (app) => app.use('/convenios', routerConvenios);