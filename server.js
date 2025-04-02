
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: "mi_secreto", resave: false, saveUninitialized: true }));

app.use(express.static("public"));

const foliosPath = path.join(__dirname, "folios.json");
function cargarFolios() {
  if (!fs.existsSync(foliosPath)) return {};
  return JSON.parse(fs.readFileSync(foliosPath));
}
function guardarFolios(data) {
  fs.writeFileSync(foliosPath, JSON.stringify(data, null, 2));
}

app.post("/login", (req, res) => {
  const { usuario, contrasena } = req.body;
  if (usuario === "admin" && contrasena === "1234") {
    req.session.autenticado = true;
    return res.redirect("/registro.html");
  }
  res.send("Credenciales inválidas");
});

app.use("/registro.html", (req, res, next) => {
  if (req.session.autenticado) return next();
  res.redirect("/login.html");
});

app.post("/api/registrar", (req, res) => {
  if (!req.session.autenticado) return res.status(403).json({ error: "No autorizado" });

  const { folio, vigencia } = req.body;
  const folios = cargarFolios();

  if (folios[folio]) return res.json({ error: "Folio ya existe" });

  const fechaExpedicion = new Date();
  const fechaVencimiento = new Date(fechaExpedicion);
  fechaVencimiento.setDate(fechaExpedicion.getDate() + parseInt(vigencia));

  folios[folio] = {
    fechaExpedicion: fechaExpedicion.toISOString(),
    fechaVencimiento: fechaVencimiento.toISOString()
  };
  guardarFolios(folios);
  res.json({ mensaje: "Folio registrado exitosamente" });
});

app.get("/api/consultar/:folio", (req, res) => {
  const folios = cargarFolios();
  const folio = folios[req.params.folio];
  if (!folio) return res.json({ estado: "No registrado" });

  const hoy = new Date();
  const vencimiento = new Date(folio.fechaVencimiento);
  const vigente = hoy <= vencimiento;

  res.json({
    estado: vigente ? "Vigente" : "Vencido",
    fechaExpedicion: folio.fechaExpedicion,
    fechaVencimiento: folio.fechaVencimiento
  });
});

app.listen(PORT, () => console.log("Servidor activo en puerto", PORT));
