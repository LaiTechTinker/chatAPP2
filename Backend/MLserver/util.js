const fs = require('fs');
fs
// Example Base64 string (no data:image/... prefix)
let base64String = fs.readFileSync('base64.txt', 'utf-8'); 
if (base64String.startsWith('data:')) {
    base64String = base64String.split(',')[1]; // keep only the base64 part
  }
// Convert to buffer and save as image
const buffer = Buffer.from(base64String, 'base64');
fs.writeFileSync('output2.png', buffer); // or .jpg depending on the type

console.log('Image saved as output.png');


const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');




// Set up Multer to handle image uploads
const upload = multer({ dest: 'uploads/' });

app.post('/upload-image', upload.single('image'), (req, res) => {
  const filePath = req.file.path;

  // Call the Python script with the uploaded file path
  const pythonScript = `python3 process_image.py ${filePath}`;

  exec(pythonScript, (error, stdout, stderr) => {
    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    if (error) {
      console.error('Error running Python script:', stderr);
      return res.status(500).json({ error: 'Processing failed' });
    }

    try {
      const result = JSON.parse(stdout);
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid response from Python script' });
    }
  });
});
