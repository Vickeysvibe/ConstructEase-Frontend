import { useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import type { ImportResult } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { Button } from "./Button";
import { Modal } from "./Overlay";
import { Badge, ErrorState, notify } from "./Display";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** called with dryRun=true for the preview, then dryRun=false to commit */
  upload: (file: File, dryRun: boolean) => Promise<ImportResult>;
  onImported: () => void;
  /** downloads a template workbook */
  onTemplate?: () => void;
  describe?: string;
}

const TONE = { create: "ok", update: "info", skip: "neutral", error: "danger" } as const;

/** Upload → preview every row with its status → commit (all-or-nothing). */
export function FileImport({ open, onClose, title, upload, onImported, onTemplate, describe }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [over, setOver] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  async function choose(f: File | undefined) {
    if (!f) return;
    reset();
    setFile(f);
    setBusy(true);
    try {
      setPreview(await upload(f, true));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!file) return;
    setBusy(true);
    try {
      const r = await upload(file, false);
      notify.success(`Imported: ${r.created} added, ${r.updated} updated${r.skipped ? `, ${r.skipped} skipped` : ""}.`);
      onImported();
      close();
    } catch (err) {
      if (err instanceof ApiError && err.body?.result) setPreview(err.body.result as ImportResult);
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const errors = preview?.rows.filter((r) => r.status === "error").length ?? 0;
  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      wide
      footer={
        <>
          {onTemplate && (
            <Button variant="ghost" icon={<FileSpreadsheet />} onClick={onTemplate}>
              Download template
            </Button>
          )}
          <span className="ce-spacer" />
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={commit} loading={busy && !!preview} disabled={!preview || errors > 0 || preview.valid === 0}>
            {preview ? `Import ${preview.valid - preview.skipped} rows` : "Import"}
          </Button>
        </>
      }
    >
      {describe && <p className="ce-muted">{describe}</p>}
      <div
        className="ce-drop"
        data-over={over}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void choose(e.dataTransfer.files[0]);
        }}
      >
        <Upload aria-hidden />
        <strong>{file ? file.name : "Choose an .xlsx file or drop it here"}</strong>
        <span className="ce-muted">Up to 5 MB. Nothing is saved until you press Import.</span>
        <input
          ref={input}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {busy && !preview && <p className="ce-muted">Checking the file…</p>}
      {error != null && <ErrorState error={error} />}
      {preview && (
        <div className="ce-stack">
          <div className="ce-row">
            <Badge tone="ok">{preview.rows.filter((r) => r.status === "create").length} new</Badge>
            <Badge tone="info">{preview.rows.filter((r) => r.status === "update").length} updates</Badge>
            {preview.skipped > 0 && <Badge>{preview.skipped} duplicates skipped</Badge>}
            {errors > 0 && <Badge tone="danger">{errors} with errors — fix them in the file and choose it again</Badge>}
          </div>
          <div className="ce-table-wrap" style={{ maxHeight: 340, border: "1px solid var(--ce-border)", borderRadius: 6 }}>
            <table className="ce-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Problems</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.row}>
                    <td className="num">{r.row}</td>
                    <td>
                      <Badge tone={TONE[r.status]}>{r.status}</Badge>
                    </td>
                    <td>{String(r.data.name ?? "—")}</td>
                    <td style={{ color: "var(--ce-danger)" }}>{r.errors.map((e) => `${e.path}: ${e.message}`).join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
