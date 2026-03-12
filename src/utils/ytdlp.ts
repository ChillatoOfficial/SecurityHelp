import { spawn } from "child_process";

const PYTHON: string = process.platform === "win32" ? "python" : "python3";

export function safeName(name: string): string {
  return (
    name
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .slice(0, 80)
      .trim() || "audio"
  );
}

export function runYtDlpToMp3(url: string, outputPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const args: string[] = [
  "-m", "yt_dlp",
  "--js-runtimes", "node",
  "--remote-components", "ejs:github",
  "--cookies", "/root/voidproject/whatsapp/SecurityHelp/cookies.txt",
  "-f", "bestaudio/best",
  "--extract-audio",
  "--audio-format", "mp3",
  "--audio-quality", "0",
  "-o", outputPath,
  url
];


    const p = spawn(PYTHON, args);

    let err = "";
    p.stderr.on("data", (d: Buffer) => (err += d.toString()));

    p.on("error", (e: Error) => reject(e));
    p.on("close", (code: number | null) => {
      if (code === 0) resolve();
      else reject(new Error(err || `yt-dlp exit ${code}`));
    });
  });
}
