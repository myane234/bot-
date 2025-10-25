import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Ambil semua key dari .env (pisah dengan koma)
let keys = process.env.GEMINI_KEYS.split(",").map(k => k.trim());
let currentKeyIndex = 0;

/**
 * Fungsi untuk ambil AI response dari Gemini dengan auto-switch key
 * @param {string} prompt - teks yang dikirim user
 * @returns {Promise<string>} - hasil balasan AI
 */
export async function askGemini(prompt) {
  let attempt = 0;

  while (attempt < keys.length) {
    const apiKey = keys[currentKeyIndex];
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (text) return text;
      else throw new Error("Empty response");

    } catch (err) {
      const status = err.response?.status;
      console.warn(`⚠️ Key index ${currentKeyIndex} gagal (${status || err.message})`);

      // Kalau error quota/unauthorized → pindah ke key lain
      if ([403, 429, 401].includes(status) || err.message.includes("quota")) {
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        attempt++;
        console.log(`🔄 Ganti ke key index ${currentKeyIndex}`);
      } else {
        return "⚠️ Gagal ambil respon dari Gemini.";
      }
    }
  }

  return "🚫 Semua API key udah limit bro.";
}
