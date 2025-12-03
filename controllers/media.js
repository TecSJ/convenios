const path = require("path");
const fs = require("fs");
const db = require("../config/mysql");

const formFieldMap = {
  "Acta Constitutiva": "Acta",
  "Poder del Representante Legal": "Poder",
  "Alta ante Hacienda": "AltaHacienda",
  "Identificación Oficial": "Identificacion",
  "Comprobante de Domicilio": "Comprobante",
  "Poder del Representante Legal / Nombramiento / Decreto": "Nombramiento",
  "Convenio Firmado": "ConvenioFirmado"
};

const tiposDocumentos = async (req, res) => {
    const con = await db.getConnection();
    const X_API_KEY = req.headers['api_key'];
    if (X_API_KEY !== process.env.X_API_KEY) {
        return res.status(401).json({ ok: false, msg: 'Falta api key' });
    }
    try {
        const [tipos] = await con.query("SELECT * FROM Tipos_Documentos");
        return res.status(200).json({ tipos });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, msg: 'Algo salió mal' });
    } finally {
        con.release();
    }

};

const subirDocumentos = async (req, res) => {
  try {
    const { folio, idConvenio, tipoPersona } = req.body;

    if (!folio || !idConvenio || !tipoPersona) {
      return res.status(400).json({
        message: "folio, idConvenio y tipoPersona son requeridos"
      });
    }

    const [rows] = await db.query(
      "SELECT id_Tipo_Documento, nombre FROM Tipos_Documentos WHERE owner = ?",
      [tipoPersona]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        message: `No existen documentos configurados para el tipo de persona: ${tipoPersona}`
      });
    }

    const tipoDocMap = {};
    rows.forEach((row) => {
      const campo = formFieldMap[row.nombre];
      if (campo) {
        tipoDocMap[campo] = row.id_Tipo_Documento;
      }
    });

    const files = req.files;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        message: "No se recibieron archivos"
      });
    }

    const carpetaFolio = path.join("uploads", folio.toString());
    if (!fs.existsSync(carpetaFolio)) {
      fs.mkdirSync(carpetaFolio, { recursive: true });
    }

    const inserts = [];

    for (const field in files) {
      const file = files[field][0];
      const idTipo = tipoDocMap[field];

      if (!idTipo) {
        try {
          fs.unlinkSync(file.path);
          console.log(`Archivo eliminado por campo inválido: ${file.path}`);
        } catch (err) {
          console.error("Error al eliminar archivo inválido:", err);
        }
        continue;
      }

      const rutaArchivo = path.join("uploads", folio.toString(), file.filename);

      inserts.push([idConvenio, idTipo, rutaArchivo]);
    }

    if (inserts.length === 0) {
      return res.status(400).json({
        message:
          "Ningún archivo coincide con los tipos válidos para esta persona. Archivos inválidos fueron eliminados."
      });
    }


    await db.query(
      "INSERT INTO Convenios_Anexos (id_Convenio, id_Tipo_Documento, ruta_archivo) VALUES ?",
      [inserts]
    );
    
    return res.json({
      message: "Documentos guardados exitosamente",
      documentosProcesados: inserts.length
    });

  } catch (error) {
    console.error("ERROR SUBIR DOCUMENTOS:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

const obtenerAnexos = async (req, res) => {
    const con = await db.getConnection();
    const { idConvenio } = req.params;
    const X_API_KEY = req.headers['api_key'];
    if (X_API_KEY !== process.env.X_API_KEY) {
        return res.status(401).json({ ok: false, msg: 'Falta api key' });
    }
  try {
    const [rows] = await con.query(
      `SELECT cd.id_Anexo, cd.ruta_archivo, td.nombre AS tipo_documento
      FROM Convenios_Anexos cd
      JOIN Tipos_Documentos td ON cd.id_Tipo_Documento = td.id_Tipo_Documento
       WHERE cd.id_Convenio = ?`,
      [idConvenio]
    );
    
    return res.status(201).json({ Anexos: rows });

  } catch (error) {
    console.error("ERROR OBTENER ANEXOS:", error);
    throw error;
  }finally {
        con.release();
  }
}

const deleteAnexo = async (req, res) => {
    const con = await db.getConnection();
    const { idAnexo } = req.params;
    const X_API_KEY = req.headers['api_key'];
    if (X_API_KEY !== process.env.X_API_KEY) {
        return res.status(401).json({ ok: false, msg: 'Falta api key' });
    }
  try {
    const [rows] = await con.query(
      `SELECT ruta_archivo FROM Convenios_Anexos WHERE id_Anexo = ?`,
      [idAnexo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Anexo no encontrado" });
    }

    const rutaArchivo = rows[0].ruta_archivo;

    await con.query(
      `DELETE FROM Convenios_Anexos WHERE id_Anexo = ?`,
      [idAnexo]
    );

    fs.unlink(rutaArchivo, (err) => {
      if (err) {
        console.error("Error al eliminar archivo:", err);
      } else {
        console.log(`Archivo eliminado: ${rutaArchivo}`);
      }
    });

    return res.status(200).json({ message: "Anexo eliminado exitosamente" });

  } catch (error) {
    console.error("ERROR ELIMINAR ANEXO:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  } finally {
        con.release();
  }
}

module.exports = {
  subirDocumentos,
  tiposDocumentos,
  obtenerAnexos,
  deleteAnexo
};
