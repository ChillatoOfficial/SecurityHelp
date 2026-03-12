import type { Command } from "../types";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import os from "os";
import { runYtDlpToMp3, safeName } from "../../utils/ytdlp";
import { sendCard } from "../../utils/card";

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const MAX_SECONDS = 10 * 60; // 10 min, cambia se vuoi

const song: Command = {
  name: "song",
  description: "Cerca e scarica audio da YouTube: !song <titolo/artista>",
  groupOnly: true,
  async run({ sock, from, args, msg }) {
    const query = args.join(" ").trim();
    if (!query) {
      await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Usa: !song <artista/titolo>`"})
      return
    }

    try {
      const res = await yts(query);
      const video = res.videos?.[0];
      if (!video) {
        await sock.sendMessage(from, { text: `Nessun risultato per: ${query}` }, msg ? { quoted: msg } : undefined);
        return;
      }

      if (video.seconds && video.seconds > MAX_SECONDS) {
        await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Video troppo lungo (" + formatDuration(video.seconds) + "). Limite: " + formatDuration(MAX_SECONDS) + ".`"})
        return;
      }

      const title = video.title || "Sconosciuto";
      const author = video.author?.name || "Sconosciuto";
      const duration = formatDuration(video.seconds);
      const link = video.url;

      const caption =
        `🎵 *${title}*\n` +
        `👤 Canale: ${author}\n` +
        `⏱️ Durata: ${duration}\n` +
        `🔗 ${link}\n\n` +
        `⬇️ Download in corso...`;

      const thumb = video.thumbnail;

      if (thumb) {
        await sock.sendMessage(from, { image: { url: thumb }, caption }, msg ? { quoted: msg } : undefined);
      } else {
        await sock.sendMessage(from, { text: caption }, msg ? { quoted: msg } : undefined);
      }
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "baileys-song-"));
      const fileName = safeName(`${title} - ${author}`) + ".mp3";
      const outPath = path.join(tmpDir, fileName);

      try {
        await runYtDlpToMp3(link, outPath);

        const audioBuffer = fs.readFileSync(outPath);

        await sock.sendMessage(
          from,
          {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            ptt: false,
            fileName
          },
          msg ? { quoted: msg } : undefined
        );
      } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      }
    } catch (err) {
      console.error("!song error", err);
      await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Errore durante la ricerca/download. Riprova più tardi.`"})
    }
  }
};

export default song;
