app.post("/auth/verify-code", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.json({ success: false, message: "Faltan datos" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ success: false, message: "Usuario no encontrado" });

    if (user.resetToken !== code) {
      return res.json({ success: false, message: "Código inválido" });
    }

    if (user.resetTokenExpiry < new Date()) {
      return res.json({ success: false, message: "Código expirado" });
    }

    return res.json({ success: true, message: "Código válido" });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Error interno del servidor" });
  }
});