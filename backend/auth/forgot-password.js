// backend/index.js o server.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: "Debes enviar un correo" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ success: false, message: "Usuario no encontrado" });

    const code = Math.floor(1000 + Math.random() * 9000); 

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: code.toString(),
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), 
      },
    });

    console.log(`Código de recuperación enviado a ${email}: ${code}`); 
    return res.json({ success: true, message: "Código enviado al correo" });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Error interno del servidor" });
  }
});