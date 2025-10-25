import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import { getChessAvatar } from "./sChess.js";
import { askGemini } from "./gemini.js";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const sock = makeWASocket({ auth: state });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    // ✅ Cetak QR code di terminal pakai qrcode-terminal
    if (qr) {
      console.log("🔐 Scan QR berikut untuk login WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot connected to WhatsApp");
    }
  });

  // --- Event pesan masuk ---
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    console.log(`📩 Pesan dari ${from}: ${text}`);

    const pesan = text.toLowerCase().trim();

    if (pesan.startsWith(".ai")) {
      const query = text.slice(3).trim();
      if (!query) {
        await sock.sendMessage(from, { text: "⚠️ Format: .ai [pertanyaan]" });
        return;
      }

      await sock.sendMessage(from, { text: "🤖 Tunggu bentar, lagi mikir..." });
      const aiResponse = await askGemini(query);
      await sock.sendMessage(from, { text: aiResponse });
    }

        if(pesan.startsWith(".menu")) {
        const menuText = `🤖 *Menu Bot AI*\n\n
        1. .ai [pertanyaan] - Tanyakan sesuatu ke AI\n
        2. .Menu - Tampilkan menu bot\n\n` ;
        await sock.sendMessage(from, { text: menuText });
        return;
      }

      if (pesan.startsWith(".schess")) {
  const parts = pesan.split(" ");
  const username = parts[1];
  if (!username) {
    await sock.sendMessage(from, { text: "⚠️ Format: .schess [username]" });
    return;
  }

  await sock.sendMessage(from, { text: `♟️ Mengambil avatar *${username}*...` });

  try {
    const { buffer, info } = await getChessAvatar(username);

    const caption = `✅ Avatar Chess.com
👤 *${info.username}*
🌍 Negara: ${info.country}
🔗 Profil: ${info.url}`;

    await sock.sendMessage(from, { image: buffer, caption });
  } catch (err) {
    await sock.sendMessage(from, { text: err.message });
  }
}

  });
}

startBot();
