const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const STYLE_DIR = path.join(__dirname, "component");

// Funzione per compilare tutti i file SCSS in un unico CSS
const buildStyles = () => {
    console.log("Compilando tutti i file SCSS in un unico CSS...");

    // Leggi tutti i file SCSS nella directory component
    fs.readdir(STYLE_DIR, (err, files) => {
        if (err) {
            console.error("Errore nella lettura della directory component:", err);
            return;
        }

        // Filtra solo i file .scss
        const scssFiles = files.filter((file) => file.endsWith(".scss"));

        // Crea un contenuto che importa tutti i file SCSS dalla cartella component
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
                process.exit(1);
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

// Esegui la build
buildStyles();