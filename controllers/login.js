const db = require("../config/mysql");
const jwt = require("../helpers/jwt");
const bycrypt = require("bcryptjs");

const Logg = async (req, res) => {
    const { mail, pass } = req.body;
    const con = await db.getConnection();

    try {
        if (!mail || !pass ){
            return res.status(400).json({ok: false, msg: "Ambos campos son requeridos"})
        }
        const [Usuarios] = await con.query(
            "SELECT * FROM Cuentas WHERE correo = ? AND estado = 'Activo'",
            [mail]
        );

        if (Usuarios.length === 0) {
            return res.status(401).json({ ok: false, msg: "Usuario no encontrado o inactivo" });
        }

        const usuario = Usuarios[0];

        const match = bycrypt.compareSync(pass, usuario.contrasena);
        if (!match) {
            return res.status(401).json({ ok: false, msg: "Contraseña incorrecta" });
        }

        const result = {
            id_Cuenta: usuario.id_Cuenta,
            id_Unidad_Academica: usuario.id_Unidad_Academica,
            rfc: usuario.rfc,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
        };
        const token = jwt.signJwt({ id_Cuenta: usuario.id_Cuenta, rol: usuario.rol , id_Unidad_Academica: usuario.id_Unidad_Academica, nombre: usuario.nombre });
        result.token = token;
        return res.status(200).json({ ...result, token });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ ok: false, msg: 'Algo salió mal' });
    } finally {
        con.release();
    }
};

module.exports = {
    Logg
} 