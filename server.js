const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'mi_clave_secreta',
  resave: false,
  saveUninitialized: true
}));

const FOLIOS_PATH = './folios.json';

function cargarFolios() {
  if (!fs.existsSync(FOLIOS_PATH)) {
    fs.writeFileSync(FOLIOS_PATH, '[]');
  }
  return JSON.parse(fs.readFileSync(FOLIOS_PATH));
}

function guardarFolios(folios) {
  fs.writeFileSync(FOLIOS_PATH, JSON.stringify(folios, null, 2));
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123') {
    req.session.admin = true;
    return res.redirect('/registro');
  }
  res.send('Contraseña incorrecta');
});

app.get('/registro', (req, res) => {
  if (!req.session.admin) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

app.post('/registrar', (req, res) => {
  if (!req.session.admin) return res.status(403).send('No autorizado');
  const { folio, vigencia } = req.body;
  const folios = cargarFolios();

  if (folios.find(f => f.folio === folio)) {
    return res.send('El folio ya existe');
  }

  const expedicion = new Date();
  const vencimiento = new Date(expedicion);
  vencimiento.setDate(expedicion.getDate() + parseInt(vigencia));

  folios.push({ folio, expedicion, vencimiento });
  guardarFolios(folios);
  res.send('Folio registrado con éxito');
});

app.get('/api/consultar', (req, res) => {
  const { folio } = req.query;
  const folios = cargarFolios();
  const encontrado = folios.find(f => f.folio === folio);
  if (!encontrado) return res.json({ estado: 'no_encontrado' });

  const hoy = new Date();
  const vencimiento = new Date(encontrado.vencimiento);
  const estado = vencimiento >= hoy ? 'vigente' : 'vencido';
  res.json({
    estado,
    expedicion: encontrado.expedicion,
    vencimiento: encontrado.vencimiento
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor activo en puerto " + PORT));