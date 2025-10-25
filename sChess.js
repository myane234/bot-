// sChess.js
import fetch from "node-fetch";

export async function getChessAvatar(username) {
  try {
    // Ambil data profil utama
    const res = await fetch(`https://api.chess.com/pub/player/${username}`);
    if (!res.ok) throw new Error("❌ Gagal ambil profil pemain");

    const data = await res.json();
    if (!data.avatar) throw new Error("⚠️ Pemain tidak punya avatar.");

    // Ambil gambar avatar
    const imgRes = await fetch(data.avatar);
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      buffer,
      info: {
        username: data.username,
        country: data.country?.split("/").pop() || "Tidak diketahui",
        url: data.url,
        avatar: data.avatar
      }
    };
  } catch (err) {
    console.error("❌ Error getChessAvatar:", err);
    throw new Error("Gagal mengambil avatar Chess.com (pastikan username benar)");
  }
}
