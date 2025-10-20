const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const privateKey = fs.readFileSync(path.join(__dirname, '../helpers/admin.key'), 'utf8');

require('dotenv').config();
const validApiKeys = [process.env.X_API_KEY];

async function authMiddleware(req, res, next) {
  try {
    // Verificar API Key
    const apiKey = req.headers['api_key'];
    if (!apiKey || !validApiKeys.includes(apiKey)) {
      return res.status(401).json({ message: 'Acceso denegado. API key inválida o faltante.' });
    }

    // Verificar JWT
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Acceso denegado. Se requiere token.' });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Formato de token inválido.' });
    }

    const decoded = jwt.verify(token, privateKey, {
      algorithms: ['RS256'],
    });

    req.user = decoded;

    next();
  } catch (err) {
    console.error('Error al verificar el token:', err.message);
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
}

async function authMiddlewareCoordinador(req, res, next){
  try {
    // Verificar API Key
    const apiKey = req.headers['api_key'];
    if (!apiKey || !validApiKeys.includes(apiKey)) {
      return res.status(401).json({ message: 'Acceso denegado. API key inválida o faltante.' });
    }

    // Verificar JWT
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Acceso denegado. Se requiere token.' });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Formato de token inválido.' });
    }

    const decoded = jwt.verify(token, privateKey, {
      algorithms: ['RS256'],
    });

    if(decoded.rol !== 'Coordinador'){
      return res.status(401).json({ message: 'No es coordinador' });
    }

    console.log(decoded);

    req.user = decoded;

    next();
  } catch (err) {
    console.error('Error al verificar el token:', err.message);
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
}

module.exports = {
  authMiddleware,
  authMiddlewareCoordinador
};
