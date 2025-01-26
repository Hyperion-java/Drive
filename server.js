const express = require('express'),
      multer = require('multer'),
      path = require('path'),
      fs = require('fs'),
      config = require('./config.json'),
      archiver = require('archiver'),
      cron = require('node-cron'),
      readline = require('readline'),  // Import readline
      app = express(),
      externalDrivePath = config.externalDrivePath,
      backupsPath = config.backupsPath;

if (!fs.existsSync(externalDrivePath)) fs.mkdirSync(externalDrivePath, { recursive: true });
if (!fs.existsSync(backupsPath)) fs.mkdirSync(backupsPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, externalDrivePath),
  filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ storage: storage });
app.use(express.static('public'));

app.get('/files', (req, res) => {
  fs.readdir(externalDrivePath, (err, files) => {
    if (err) return res.status(500).send('Error reading files from external drive');
    res.json(files);
  });
});

app.post('/upload', upload.array('file', 10), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).send('No files uploaded');
  res.status(200).send({ message: 'Files uploaded successfully', files: req.files });
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename,
        filepath = path.join(externalDrivePath, filename);
  res.download(filepath, filename, (err) => {
    if (err) res.status(404).send('File not found');
  });
});

app.delete('/delete/:filename', (req, res) => {
  const filename = req.params.filename,
        filepath = path.join(externalDrivePath, filename);
  fs.unlink(filepath, (err) => {
    if (err) return res.status(500).send('Error deleting file');
    res.status(200).send('File deleted successfully');
  });
});

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-'),
        backupFilename = `backup-${timestamp}.zip`,
        backupFilePath = path.join(backupsPath, backupFilename),
        output = fs.createWriteStream(backupFilePath),
        archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);
  archive.directory(externalDrivePath, false);
  archive.finalize();
  output.on('close', () => {
    console.log(`Backup created: ${backupFilename}`);
  });
  archive.on('error', (err) => {
    console.error(`Error creating backup: ${err.message}`);
  });
}

cron.schedule('0 0 */12 * * *', createBackup);

const { host, port } = config;
const server = app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});

// Create readline interface to listen for terminal input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  if (input.trim() === '#stop') {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server stopped.');
      rl.close(); // Close the readline interface
      process.exit(0); // Exit the process
    });
  }
});
