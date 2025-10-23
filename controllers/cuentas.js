const db = require("../config/mysql");
const bycrypt = require("bcryptjs");
const Mailer = require("../helpers/correoService");

const createCuenta = async (req, res) => {
    const { nombre, correo, contrasena, rol, rfc, id_Unidad_Academica } = req.body;
    const X_API_KEY = req.headers['api_key'];
    if (X_API_KEY !== process.env.X_API_KEY) {
        return res.status(401).json({ ok: false, message: 'Falta api key' });
    }
    const con = await db.getConnection();
    try {
        if (!nombre || !correo || !contrasena || !rol || !rfc || !id_Unidad_Academica) {
            return res.status(400).json({ ok: false, message: "Todos los campos son requeridos" });
        }
        if (!['Gestor','Organización','Coordinador','Revisor','Director Unidad','Director General'].includes(rol)) {
            return res.status(400).json({ ok: false, message: "Rol inválido" });
        }
        if (contrasena.length < 8 || contrasena.includes(' ')) {
            return res.status(400).json({ ok: false, message: "La contraseña debe tener al menos 8 caracteres" });
        }
        if (rfc.length !== 13 || rfc.includes(' ')) {
            return res.status(400).json({ ok: false, message: "El RFC debe tener 13 caracteres" });
        }
        const [unidad] = await con.query(
            "SELECT * FROM Unidades_Academicas WHERE id_Unidad_Academica = ?",
            [id_Unidad_Academica]
        );
        if (unidad.length === 0) {
            return res.status(400).json({ ok: false, message: "La unidad académica no existe" });
        }
        const [existingUsers] = await con.query(
            "SELECT * FROM Cuentas WHERE correo = ?",
            [correo]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ ok: false, message: "El correo ya está en uso" });
        }

        const salt = await bycrypt.genSalt(10);
        const hashedPassword = await bycrypt.hash(contrasena, salt);

        const [result] = await con.query(
            "INSERT INTO Cuentas (nombre, correo, contrasena, rol, rfc, id_Unidad_Academica, estado) VALUES (?, ?, ?, ?, ?, ?, 'Activo')",
            [nombre, correo, hashedPassword, rol, rfc, id_Unidad_Academica]
        );

        return res.status(201).json({ ok: true, message: "Cuenta creada exitosamente"});
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, message: 'Algo salió mal' });
    } finally {
        con.release();
    }
};

const restorePass = async (req, res) => {
    const { correo } = req.body;
    const X_API_KEY = req.headers['api_key'];
    if (X_API_KEY !== process.env.X_API_KEY) {
        return res.status(401).json({ ok: false, message: 'Falta api key' });
    }
    const con = await db.getConnection();
    try {
        if (!correo) {
            return res.status(400).json({ ok: false, message: "El correo es requerido" });
        }

        const [users] = await con.query(
            "SELECT * FROM Cuentas WHERE correo = ?",
            [correo]
        );

        if (users.length === 0) {
            return res.status(200).json({ ok: true, message: "Se ha enviado una nueva contraseña a tu correo" });
        }

        const nuevaContrasena = Math.random().toString(36).slice(-8);
        const salt = await bycrypt.genSalt(10);
        const hashedPassword = await bycrypt.hash(nuevaContrasena, salt);

        await con.query(
            "UPDATE Cuentas SET contrasena = ? WHERE correo = ?",
            [hashedPassword, correo]
        );

        const mailer = new Mailer();
        const asunto = 'Restablecimiento de contraseña';
        const contenido = `
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; text-align: center;">
                <h1 style="color: #333;">Recuperacion de contraseña </h1>
                <p style="font-size: 16px; color: #555;">Tu nueva contraseña es:</p>
                <p style="font-size: 20px; font-weight: bold; color: #007BFF;">${nuevaContrasena}</p>
            </div>
            </body>
        `;

        await mailer.enviarCorreo(correo, asunto, contenido);

        return res.status(200).json({ ok: true, message: "Se ha enviado una nueva contraseña a tu correo" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, message: 'Algo salió mal' });
    } finally {
        con.release();
    }
};

