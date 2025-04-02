
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const foliosFile = path.join(__dirname, 'folios.json');

function loadFolios() {
    if (!fs.existsSync(foliosFile)) return {};
    return JSON.parse(fs.readFileSync(foliosFile));
}

function saveFolios(folios) {
    fs.writeFileSync(foliosFile, JSON.stringify(folios, null, 2));
}

app.post('/api/registrar', (req, res) => {
    const { folio, vigencia } = req.body;
    const folios = loadFolios();
    if (folios[folio]) {
        return res.status(400).json({ error: 'Folio ya registrado' });
    }

    const fechaExpedicion = new Date();
    const fechaVencimiento = new Date(fechaExpedicion);
    fechaVencimiento.setDate(fechaExpedicion.getDate() + parseInt(vigencia));

    folios[folio] = {
        fechaExpedicion: fechaExpedicion.toISOString(),
        fechaVencimiento: fechaVencimiento.toISOString()
    };

    saveFolios(folios);
    res.json({ mensaje: 'Folio registrado exitosamente' });
});

app.get('/api/consultar/:folio', (req, res) => {
    const folios = loadFolios();
    const folio = folios[req.params.folio];

    if (!folio) {
        return res.json({ estado: 'No registrado' });
    }

    const hoy = new Date();
    const vencimiento = new Date(folio.fechaVencimiento);
    const vigente = hoy <= vencimiento;

    res.json({
        estado: vigente ? 'Vigente' : 'Vencido',
        fechaExpedicion: folio.fechaExpedicion,
        fechaVencimiento: folio.fechaVencimiento
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
