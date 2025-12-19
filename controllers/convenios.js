const db = require("../config/mysql");
const fs = require("fs");
const handlebars = require('handlebars');
const puppeteer = require('puppeteer');

const draft = async (req, res) => {
    const con = await db.getConnection();
    const {numero_convenio, id_Creador_Cuenta, id_Unidad_Academica, tipo_Convenio, fecha_Inicio, fecha_Fin} = req.body;

    try {
        //validacion de folio
        const [existingConvenio] = await con.query(
            "SELECT * FROM Convenios WHERE numero_Convenio = ?",
            [numero_convenio]
        );

        if (existingConvenio.length > 0) {
            return res.status(409).json({ ok: false, msg: "El convenio ya existe" });
        }

        //validacion de unidad academica
        const [existingUnidad] = await con.query(
            "SELECT * FROM Unidades_Academicas WHERE id_Unidad_Academica = ?",
            [id_Unidad_Academica]
        );

        if (existingUnidad.length < 1) {
            return res.status(409).json({ ok: false, msg: "La unidad no existe" });
        }

        //validacion de cuenta
        const [existingCuenta] = await con.query(
            "SELECT * FROM Cuentas WHERE id_Cuenta = ?",
            [id_Creador_Cuenta]
        );

        if (existingCuenta.length < 1) {
            return res.status(409).json({ ok: false, msg: "La cuenta de creador no existe" });
        }

        const [result] = await con.query(
            "INSERT INTO Convenios(numero_Convenio, id_Unidad_Academica, id_Creador_Cuenta, tipo_Convenio, estado, fecha_Inicio, fecha_Fin, ultimo_paso) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [numero_convenio, id_Unidad_Academica, id_Creador_Cuenta, tipo_Convenio, "Incompleto", fecha_Inicio, fecha_Fin, 1]
        );

        return res.status(201).json({ ok: true, msg: "Convenio creado con exitosamente" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, msg: 'Algo salió mal' });
    } finally {
        con.release();
    }
}

const ActualizarDraft = async (req, res) => {
    const con = await db.getConnection();
    const {numero_convenio, id_Organizacion, estado, contenido_Personalizado, ultimo_paso} = req.body;

    try {
        //validacion de folio
        const [existingConvenio] = await con.query(
            "SELECT * FROM Convenios WHERE numero_Convenio = ?",
            [numero_convenio]
        );

        if (existingConvenio.length < 1) {
            return res.status(409).json({ ok: false, msg: "El convenio no existe" });
        }

        if(ultimo_paso === undefined){
            return res.status(409).json({ ok: false, msg: "se requiere último paso" });
        }

        if(id_Organizacion !== undefined){
            const [existingOrganizacion] = await con.query(
                "SELECT * FROM Organizaciones WHERE id_Organizacion = ?",
                [id_Organizacion]
            );
            
            if(existingOrganizacion.length < 1) return res.status(409).json({ ok: false, msg: "La organizacion no existe" });

            await con.query(
                "UPDATE Convenios SET id_Organizacion = ? WHERE numero_convenio = ?",
                [id_Organizacion, numero_convenio]
            );
        }

        if(estado !== undefined){
            await con.query(
                "UPDATE Convenios SET estado = ? WHERE numero_convenio = ?",
                [estado, numero_convenio]
            );
        }

        if(contenido_Personalizado !== undefined){
            await con.query(
                "UPDATE Convenios SET contenido_Personalizado = ? WHERE numero_convenio = ?",
                [contenido_Personalizado, numero_convenio]
            );
        }

        await con.query(
            "UPDATE Convenios SET ultimo_paso = ? WHERE numero_convenio = ?",
            [ultimo_paso, numero_convenio]
        );

        return res.status(201).json({ ok: true, msg: 'convenio actualizado exitosamente' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, msg: 'Algo salió mal' });
    } finally {
        con.release();
    }
}

const obtenerConvenio = async (req, res) => {
    const {numeroConvenio} = req.params;
    const con = await db.getConnection();
    try {
        //validacion de folio
        const [existingConvenio] = await con.query(
            "SELECT * FROM Convenios WHERE numero_Convenio = ?",
            [numeroConvenio]
        );

        if (existingConvenio.length < 1) {
            return res.status(409).json({ ok: false, msg: "El convenio no existe" });
        }

        return res.status(201).json({ ok: true, convenio: existingConvenio });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, msg: 'Algo salió mal' });
    } finally {
        con.release();
    }
}

