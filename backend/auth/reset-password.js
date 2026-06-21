app.post("/auth/reset-password", async (req, res) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password)
    return res.json({ success: false, message: "Faltan datos" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ success: false, message: "Usuario no encontrado" });

    if (user.resetToken !== code) {
      return res.json({ success: false, message: "Código inválido" });
    }

    if (user.resetTokenExpiry < new Date()) {
      return res.json({ success: false, message: "Código expirado" });
    }

    await prisma.user.update({
      where: { email },
      data: {
        password, 
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.json({ success: true, message: "Contraseña actualizada" });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Error interno del servidor" });
  }
});