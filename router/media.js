const { Router } = require("express");
const { subirDocumentos, tiposDocumentos, obtenerAnexos } = require('../controllers/media');
const { uploadMultipleFields } = require('../middlewares/multerMiddleware');

const routerMedia = Router();

routerMedia.post('/upload', uploadMultipleFields, subirDocumentos);
routerMedia.get('/tipos', tiposDocumentos);
routerMedia.get('/anexos/:idConvenio', obtenerAnexos);

module.exports = (app) => {
    app.use('/media', routerMedia);
};
