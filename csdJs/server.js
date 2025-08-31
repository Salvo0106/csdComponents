const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const chokidar = require('chokidar');

const app = express();

// Abilita CORS per permettere richieste da altri domini
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Servi i file statici dalla directory corrente
app.use(express.static(__dirname));

// Funzione per buildare il bundle
const buildBundle = () => {
    console.log('Ricostruendo il bundle...');
    exec('webpack --config webpack.config.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`Errore durante la build:`);
            console.error(error.message);
            console.error('Output webpack:');
            console.error(stdout);
            console.error(stderr);
            return;
        }
        console.log('Bundle ricostruito con successo!');
        console.log(stdout);
    });
};

// Osserva i cambiamenti nei file .js
const watcher = chokidar.watch(['*.js', 'component/*.js'], {
    ignored: /(^|[\/\\])\../, // ignora file nascosti
    persistent: true,
    ignoreInitial: true,
    cwd: __dirname
});

watcher.on('change', (path) => {
    console.log(`File modificato: ${path}`);
    buildBundle();
});

// Build iniziale
buildBundle();

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server avviato su http://192.168.1.7:${PORT}`);
    console.log(`csd-bundle.js disponibile su http://192.168.1.7:${PORT}/dist/csd-bundle.min.js`);
});