const createCuentasAdmin = async (req, res) => {
    const {nombre, correo, rol, rfc, id_Unidad_Academica} = req.body;

    const con = await db.getConnection();

    try {
        if (!nombre || !correo || !rol || !rfc || !id_Unidad_Academica) {
            return res.status(400).json({ ok: false, message: "Todos los campos son requeridos" });
        }
        if (!['Gestor','Organización','Coordinador','Revisor','Director Unidad','Director General'].includes(rol)) {
            return res.status(400).json({ ok: false, message: "Rol inválido" });
        }
        if (rfc.length !== 13 || rfc.includes(' ')) {
            return res.status(400).json({ ok: false, message: "El RFC debe tener 13 caracteres" });
        }
        const [unidad] = await con.query(
            "SELECT * FROM Unidades_Academicas WHERE id_Unidad_Academica = ?",
            [id_Unidad_Academica]
        );
        if (unidad.length === 0) {
            return res.status(400).json({ ok: false, message: "La unidad académica no existe" });
        }
        
        const [existingUsers] = await con.query(
            "SELECT * FROM Cuentas WHERE correo = ?",
            [correo]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ ok: false, message: "El correo ya está en uso" });
        }

        const nuevaContrasena = Math.random().toString(36).slice(-10);
        const salt = await bycrypt.genSalt(10);
        const hashedPassword = await bycrypt.hash(nuevaContrasena, salt);

        const [result] = await con.query(
            "INSERT INTO Cuentas (nombre, correo, contrasena, rol, rfc, id_Unidad_Academica, estado) VALUES (?, ?, ?, ?, ?, ?, 'Activo')",
            [nombre, correo, hashedPassword, rol, rfc, id_Unidad_Academica]
        );

        const mailer = new Mailer();
        const asunto = 'Cuenta de acceso';
        const contenido = `
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; text-align: center;">
                <h1 style="color: #333;">Cuenta de acceso </h1>
                <p style="font-size: 16px; color: #555;">Tu usuario es:</p>
                <p style="font-size: 20px; font-weight: bold; color: #007BFF;">${correo}</p>
                <p style="font-size: 16px; color: #555;">Tu contraseña es:</p>
                <p style="font-size: 20px; font-weight: bold; color: #007BFF;">${nuevaContrasena}</p>
            </div>
            </body>
        `;

        await mailer.enviarCorreo(correo, asunto, contenido);

        return res.status(201).json({ ok: true, message: "Cuenta creada exitosamente"});

    }catch(error){
        console.log(err);
        return res.status(500).json({ ok: false, message: 'Algo salió mal' });
    }finally{
        con.release();
    }
    
}

const obtenerCuentasOne = async (req, res) => {
    const {id} = req.params;
    const con = await db.getConnection();
    try {
        const [existingUsers] = await con.query(
            "SELECT id_Cuenta, Unidades_Academicas.nombre as unidad, rfc, Cuentas.nombre AS nombre, correo, rol, estado FROM Cuentas INNER JOIN(Unidades_Academicas) ON(Unidades_Academicas.id_Unidad_Academica = Cuentas.id_Unidad_Academica) WHERE Cuentas.id_Cuenta = ?",
            [id]
        );

        if (existingUsers.length < 1) {
            return res.status(409).json({ ok: false, message: "El usuario no existe" });
        }

        return res.status(201).json({ ok: true, user: existingUsers[0]});
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, message: 'Algo salió mal' });
    } finally {
        con.release();
    }
}

const actualizarCuenta = async (req, res) => {
    const {id} = req.params;
    const {nombre, correo, rol, rfc, id_Unidad_Academica} = req.body;

    const con = await db.getConnection();

    try {
        const [existingUsers] = await con.query(
            "SELECT id_Cuenta FROM Cuentas WHERE id_Cuenta = ?",
            [id]
        );
        if (existingUsers.length < 1) {
            return res.status(409).json({ ok: false, message: "El usuario no existe" });
        }

        if (!nombre || !correo || !rol || !rfc || !id_Unidad_Academica) {
            return res.status(400).json({ ok: false, message: "Todos los campos son requeridos" });
        }
        if (!['Gestor','Organización','Coordinador','Revisor','Director Unidad','Director General'].includes(rol)) {
            return res.status(400).json({ ok: false, message: "Rol inválido" });
        }
        if (rfc.length !== 13 || rfc.includes(' ')) {
            return res.status(400).json({ ok: false, message: "El RFC debe tener 13 caracteres" });
        }
        const [unidad] = await con.query(
            "SELECT * FROM Unidades_Academicas WHERE id_Unidad_Academica = ?",
            [id_Unidad_Academica]
        );
        if (unidad.length === 0) {
            return res.status(400).json({ ok: false, message: "La unidad académica no existe" });
        }

        const [validacionUsers] = await con.query(
            "SELECT id_Cuenta FROM Cuentas WHERE id_Cuenta != ? AND (correo = ? OR rfc = ?)",
            [id, correo, rfc]
        );
        if(validacionUsers.length > 0){
            return res.status(400).json({ ok: false, message: "CURP o RFC previamente registrados" });
        }

        const [result] = await con.query(
            "UPDATE Cuentas SET nombre = ?, correo = ?, rol = ?, rfc = ?, id_Unidad_Academica = ? WHERE id_Cuenta = ?",
            [nombre, correo, rol, rfc, id_Unidad_Academica, id]
        );

        return res.status(201).json({ ok: true, message: "Cuenta actualizada exitosamente" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, message: 'Algo salió mal' });
    } finally {
        con.release();
    }
}

const actualizarEstado = async (req, res) => {
    const {id, status} = req.params;
    const con = await db.getConnection();

    try {
        const [existingUsers] = await con.query(
            "SELECT id_Cuenta FROM Cuentas WHERE id_Cuenta = ?",
            [id]
        );
        if (existingUsers.length < 1) {
            return res.status(409).json({ ok: false, message: "El usuario no existe" });
        }

        if (!['Activo','Inactivo'].includes(status)) {
            return res.status(400).json({ ok: false, message: "estatus inválido" });
        }

        const [result] = await con.query(
            "UPDATE Cuentas SET estado = ? WHERE id_Cuenta = ?",
            [status, id]
        );

        return res.status(200).json({ ok: true, message: "estado actualizado exitosamente" });
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, message: 'Algo salió mal' });
    } finally {
        con.release();
    }
}

module.exports = {
    createCuenta,
    restorePass,
    createCuentasAdmin,
    obtenerCuentasOne,
    actualizarCuenta,
    actualizarEstado
}  