require('dotenv').config({path:'./custom.env'})
const express=require('express')
const cors=require('cors')
const multer=require('multer')
const path=require('path')
const fs=require('fs')
const app=express()
app.use(cors())
app.use(express.json())
const mongoose=require('mongoose')
const { spawn } = require('child_process')
const { type } = require('os')

// app.use('./TestImage',express.static('public'))
// Serve files from ./TestImage via the /TestImage URL
app.use('/TestImage', express.static(path.join(__dirname, 'TestImage')));


// const python=spawn('python',['./realmutil.py'])
const BASE_URL = 'http://192.168.236.85:8000';  // ✅ Use your server's LAN IP

const messi = `${BASE_URL}/TestImage/messi.png`;
const mbappe = `${BASE_URL}/TestImage/mbappe.png`;
const neymar = `${BASE_URL}/TestImage/neymar.png`;
const ronaldo = `${BASE_URL}/TestImage/ronaldo.png`;
const salah = `${BASE_URL}/TestImage/salah.jpg`;

const storage=multer.diskStorage({
    destination: (req, file, cb) => {
            const uploadPath = path.join(__dirname, './imagesStore'); 
            
            // Create directory if it doesn't exist
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true }); 
            }
    
            cb(null, uploadPath);
        },
        filename:(req,file,cb)=>{
            cb(null,`${Date.now()}--${file.originalname}`);
        },
})
const upload=multer({storage})
app.post('/postpic', upload.single('file'), (req, res) => {
  const file = req.file.path
  const base64Image = fs.readFileSync(file, { encoding: 'base64' });
  const python = spawn('python', ['./realmutil.py']); 

  let resultData = '';
  let errorData = '';

  // Send JSON input to Python
  const input = JSON.stringify({ image: base64Image});
  python.stdin.write(input + '\n');
  python.stdin.end();

  python.stdout.on('data', (data) => {
    resultData += data.toString();
  });

  python.stderr.on('data', (data) => {
    errorData += data.toString();
  });

 python.on('close', (code) => {
  if (errorData) {
    console.error('Python error:', errorData);
    return res.status(500).json({ error: errorData });
  }

  try {
    if (!resultData.trim()) {
      return res.status(500).json({ error: 'Empty response from Python script' });
    }

    const parsed = JSON.parse(resultData.trim());
if(parsed[0]===0){
return res.status(200).json({
      Name:'kylian mbappe',
      country:'france',
      image:mbappe,
      age:26,
      club:'Real madrid',
      clubImg:'hello'
    });
}else if(parsed[0]===1){
 return res.status(200).json({
      Name:'Lionel Messi',
      country:'Argentina',
      image:messi,
      age:37,
      club:'Inter maiami',
      clubImg:'hello'
    }); 
}else if(parsed[0]===3){
  return res.status(200).json({
      Name:'Cristiano Ronaldo',
      country:'Portugal',
      image:ronaldo,
      age:40,
      club:'Al-Nassr',
      clubImg:'hello'
    }); 
}else if(parsed[0]===2){
  return res.status(200).json({
      Name:'Neymar junior',
      country:'Brazil',
      image:neymar,
      age:33,
      club:'Al-hillal',
      clubImg:'hello'
    }); 
}
else if(parsed[0]===4){
 return res.status(200).json({
      Name:'Muhammad Salah',
      country:'Egypt',
      image:salah,
      age:33,
      club:'Liverpool',
      clubImg:'hello'
    }); 
}else{
  return res.status(400).json({
      message:"can't processed image"
    }); 
}
    
  } catch (err) {
    console.error('JSON parse error:', err.message);
    return res.status(500).json({ error: 'Failed to parse Python response', raw: resultData });
  }
});
});

const port =8000
// mongoose.connect(process.env.DB_CONNECTION_STR).then(()=>console.log('database connection successfull'))
// .catch(err=>console.log(err.message))




app.listen(port,()=>{
    console.log(`app has started on port ${port}`)
})