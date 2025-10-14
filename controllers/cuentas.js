const db = require("../config/mysql");
const bycrypt = require("bcryptjs");
const Mailer = require("../helpers/correoService");

const createCuenta = async (req, res) => {
    const { nombre, correo, contrasena, rol, rfc, id_Unidad_Academica } = req.body;
    const con = await db.getConnection();
    const X_API_KEY = req.headers['api_key'];
    if (X_API_KEY !== process.env.X_API_KEY) {
        return res.status(401).json({ ok: false, msg: 'Falta api key' });
    }
    try {
        if (!nombre || !correo || !contrasena || !rol || !rfc || !id_Unidad_Academica) {
            return res.status(400).json({ ok: false, msg: "Todos los campos son requeridos" });
        }
        if (!['Gestor','Organización','Coordinador','Revisor','Director Unidad','Director General'].includes(rol)) {
            return res.status(400).json({ ok: false, msg: "Rol inválido" });
        }
        if (contrasena.length < 8 || contrasena.includes(' ')) {
            return res.status(400).json({ ok: false, msg: "La contraseña debe tener al menos 8 caracteres" });
        }
        if (rfc.length !== 13 || rfc.includes(' ')) {
            return res.status(400).json({ ok: false, msg: "El RFC debe tener 13 caracteres" });
        }
        const [unidad] = await con.query(
            "SELECT * FROM Unidades_Academicas WHERE id_Unidad_Academica = ?",
            [id_Unidad_Academica]
        );
        if (unidad.length === 0) {
            return res.status(400).json({ ok: false, msg: "La unidad académica no existe" });
        }
        const [existingUsers] = await con.query(
            "SELECT * FROM Cuentas WHERE correo = ?",
            [correo]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ ok: false, msg: "El correo ya está en uso" });
        }

        const salt = await bycrypt.genSalt(10);
        const hashedPassword = await bycrypt.hash(contrasena, salt);

        const [result] = await con.query(
            "INSERT INTO Cuentas (nombre, correo, contrasena, rol, rfc, id_Unidad_Academica, estado) VALUES (?, ?, ?, ?, ?, ?, 'Activo')",
            [nombre, correo, hashedPassword, rol, rfc, id_Unidad_Academica]
        );

        return res.status(201).json({ ok: true, msg: "Cuenta creada exitosamente"});
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, msg: 'Algo salió mal' });
    } finally {
        con.release();
    }
};

const restorePass = async (req, res) => {
    const { correo } = req.body;
    const con = await db.getConnection();
    const X_API_KEY = req.headers['api_key'];
    if (X_API_KEY !== process.env.X_API_KEY) {
        return res.status(401).json({ ok: false, msg: 'Falta api key' });
    }
    try {
        if (!correo) {
            return res.status(400).json({ ok: false, msg: "El correo es requerido" });
        }

        const [users] = await con.query(
            "SELECT * FROM Cuentas WHERE correo = ?",
            [correo]
        );

        if (users.length === 0) {
            return res.status(200).json({ ok: true, msg: "Se ha enviado una nueva contraseña a tu correo" });
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

        return res.status(200).json({ ok: true, msg: "Se ha enviado una nueva contraseña a tu correo" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, msg: 'Algo salió mal' });
    } finally {
        con.release();
    }
};

module.exports = {
    createCuenta,
    restorePass
}