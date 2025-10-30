const { Router } = require("express");
const { draft, ActualizarDraft } = require("../controllers/convenios");

const routerConvenios = Router();

routerConvenios.post('/draft', draft);
routerConvenios.patch('/draft', ActualizarDraft);

module.exports = (app) => app.use('/convenios', routerConvenios);