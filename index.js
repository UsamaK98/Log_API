const express = require('express');
const multer  = require('multer');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validate MAC address format
const validateMacAddress = (macAddress) => {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(macAddress);
}

// Endpoint for handling file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  const { macAddress, botName, version } = req.body;
  const file = req.file;

  // Validate inputs
  if (!macAddress || !botName || !version || !file) {
    return res.status(400).send('Missing required parameters');
  }

  // Validate MAC address
  if (!validateMacAddress(macAddress)) {
    return res.status(400).send('Invalid MAC address format');
  }

  // Check file type
  const mimeType = mime.getType(file.originalname);
  if (mimeType !== 'text/plain') {
    fs.unlinkSync(file.path); // Delete the file if it's not a text file
    return res.status(400).send('Only text files are allowed');
  }

  // Get the current date
  const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Remove colons from MAC address
  const sanitizedMacAddress = macAddress.replace(/:/g, '');

  // Create directories if they don't exist
  const directories = ['uploads', botName, `version_${version}`, currentDate, sanitizedMacAddress];
  let currentPath = '';
  for (const dir of directories) {
    currentPath = path.join(currentPath, dir);
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
  }

  // Move the uploaded file to the appropriate directory
  fs.renameSync(file.path, path.join(currentPath, file.originalname));

  // Here you can save other information to the database or perform any additional tasks

  res.send(true);
});

// Root path response
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
