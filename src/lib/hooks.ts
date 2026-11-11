import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { api, ApiError } from "./api/client";
import type { Job, JobRef } from "./api/types";
import { notify } from "@/ui/Display";

/**
 * List state (page, q, sort + extra filters) kept in the URL so lists are linkable and survive reloads.
 * Changing anything but `page` resets to page 1.
 */
export function useListParams<F extends Record<string, string>>(defaults: { pageSize?: number; sort?: string } & Partial<F> = {}) {
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => {
    const out: Record<string, string | number | undefined> = {
      page: Number(sp.get("page") ?? 1) || 1,
      pageSize: [10, 25, 50, 100].includes(Number(sp.get("pageSize"))) ? Number(sp.get("pageSize")) : (defaults.pageSize ?? 25),
      q: sp.get("q") ?? undefined,
      sort: sp.get("sort") ?? defaults.sort,
    };
    for (const [k, v] of sp.entries()) if (!["page", "q", "sort", "pageSize"].includes(k)) out[k] = v;
    for (const [k, v] of Object.entries(defaults)) if (out[k] === undefined && k !== "pageSize") out[k] = v as string;
    return out as { page: number; pageSize: number; q?: string; sort?: string } & Partial<F>;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaults are static per page
  }, [sp]);
  const set = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      setSp(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === "") next.delete(k);
            else next.set(k, String(v));
          }
          if (!("page" in patch)) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setSp],
  );
  return [params, set] as const;
}

/** Copies API field errors onto a react-hook-form. Returns the message for anything left over. */
export function applyFieldErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, known: string[]): string | null {
  if (!(err instanceof ApiError)) return err instanceof Error ? err.message : "Something went wrong.";
  let unmatched = false;
  for (const fe of err.errors) {
    if (known.includes(fe.path)) setError(fe.path as Path<T>, { message: fe.message });
    else unmatched = true;
  }
  return err.errors.length === 0 || unmatched ? err.userMessage : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Polls a job until it finishes, then downloads its file. */
export async function waitForJobAndDownload(jobId: string, opts: { timeoutMs?: number } = {}) {
  const started = Date.now();
  const deadline = started + (opts.timeoutMs ?? 120_000);
  let delay = 600;
  while (Date.now() < deadline) {
    const job = await api.get<Job>(`/jobs/${jobId}`);
    // Nothing picked the job up: the background worker isn't running.
    if (job.status === "queued" && !job.attempts && Date.now() - started > 20_000) {
      throw new Error("The file couldn't be prepared because the background worker isn't running. Ask your administrator to start it, then try again.");
    }
    if (job.status === "done") {
      if (job.file) await api.download(`/files/${job.file.id}`, job.file.filename);
      return job;
    }
    if (job.status === "failed") throw new Error(job.error ?? "The export failed.");
    await sleep(delay);
    delay = Math.min(delay * 1.5, 3000);
  }
  throw new Error("The export is taking longer than expected. Try again in a minute.");
}

/** Starts an export/PDF job and downloads the result. `start` must return `{ jobId }`. */
export function useExportJob(start: () => Promise<JobRef>, label = "File") {
  return useMutation({
    mutationFn: async () => {
      const { jobId } = await start();
      notify.info(`${label} is being prepared…`);
      return waitForJobAndDownload(jobId);
    },
    onSuccess: () => notify.success(`${label} downloaded.`),
    onError: (err) => notify.error(err),
  });
}

export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial);
  return { open, onOpen: () => setOpen(true), onClose: () => setOpen(false), setOpen };
}
