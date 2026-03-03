import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "likeme",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
});

// Verificar conexión a la base de datos
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err.stack);
  } else {
    console.log("Conectado a PostgreSQL correctamente");
    release();
  }
});

// Ruta GET - Obtener todos los posts
app.get("/posts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM posts ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener posts:", error);
    res.status(500).json({ error: "Error al obtener los posts" });
  }
});

// Ruta POST - Crear un nuevo post
app.post("/posts", async (req, res) => {
  try {
    const { titulo, img, descripcion } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!titulo || !img || !descripcion) {
      return res.status(400).json({
        error: "Los campos titulo, img y descripcion son requeridos",
      });
    }

    // Validar longitud del título
    if (titulo.length > 25) {
      return res.status(400).json({
        error: "El título no puede exceder 25 caracteres",
      });
    }

    // Validar longitud de la descripción
    if (descripcion.length > 255) {
      return res.status(400).json({
        error: "La descripción no puede exceder 255 caracteres",
      });
    }

    // Insertar nuevo post con likes inicializado en 0
    const result = await pool.query(
      "INSERT INTO posts (titulo, img, descripcion, likes) VALUES ($1, $2, $3, $4) RETURNING *",
      [titulo, img, descripcion, 0],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear post:", error);
    res.status(500).json({ error: "Error al crear el post" });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log("Presiona Ctrl + C para detener el servidor");
});
