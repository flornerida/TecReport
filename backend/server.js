const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const prisma = require("./prisma/prismaClient");

const authRoutes = require("./auth/auth.routes");
const reportesRoutes = require("./routes/reportes.routes");
const adminRoutes = require("./routes/admin.routes");
const comentariosRoutes = require("./routes/comentarios.routes");
const seguimientoRoutes = require("./routes/seguimiento.routes");
const notificacionesRoutes = require("./routes/notificaciones.routes");
const evidenciasRoutes = require("./routes/evidencias.routes"); 
const tecnicosRoutes = require("./routes/tecicos.routes");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.body) {
    const bodyLog = { ...req.body };
    if (bodyLog.password) bodyLog.password = '[HIDDEN]';
    if (bodyLog.fotoBase64) {
      bodyLog.fotoBase64 = `[BASE64: ${Math.round(bodyLog.fotoBase64.length / 1024)} KB]`;
    }
    if (bodyLog.evidencias && Array.isArray(bodyLog.evidencias)) {
      bodyLog.evidencias = `[${bodyLog.evidencias.length} evidencias]`;
    }
    console.log('Body:', bodyLog);
  }
  next();
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Servidor Express funcionando",
    timestamp: new Date().toISOString()
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/auth", authRoutes);
app.use("/reportes", reportesRoutes);
app.use("/admin", adminRoutes);
app.use("/comentarios", comentariosRoutes);
app.use("/seguimientos", seguimientoRoutes);
app.use("/notificaciones", notificacionesRoutes);
app.use("/evidencias", evidenciasRoutes);
app.use("/tecnicos", tecnicosRoutes);

app.use((req, res) => {
  console.log(`Ruta no encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.url}`
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: "La imagen es demasiado grande. Máximo 50MB.",
      error: "request entity too large"
    });
  }

  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`
📡 Local:       http://localhost:${PORT}
🌐 Red:         http://192.168.1.103:${PORT}
📁 Límite:      50MB
  `);
});

process.on('SIGINT', async () => {
  console.log('\n Cerrando servidor...');
  await prisma.$disconnect();
  console.log('Desconectado de la base de datos');
  process.exit(0);
});