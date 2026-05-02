import { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawn } from "child_process";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

type TranscodeResult = {
  buffer: Buffer;
  contentType: string;
  extension: string;
};

const FFMPEG_TIMEOUT_MS = 10 * 60 * 1000;

function sanitizeExtension(filename: string): string {
  const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() ?? "" : "";
  if (!ext) return "mp4";
  return ext.replace(/[^a-z0-9]/g, "") || "mp4";
}

async function writeInputFile(file: File, inputPath: string): Promise<void> {
  const source = Readable.fromWeb(file.stream() as any);
  const target = createWriteStream(inputPath);
  await pipeline(source, target);
}

function runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-ac",
      "2",
      "-ar",
      "48000",
      "-movflags",
      "+faststart",
      outputPath,
    ];

    const ffmpeg = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    const timer = setTimeout(() => {
      ffmpeg.kill("SIGKILL");
    }, FFMPEG_TIMEOUT_MS);

    ffmpeg.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
      if (stderr.length > 12000) {
        stderr = stderr.slice(-12000);
      }
    });

    ffmpeg.on("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`No se pudo ejecutar ffmpeg: ${error.message}`));
    });

    ffmpeg.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg finalizo con error (${code ?? "sin codigo"}): ${stderr || "sin detalle"}`));
    });
  });
}

export async function transcodeVideoToWebMp4(file: File): Promise<TranscodeResult> {
  const tag = randomUUID();
  const inputPath = join(tmpdir(), `asespro-${tag}-input.${sanitizeExtension(file.name)}`);
  const outputPath = join(tmpdir(), `asespro-${tag}-output.mp4`);

  try {
    await writeInputFile(file, inputPath);
    await runFfmpeg(inputPath, outputPath);
    const buffer = await fs.readFile(outputPath);
    if (buffer.length === 0) {
      throw new Error("ffmpeg genero un archivo vacio.");
    }
    return {
      buffer,
      contentType: "video/mp4",
      extension: "mp4",
    };
  } finally {
    await Promise.allSettled([fs.unlink(inputPath), fs.unlink(outputPath)]);
  }
}
