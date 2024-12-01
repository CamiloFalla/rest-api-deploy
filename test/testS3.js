import fs from 'fs';
import dotenv from 'dotenv';
import s3 from '../models/s3.js'; // Ruta donde tienes configurado el cliente S3

dotenv.config();

// Prueba de carga a S3
async function testUploadS3() {
  const filePath = '/Users/camilofalla/Documents/imagestest/example.txt'; // Ruta absoluta
  const bucketName = process.env.BUCKET_NAME;
  const key = 'test-folder/example.txt'; // Ubicación en el bucket

  // Leer el archivo local
  const fileContent = fs.readFileSync(filePath);

  console.log('Subiendo archivo a S3 con los siguientes datos:');
  console.log(`Bucket: ${bucketName}`);
  console.log(`Key: ${key}`);

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: 'text/plain',
  };

  try {
    const result = await s3.upload(params).promise();
    console.log('Archivo subido exitosamente:', result);
  } catch (error) {
    console.error('Error subiendo archivo a S3:', error);
  }
}

testUploadS3();