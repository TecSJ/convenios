const { Router } = require("express");
const { draft, ActualizarDraft, obtenerConvenio } = require("../controllers/convenios");

const routerConvenios = Router();

routerConvenios.post('/draft', draft);
routerConvenios.patch('/draft', ActualizarDraft);
routerConvenios.get('/draft/:numeroConvenio', obtenerConvenio);

module.exports = (app) => app.use('/convenios', routerConvenios);