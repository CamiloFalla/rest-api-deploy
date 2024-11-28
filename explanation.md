REST

Representations state transfer

REST es una arquitectura de software, no es un patron y suso para web applications para arquitectura de redes

Se creo en el 2000 por Roy Fielding y se usa de manera masiva para construir API

Vamos a ver los principos de REST

- Simplicidad
- Escalabilidad
- Portabilidad
- Visibilidad
- Fiabilidad
- Fácil de modificar

Se basa la arquitectura de software para crear cosas que se puedan mantener en el tiempo y que resuelva una necesidad especifica

FUNDAMENTOS

Recursos:
Por ejemplo un usuario, una colección, una lista, cada recurso se va a identificar con una URL

Verbos HTTP:
Definir operaciones que se puedan realizar como por ejemplo los CRUD

Representaciones:
Siempre se piensa que es un json pero no, puede tener múltiples represantaciones, aunque el más común es json

Stateless:
El servidor no debe mantener ningún estado entre solicitudes

Interfaz uniforme:
Que siempre llame de la misma manera, que las URL sea similares.

Separación de conceptos:
Permite que cliente y servidor puedan seguir creciendo de manera separada.


Pero importante

A veces puedes crear una API qwue no sea REST, puede ser SOAP

Una API puede ser una API y ya esta

POr ejemplo analizar GraphQL que no todo es REST


### Para la validación de Campos vamos a usar zod

Diferencia POST PUT PATCH

Idempotencia, propiedad de realizar una opertación varias veces y conseguir el mismo resultado

Cual es el proposito

POST es crear un nuevo elemento o recurso NO es idempotente porque siempre creas un nuevo elemento

PUT es actualizar totalmente un elemento o crearlo sino existe, si es idempotente porque el resultado es el mismo

PATCH actualizar parcialmente un elemento o recurso, y es idempotente porque siempre va estar dando el mismo resultado, pero no esta garantizado

En la semantica POST crea un nuevo elemento

En el PUT le pasas todo pero le entregas el ID no lo creas

## PUBLICACION DE LA PAGINA EN LOCAL

Generada una imagen de prueba que cargue las imagenes debemos ahora resolver el funcionamiento de los CORS

CORS: Cross origin resources sharing

aunque la informacion descarga a traves de servidor con curl, el inconveniente viene con los navegadores

No hay una cabecera que le de la respuesta correcta

Debemos definir quien añade la cabecera para empezar a comunicar

Aqeui se incluye una explicacion completa utilizando la dependencia de CORS

Ya que el metodo manual solo indica ma nualmente permitir especificamente

const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = {
  'http://localhost:8080': { methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] },
  'http://localhost:3000': { methods: ['GET', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'] }
};

// Configuración de CORS dinámica
const corsOptions = {
  origin: (origin, callback) => {
    const originConfig = allowedOrigins[origin];
    if (originConfig || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: (req, callback) => {
    const origin = req.header('Origin');
    const allowedMethods = allowedOrigins[origin]?.methods || ['GET', 'POST'];
    callback(null, allowedMethods);
  },
  allowedHeaders: (req, callback) => {
    const origin = req.header('Origin');
    const headers = allowedOrigins[origin]?.allowedHeaders || ['Content-Type'];
    callback(null, headers);
  }
};

app.use(cors(corsOptions));

// Middleware adicional para validar procesos
app.use((req, res, next) => {
  const origin = req.header('Origin');
  const methodsAllowed = allowedOrigins[origin]?.methods;

  if (methodsAllowed && methodsAllowed.includes(req.method)) {
    return next();
  }

  res.status(403).json({ message: 'Operación no permitida para este origen o método.' });
});

// Rutas
app.get('/', (req, res) => {
  res.send('Bienvenido al servidor!');
});

app.post('/api', (req, res) => {
  res.send('Post recibido!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});


Para el despliegue vams a apronder como hacerlo en fl0






