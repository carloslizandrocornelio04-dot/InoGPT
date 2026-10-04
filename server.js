import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 3000);
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) return res.status(400).json({ error: "Escribe un mensaje." });
    if (message.length > 4000) return res.status(400).json({ error: "El mensaje es demasiado largo." });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions:
        "Eres inoGPT, un asistente útil para estudios y tareas generales. " +
        "Responde en español salvo que el usuario pida otro idioma. " +
        "Responde de forma clara, completa y útil, sin ser innecesariamente breve. Puedes dar respuestas largas cuando el tema lo necesite, pero nunca superes 25 líneas de contenido. " +
        "Usa iconos o emojis de forma moderada para organizar secciones y hacer la respuesta más fácil de leer. " +
        "Para tareas escolares, explica de forma sencilla y apropiada para un estudiante. " +
        "Si una pregunta necesita más detalle, usa títulos cortos, viñetas y ejemplos, manteniéndote dentro del máximo de 25 líneas. " +
        "No inventes datos: si no estás seguro, dilo.",
      input: message,
      max_output_tokens: 1400
    });

    res.json({ reply: response.output_text || "No obtuve una respuesta." });
  } catch (error) {
    console.error("inoGPT API error:", error);
    const status = Number(error?.status) || 500;
    let message = "No se pudo conectar con la IA.";
    if (!process.env.OPENAI_API_KEY) message = "Falta OPENAI_API_KEY en el archivo .env.";
    else if (status === 401) message = "La clave API fue rechazada. Comprueba que copiaste la clave completa y que sigue activa.";
    else if (status === 429) message = "La API rechazó la solicitud por límite de uso o configuración de facturación de la cuenta.";
    else if (status === 400) message = "La API rechazó la solicitud. Revisa la configuración del modelo.";
    else if (error?.message) message = "Error de la API: " + String(error.message).slice(0, 300);
    res.status(status).json({ error: message });
  }
});

app.post("/api/image", async (req, res) => {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ error: "Escribe qué imagen quieres crear." });
    if (prompt.length > 2000) return res.status(400).json({ error: "La descripción de la imagen es demasiado larga." });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Falta OPENAI_API_KEY en el archivo .env." });

    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      prompt,
      size: "1024x1024"
    });

    const b64 = result?.data?.[0]?.b64_json;
    const url = result?.data?.[0]?.url;
    if (b64) return res.json({ image: `data:image/png;base64,${b64}` });
    if (url) return res.json({ image: url });
    return res.status(500).json({ error: "La IA no devolvió una imagen." });
  } catch (error) {
    console.error("inoGPT image error:", error);
    const status = Number(error?.status) || 500;
    let message = "No se pudo crear la imagen.";
    if (status === 401) message = "La clave API fue rechazada. Comprueba que sigue activa.";
    else if (status === 429) message = "La generación de imágenes alcanzó un límite de uso o requiere configuración de facturación.";
    else if (status === 400) message = "La solicitud de imagen fue rechazada. Prueba con una descripción diferente.";
    else if (error?.message) message = "Error de la API: " + String(error.message).slice(0, 300);
    res.status(status).json({ error: message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, apiKeyConfigured: Boolean(process.env.OPENAI_API_KEY), model: process.env.OPENAI_MODEL || "gpt-6-luna" });
});

app.listen(port, () => console.log(`inoGPT funcionando en http://localhost:${port}`));