const obtenerConvenios = async (req, res) => {
    const { rol, id_Cuenta, rfc, id_Unidad_Academica } = req.user; 
    
    const con = await db.getConnection();
    
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 10;

        const offset = (page - 1) * limit;

        let countQueryBase = "SELECT COUNT(*) AS total FROM Convenios C INNER JOIN Unidades_Academicas UA ON UA.id_Unidad_Academica = C.id_Unidad_Academica INNER JOIN Organizaciones O ON O.id_Organizacion = C.id_Organizacion";
        let dataQueryBase = `
            SELECT 
                C.*,
                DATE_FORMAT(C.fecha_Inicio, '%Y-%m-%d') AS fecha_Inicio,
                UA.nombre AS unidad,
                O.nombre_Legal AS nombre_Organizacion,
                CASE WHEN COUNT(CA.id_Anexo) > 0 THEN 1 ELSE 0 END AS documentos
            FROM Convenios C
            INNER JOIN Unidades_Academicas UA ON UA.id_Unidad_Academica = C.id_Unidad_Academica
            INNER JOIN Organizaciones O ON O.id_Organizacion = C.id_Organizacion
            LEFT JOIN Convenios_Anexos CA ON CA.id_Convenio = C.id_Convenio
        `;
        let queryParams = [];
        let whereClause = "";

        switch (rol) {
            case 'Gestor':
                whereClause = " WHERE C.id_Creador_Cuenta = ?";
                queryParams.push(id_Cuenta);
                break;

            case 'Organización':
                whereClause = " WHERE C.id_Creador_Cuenta = ? OR O.rfc = ?";
                queryParams.push(id_Cuenta, rfc);
                break;
            
            case 'Revisor':
                whereClause = " WHERE C.id_Creador_Cuenta = ? OR C.id_Unidad_Academica = ?";
                queryParams.push(id_Cuenta, id_Unidad_Academica);
                break;

            case 'Director Unidad':
                whereClause = " WHERE C.id_Unidad_Academica = ?";
                queryParams.push(id_Unidad_Academica);
                break;
            
            case 'Coordinador':
            case 'Director General':
                break;
                
            default:
                return res.status(403).json({ message: 'Acceso denegado. Rol no autorizado para esta acción.' });
        }
        const [countResult] = await con.query(countQueryBase + whereClause, queryParams);
        const total = countResult[0].total;

        let dataQuery = dataQueryBase + whereClause + `
            GROUP BY
                C.id_Convenio,
                C.fecha_Inicio,
                C.fecha_Fin,
                UA.nombre,
                O.nombre_Legal
            ORDER BY C.id_Convenio DESC LIMIT ? OFFSET ?
        `;
        
        let dataQueryParams = [...queryParams, limit, offset];

        const [convenios] = await con.query(dataQuery, dataQueryParams);

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            total,
            page,
            totalPages,
            limit,
            data: convenios,
        });

    } catch (err) {
        console.error("Error en obtenerConvenios:", err);
        return res.status(500).json({ ok: false, msg: "Algo salió mal al obtener los convenios" });
    } finally {
        con.release();
    }
};

const convenioEmpresas = async (req, res) => {
    const source = fs.readFileSync('./formatos/empresa.html').toString();
    const sinSaltosDeLinea = source.replace(/\n/g, '');
    
    const template = handlebars.compile(sinSaltosDeLinea);
    const htmlToSend = template(req.body);

    res.status(200).json({ok: true, html: htmlToSend});
}

const convenioDependencia = async (req, res) => {
    const source = fs.readFileSync('./formatos/dependencia.html').toString();

    const sinSaltosDeLinea = source.replace(/\n/g, '');
    const template = handlebars.compile(sinSaltosDeLinea);
    const htmlToSend = template(req.body);
    
    res.status(200).json({ok: true, html: htmlToSend});
}

const convenioPersona = async (req, res) => {
    const source = fs.readFileSync('./formatos/persona.html').toString();
    
    const sinSaltosDeLinea = source.replace(/\n/g, '');
    const template = handlebars.compile(sinSaltosDeLinea);
    const htmlToSend = template(req.body);

    res.status(200).json({ok: true, html: htmlToSend});
}

const generarPdf = async (req, res) => {
    try {
        const { htmlContent } = req.body;

        // 1. Lanzar el navegador
        const browser = await puppeteer.launch({ 
            headless: "new", 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ] 
        });
        const page = await browser.newPage();

        // 2. Definir el contenido HTML
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // 3. Generar el PDF en memoria (Buffer)
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();

        // 4. Configurar headers y enviar el PDF
        res.contentType("application/pdf");
        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generando el PDF');
    }
}

module.exports = {
    draft,
    ActualizarDraft,
    obtenerConvenio,
    obtenerConvenios,
    convenioEmpresas,
    convenioDependencia,
    convenioPersona,
    generarPdf
}