const db = require("../config/mysql");

const obtenerConvenios = async (req, res) => {
    const { rol, id_Cuenta, rfc,id_Unidad_Academica } = req.user; 
    
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
                DATE_FORMAT(C.fecha_Fin, '%Y-%m-%d') AS fecha_Fin,
                UA.nombre AS unidad,
                O.nombre_Legal AS nombre_Organizacion
            FROM Convenios C
            INNER JOIN Unidades_Academicas UA ON UA.id_Unidad_Academica = C.id_Unidad_Academica
            INNER JOIN Organizaciones O ON O.id_Organizacion = C.id_Organizacion
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

        let dataQuery = dataQueryBase + whereClause + " ORDER BY C.id_Convenio DESC LIMIT ? OFFSET ?";
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

module.exports = {
    obtenerConvenios,
}