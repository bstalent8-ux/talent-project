// ─── Client-side Cloudinary upload with honest error attribution ───────────
// Every portfolio upload used to be a bare `fetch(...).then(...)` wrapped in
// `try { } catch {}` — any failure (Cloudinary rejecting the file, the
// connection dropping mid-upload, a slow network never finishing) looked
// identical to the user: nothing happened, no message, ever. That's what
// made a talent's "videos won't upload" report read as "something's broken
// on the site" — there was no way to tell a dead connection from a real bug.
//
// XMLHttpRequest (not fetch) because it's the only browser API that
// distinguishes these outcomes for us:
//   - offline    — `navigator.onLine` is false before we even try.
//   - timeout    — the transfer is alive but too slow to finish in a
//                   size-scaled budget (see timeoutForSize below).
//   - network    — the connection dropped/refused mid-request (xhr.onerror).
//   - server     — a real HTTP response came back, just not a success one
//                   (Cloudinary rejected the file, quota, etc.) — this is
//                   the only kind that isn't about the user's connection.

export type CloudinaryUploadErrorKind = "offline" | "timeout" | "network" | "server";

export interface CloudinaryUploadResult {
  ok: boolean;
  url?: string;
  errorKind?: CloudinaryUploadErrorKind;
  errorMessage?: string;
}

/** Floor of ~200KB/s (tolerant of a weak mobile connection) with a 60s
 *  minimum and a 10-minute ceiling, so a huge file doesn't wait forever but
 *  a small one isn't timed out unfairly fast either. */
function timeoutForSize(bytes: number): number {
  const estimated = (bytes / (200 * 1024)) * 1000;
  return Math.max(60_000, Math.min(600_000, estimated));
}

export function uploadToCloudinary(
  file: File,
  opts: { cloudName: string; uploadPreset: string; folder: string; resourceType: "image" | "video" },
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve) => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      resolve({ ok: false, errorKind: "offline" });
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${opts.cloudName}/${opts.resourceType}/upload`);
    xhr.timeout = timeoutForSize(file.size);

    xhr.ontimeout = () => resolve({ ok: false, errorKind: "timeout" });
    xhr.onerror = () => resolve({ ok: false, errorKind: "network" });
    xhr.onload = () => {
      let data: { secure_url?: string; error?: { message?: string } } = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* fall through to server-error below */ }

      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
        resolve({ ok: true, url: data.secure_url });
      } else {
        resolve({ ok: false, errorKind: "server", errorMessage: data.error?.message });
      }
    };

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", opts.uploadPreset);
    fd.append("folder", opts.folder);
    xhr.send(fd);
  });
}

const MESSAGES: Record<CloudinaryUploadErrorKind, { ar: string; en: string }> = {
  offline: {
    ar: "مفيش اتصال بالإنترنت. اتأكد من الشبكة وجرب تاني.",
    en: "No internet connection. Check your network and try again.",
  },
  timeout: {
    ar: "النت بطيء أوي حالياً والرفع مكملش. جرب على شبكة أقوى أو فيديو أصغر.",
    en: "Your connection is too slow right now and the upload didn't finish. Try a stronger network or a smaller file.",
  },
  network: {
    ar: "الاتصال بالإنترنت اتقطع أثناء الرفع. جرب تاني.",
    en: "Your internet connection dropped during the upload. Try again.",
  },
  server: {
    ar: "حصل خطأ أثناء الرفع، جرب تاني بعد شوية.",
    en: "Something went wrong during the upload — try again in a moment.",
  },
};

export function cloudinaryUploadErrorText(kind: CloudinaryUploadErrorKind, lang: "ar" | "en"): string {
  return MESSAGES[kind][lang];
}
