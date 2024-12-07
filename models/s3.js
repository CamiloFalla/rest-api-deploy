import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

console.log('PutObjectCommand:', PutObjectCommand); // Verifica si está correctamente importado
// Instancia del cliente S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadFile = async (file, bucket, key) => {
  // Manejo del buffer dependiendo del origen del archivo
  const body = file.buffer || file; // `file.buffer` si viene de Multer, o el archivo completo si viene de fs.readFileSync

  const params = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: file.mimetype || 'text/plain', // Fallback para testUploadS3
  };

  try {
    const command = new PutObjectCommand(params);
    const result = await s3.send(command);
    return result;
  } catch (error) {
    console.error('Error al subir archivo a S3:', error);
    throw error;
  }
};

export default s3;