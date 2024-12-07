import fs from 'fs';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

// Instancia del cliente S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Función de prueba para cargar archivo simulando Multer
async function testUploadSimulatedMulter() {
  const filePath = '/Users/camilofalla/Documents/imagestest/example.txt'; // Ruta absoluta
  const bucketName = process.env.BUCKET_NAME;
  const key = 'test-folder/example.txt'; // Ubicación en el bucket

  // Leer el archivo local simulando el objeto que genera Multer
  const fileBuffer = fs.readFileSync(filePath);
  const simulatedMulterFile = {
    buffer: fileBuffer, // Simula el buffer que entrega Multer
    mimetype: 'text/plain', // Simula el mimetype que entrega Multer
    originalname: 'example.txt', // Nombre original del archivo
  };

  console.log('Subiendo archivo a S3 con los siguientes datos:');
  console.log(`Bucket: ${bucketName}`);
  console.log(`Key: ${key}`);
  console.log(`Simulando archivo Multer:`, simulatedMulterFile);

  // Parámetros para la carga
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: simulatedMulterFile.buffer, // Usamos el buffer simulado
    ContentType: simulatedMulterFile.mimetype, // Usamos el mimetype simulado
  };

  try {
    const command = new PutObjectCommand(params);
    const result = await s3.send(command);
    console.log('Archivo subido exitosamente desde simulación de Multer:', result);
  } catch (error) {
    console.error('Error subiendo archivo desde simulación de Multer:', error);
  }
}

testUploadSimulatedMulter();