const { Router } = require("express");
const { subirDocumentos, tiposDocumentos } = require('../controllers/media');
const { uploadMultipleFields } = require('../middlewares/multerMiddleware');

const routerMedia = Router();

routerMedia.post('/upload', uploadMultipleFields, subirDocumentos);
routerMedia.get('/tipos', tiposDocumentos);

module.exports = (app) => {
    app.use('/media', routerMedia);
};
