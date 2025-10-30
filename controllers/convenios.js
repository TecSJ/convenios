const db = require("../config/mysql");

const draft = async (req, res) => {
    const con = await db.getConnection();
    const {numero_convenio, id_Creador_Cuenta, id_Unidad_Academica, fecha_Inicio, fecha_Fin} = req.body;

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
            [numero_convenio, id_Unidad_Academica, id_Creador_Cuenta, "Macro", "Incompleto", fecha_Inicio, fecha_Fin, 1]
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

module.exports = {
    draft,
    ActualizarDraft
}