import multer from "multer";
import fs from "fs";
import path from "path";

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folio = req.body.folio;

    if (!folio) {
      return cb(new Error("No se proporcionó folio en la solicitud."), null);
    }

    const folder = `uploads/${folio}`;
    ensureDirectoryExists(folder);

    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Tipo de archivo no permitido"), false);
};

export const uploadMultipleFields = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
}).fields([
  { name: "Acta", maxCount: 1 },                   // Acta constitutiva
  { name: "Poder", maxCount: 1 },                  // Poder del representante
  { name: "AltaHacienda", maxCount: 1 },           // CSF / Alta ante hacienda
  { name: "Identificacion", maxCount: 1 },         // INE
  { name: "Comprobante", maxCount: 1 },            // Comprobante domicilio
  { name: "ConvenioFirmado", maxCount: 1 },        // Convenio firmado
  { name: "Nombramiento", maxCount: 1 },        // Convenio firmado
]);
