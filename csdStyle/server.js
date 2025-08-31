const express = require("express");
const path = require("path");
const {exec} = require("child_process");
const fs = require("fs");
const chokidar = require("chokidar");
const os = require("os");

const app = express();
const STYLE_DIR = path.join(__dirname, "component");

// Abilita CORS per permettere richieste da altri domini
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Servi i file statici dalla directory corrente
app.use(express.static(__dirname));

// Funzione per compilare tutti i file SCSS in un unico CSS
const buildStyles = () => {
    console.log("Compilando tutti i file SCSS in un unico CSS...");

    // Leggi tutti i file SCSS nella directory style
    fs.readdir(STYLE_DIR, (err, files) => {
        if (err) {
            console.error("Errore nella lettura della directory style:", err);
            return;
        }

        // Filtra solo i file .scss
        const scssFiles = files.filter((file) => file.endsWith(".scss"));

        // Crea un contenuto che importa tutti i file SCSS dalla cartella style
        const imports = scssFiles.map((file) => `@import "component/${file}";`).join("\n");

        // Aggiungi l'import del file principale
        const finalImports = `@import "csdstyle.scss";\n${imports}`;

        // Crea un file temporaneo con tutti gli import
        const tempFile = "temp-all.scss";
        fs.writeFileSync(tempFile, finalImports);

        // Compila il file temporaneo in un unico CSS
        exec(`sass ${tempFile} csdstyle.css`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Errore durante la compilazione: ${error}`);
            } else {
                console.log("Tutti i file SCSS sono stati compilati con successo in csdstyle.css!");
                console.log("File SCSS compilati:");
                console.log("- csdstyle.scss");
                scssFiles.forEach((file) => console.log(`- component/${file}`));
            }

            // Rimuovi il file temporaneo
            fs.unlinkSync(tempFile);
        });
    });
};

// Osserva i cambiamenti in tutti i file .scss nella cartella component
const watcher = chokidar.watch([
    "*.scss", "component/*.scss"
], {
    ignored: /(^|[\/\\])\../, // ignora file nascosti
    persistent: true,
    ignoreInitial: true,
    cwd: __dirname
});

watcher.on("change", (path) => {
    console.log(`File modificato: ${path}`);
    buildStyles();
});

// Build iniziale
buildStyles();

const PORT = 3001;

// Funzione per ottenere l'indirizzo IP interno
function getInternalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Ignora gli indirizzi non IPv4 e gli indirizzi di loopback
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost'; // fallback
}

const internalIP = getInternalIP();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Watch mode enabled. Watching for file changes...`);
    console.log(`NOTE: Raw file sizes do not reflect development server per-request transformations.`);
    console.log(`→ Local:   http://localhost:${PORT}/`);
    console.log(`→ Network: http://${internalIP}:${PORT}/`);
    console.log(`press h + enter to show help`);
    console.log(`csdstyle.css disponibile su http://${internalIP}:${PORT}/csdstyle.css`);
});
