const express = require('express');
const fs = require('fs');
const session = require('express-session');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'adminclave',
  resave: false,
  saveUninitialized: true
}));

function leerFolios() {
  if (!fs.existsSync('folios.json')) fs.writeFileSync('folios.json', '{}');
  return JSON.parse(fs.readFileSync('folios.json'));
}

function guardarFolios(data) {
  fs.writeFileSync('folios.json', JSON.stringify(data, null, 2));
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/login', (req, res) => {
  if (req.body.password === 'admin123') {
    req.session.admin = true;
    res.redirect('/registro');
  } else {
    res.send('Contraseña incorrecta');
  }
});

app.get('/registro', (req, res) => {
  if (!req.session.admin) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public/registro.html'));
});

app.post('/registrar', (req, res) => {
  if (!req.session.admin) return res.status(401).send('No autorizado');

  const { folio, dias } = req.body;
  const folios = leerFolios();
  if (folios[folio]) return res.send('Folio ya registrado');

  const fechaExpedicion = new Date();
  const fechaVencimiento = new Date(fechaExpedicion);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + parseInt(dias));

  folios[folio] = {
    fechaExpedicion,
    fechaVencimiento
  };
  guardarFolios(folios);
  res.send('Folio registrado con éxito');
});

app.get('/consultar', (req, res) => {
  const folios = leerFolios();
  const folio = req.query.folio;
  const registro = folios[folio];
  if (!registro) return res.send('Este folio no se encuentra en nuestros registros');

  const hoy = new Date();
  const vencimiento = new Date(registro.fechaVencimiento);
  const vigente = hoy <= vencimiento;

  res.send(vigente
    ? `Folio vigente. Expedición: ${new Date(registro.fechaExpedicion).toLocaleDateString()} - Vencimiento: ${vencimiento.toLocaleDateString()}`
    : `Folio vencido desde: ${vencimiento.toLocaleDateString()}`);
});

app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
