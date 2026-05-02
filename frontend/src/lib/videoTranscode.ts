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
const FFPROBE_TIMEOUT_MS = 60 * 1000;

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

function runFfprobe(inputPath: string): Promise<{ videoCodec: string | null; audioCodec: string | null }> {
  return new Promise((resolve, reject) => {
    const args = [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_type,codec_name",
      "-of",
      "json",
      inputPath,
    ];

    const ffprobe = spawn("ffprobe", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      ffprobe.kill("SIGKILL");
    }, FFPROBE_TIMEOUT_MS);

    ffprobe.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    ffprobe.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    ffprobe.on("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`No se pudo ejecutar ffprobe: ${error.message}`));
    });

    ffprobe.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`ffprobe finalizo con error (${code ?? "sin codigo"}): ${stderr || "sin detalle"}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as { streams?: Array<{ codec_type?: string; codec_name?: string }> };
        const streams = parsed.streams ?? [];
        const videoCodec = streams.find((stream) => stream.codec_type === "video")?.codec_name ?? null;
        const audioCodec = streams.find((stream) => stream.codec_type === "audio")?.codec_name ?? null;
        resolve({ videoCodec, audioCodec });
      } catch (error) {
        reject(new Error(`No se pudo leer metadata de video: ${error instanceof Error ? error.message : "json invalido"}`));
      }
    });
  });
}

function isAlreadyWebCompatibleMp4(file: File, probe: { videoCodec: string | null; audioCodec: string | null }): boolean {
  const lowerName = file.name.toLowerCase();
  const looksLikeMp4 = lowerName.endsWith(".mp4") || file.type === "video/mp4";
  const videoOk = probe.videoCodec === "h264";
  const audioOk = probe.audioCodec === null || probe.audioCodec === "aac";
  return looksLikeMp4 && videoOk && audioOk;
}

export async function transcodeVideoToWebMp4(file: File): Promise<TranscodeResult | null> {
  const tag = randomUUID();
  const inputPath = join(tmpdir(), `asespro-${tag}-input.${sanitizeExtension(file.name)}`);
  const outputPath = join(tmpdir(), `asespro-${tag}-output.mp4`);

  try {
    await writeInputFile(file, inputPath);
    const probe = await runFfprobe(inputPath);
    if (isAlreadyWebCompatibleMp4(file, probe)) {
      return null;
    }
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
