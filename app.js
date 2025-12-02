const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const routerLogin = require("./router/login");
const routerAuth = require("./router/auth");
const routerUnidades = require("./router/unidades");
const routerCuentas = require("./router/cuentas");
const routerConvenios = require("./router/convenios");
const routerLocacion = require("./router/locacion");
const routerOrganizacion = require("./router/organizaciones");
const routerNotificaciones = require("./router/notificaciones");
const routerMedia = require("./router/media");


dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method, api_key');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PATCH, DELETE');
  next();
});

routerLogin(app);
routerAuth(app);
routerUnidades(app)
routerCuentas(app);
routerConvenios(app);
routerLocacion(app);
routerOrganizacion(app);
routerNotificaciones(app);
routerMedia(app);

const configureSocketIO = (serverInstance) => {

    const io = new Server(serverInstance, { cors: { origin: "*",  methods: ["GET", "POST"] } });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token; 
        if (!token) {
            return next(new Error("No autorizado: Token no proporcionado"));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; 
            next();
        } catch (err) {
            return next(new Error("No autorizado: Token inválido"));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Usuario conectado al Socket: ${socket.user.cuenta_id}`);
        const cuenta_id = socket.user.cuenta_id; 
        if (cuenta_id) {
            socket.join(`cuenta_${cuenta_id}`);
            console.log(`Usuario unido a la sala: cuenta_${cuenta_id}`);
        }
        socket.on('disconnect', () => {
            console.log('Usuario desconectado del Socket');
        });
    });

    return io;
};

let server;
if (process.env.NODE_ENV === 'PRODUCCION') {
    try {
        const privateKey  = fs.readFileSync(process.env.PRIVKEY, 'utf8');
        const ca = fs.readFileSync(process.env.CA, 'utf8');
        const certificate = fs.readFileSync(process.env.CERT, 'utf8');
    
        const credentials = { key: privateKey, ca: ca, cert: certificate };        
        server = https.createServer(credentials, app);
        const io = configureSocketIO(server);
        app.set('socketio', io);
        server.listen(process.env.PORT, () => {
            console.log('Servidor HTTPS (WSS) corriendo en puerto:', process.env.PORT);
        });
    } catch (error) {
        console.error("Error cargando certificados SSL:", error);
    }

} else {

    server = http.createServer(app);
    const io = configureSocketIO(server);
    app.set('socketio', io);
    server.listen(process.env.PORT, () => {
        console.log('Servidor HTTP (WS) desarrollo corriendo en puerto:', process.env.PORT);
    });
}

module.exports = app;