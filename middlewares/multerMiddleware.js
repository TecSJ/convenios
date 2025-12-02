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
  { name: "acta", maxCount: 1 },                   // Acta constitutiva
  { name: "poder", maxCount: 1 },                  // Poder del representante
  { name: "altaHacienda", maxCount: 1 },           // CSF / Alta ante hacienda
  { name: "identificacion", maxCount: 1 },         // INE
  { name: "comprobante", maxCount: 1 },            // Comprobante domicilio
  { name: "convenioFirmado", maxCount: 1 },        // Convenio firmado
  { name: "nombramiento", maxCount: 1 },        // Convenio firmado
]);
