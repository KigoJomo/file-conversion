"use client";

import { useMemo, useState } from "react";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Download04Icon,
  FileDownloadIcon,
  FileUploadIcon,
  Loading03Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { readHistory, writeHistory, type ConversionHistoryItem } from "@/lib/history";

const accepted = ".xlsx,.docx,.pptx";

type QueuedFile = {
  id: string;
  file: File;
  status: "ready" | "converting" | "done" | "error";
  message?: string;
  outputName?: string;
  outputBlob?: Blob;
};

type ConvertedFile = QueuedFile & {
  outputBlob: Blob;
};

export function Converter() {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [history, setHistory] = useState<ConversionHistoryItem[]>(() => readHistory());
  const [status, setStatus] = useState("Choose Office files to start.");
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<QueuedFile | null>(null);
  const canConvert = useMemo(() => queue.length > 0 && !isConverting, [queue.length, isConverting]);
  const doneItems = useMemo(() => queue.filter(isConvertedFile), [queue]);
  const completedCount = queue.filter((item) => item.status === "done" || item.status === "error").length;
  const progress = queue.length ? Math.round((completedCount / queue.length) * 100) : 0;

  async function convertAll() {
    if (!queue.length) return;
    setIsConverting(true);
    setStatus(`Converting ${queue.length} file${queue.length === 1 ? "" : "s"}...`);

    for (const item of queue) {
      setItemStatus(item.id, "converting");
      const result = await convertOne(item.file);

      if (result.ok) {
        setItemStatus(item.id, "done", result.outputName, result.outputName, result.blob);
        addHistory(item.file.name, result.outputName);
      } else {
        setItemStatus(item.id, "error", result.error);
      }
    }

    setIsConverting(false);
    setStatus("Batch complete.");
  }

  function downloadAll() {
    for (const item of doneItems) {
      downloadBlob(item.outputBlob, item.outputName ?? item.file.name.replace(/\.[^.]+$/, ".pdf"));
    }
  }

  function addFiles(files: FileList | File[]) {
    const nextFiles = Array.from(files);
    if (!nextFiles.length) return;

    setQueue((current) => [
      ...current,
      ...nextFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "ready" as const,
      })),
    ]);
    setStatus(`${nextFiles.length} file${nextFiles.length === 1 ? "" : "s"} added.`);
  }

  function addHistory(sourceName: string, outputName: string) {
    setHistory((current) => {
      const next = [{ id: crypto.randomUUID(), sourceName, outputName, convertedAt: new Date().toISOString() }, ...current];
      writeHistory(next);
      return next.slice(0, 6);
    });
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function removeItem(id: string) {
    setQueue((current) => current.filter((item) => item.id !== id));
    setPendingRemoval(null);
  }

  function setItemStatus(
    id: string,
    itemStatus: QueuedFile["status"],
    message?: string,
    outputName?: string,
    outputBlob?: Blob,
  ) {
    setQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, status: itemStatus, message, outputName, outputBlob } : item)),
    );
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <label
          className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/10" : "border-border bg-muted/25 hover:bg-muted/40"
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          <input className="sr-only" type="file" accept={accepted} multiple onChange={(event) => addFiles(event.target.files ?? [])} />
          <HugeiconsIcon icon={FileUploadIcon} size={34} strokeWidth={1.8} className="mb-4 text-muted-foreground" />
          <span className="text-lg font-semibold">Drop Office files here</span>
          <span className="mt-2 max-w-md text-sm text-muted-foreground">
            Add one or many XLSX, DOCX, or PPTX files. Each file downloads as its own PDF.
          </span>
          <span className="mt-5 rounded-md border border-border bg-background px-3 py-2 text-sm">
            {queue.length ? `${queue.length} selected` : "Browse files"}
          </span>
        </label>

        <div className="flex flex-col gap-3 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between">
          <ProgressSummary progress={progress} status={status} total={queue.length} />
          <div className="flex gap-2">
            {doneItems.length > 1 ? (
              <Button type="button" variant="outline" onClick={downloadAll} title="Download all PDFs">
                <HugeiconsIcon icon={FileDownloadIcon} size={16} strokeWidth={2} />
                Download all
              </Button>
            ) : null}
            <Button type="button" onClick={convertAll} disabled={!canConvert} title="Convert all to PDF">
              <HugeiconsIcon icon={isConverting ? Loading03Icon : PlayIcon} size={16} strokeWidth={2} />
              {isConverting ? "Working" : "Convert"}
            </Button>
          </div>
        </div>

        <QueueList items={queue} onRemoveRequest={setPendingRemoval} />
      </div>
      <HistoryPanel items={history} />
      <RemoveDialog
        item={pendingRemoval}
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => pendingRemoval && removeItem(pendingRemoval.id)}
      />
    </section>
  );
}

function isConvertedFile(item: QueuedFile): item is ConvertedFile {
  return item.outputBlob instanceof Blob;
}

function ProgressSummary({ progress, status, total }: { progress: number; status: string; total: number }) {
  return (
    <div className="min-w-0 flex-1" role="status">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-muted-foreground">{status}</span>
        <span className="font-medium">{total ? `${progress}%` : "Idle"}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function QueueList({
  items,
  onRemoveRequest,
}: {
  items: QueuedFile[];
  onRemoveRequest: (item: QueuedFile) => void;
}) {
  if (!items.length) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div className="flex items-center justify-between gap-3 rounded-md bg-muted/35 px-3 py-2 text-sm" key={item.id}>
          <StatusIcon status={item.status} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{item.file.name}</p>
            <p className="text-xs text-muted-foreground">{item.message ?? item.status}</p>
          </div>
          {isConvertedFile(item) ? <DownloadButton item={item} /> : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemoveRequest(item)}
            disabled={item.status === "converting"}
            title="Remove"
            aria-label={`Remove ${item.file.name}`}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
          </Button>
        </div>
      ))}
    </div>
  );
}

function RemoveDialog({
  item,
  onCancel,
  onConfirm,
}: {
  item: QueuedFile | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-lg"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-file-title"
        aria-describedby="remove-file-description"
      >
        <h2 id="remove-file-title" className="text-base font-semibold">
          Remove file?
        </h2>
        <p id="remove-file-description" className="mt-2 text-sm text-muted-foreground">
          This removes {item.file.name} from the queue. Converted output for this row will also be cleared.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

function DownloadButton({ item }: { item: ConvertedFile }) {
  const fileName = item.outputName ?? item.file.name.replace(/\.[^.]+$/, ".pdf");

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={() => downloadBlob(item.outputBlob, fileName)}
      title="Download PDF"
      aria-label={`Download ${fileName}`}
    >
      <HugeiconsIcon icon={Download04Icon} size={16} strokeWidth={2} />
    </Button>
  );
}

function StatusIcon({ status }: { status: QueuedFile["status"] }) {
  const icon = status === "done" ? CheckmarkCircle02Icon : status === "converting" ? Loading03Icon : status === "error" ? Cancel01Icon : FileUploadIcon;

  return (
    <span className="flex size-8 items-center justify-center rounded-md bg-background text-muted-foreground">
      <HugeiconsIcon icon={icon} size={16} strokeWidth={2} />
    </span>
  );
}

function HistoryPanel({ items }: { items: ConversionHistoryItem[] }) {
  return (
    <aside className="border-l border-border pl-0 lg:pl-6">
      <h2 className="text-base font-semibold">Recent conversions</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No conversions yet.</p> : null}
        {items.map((item) => (
          <div className="text-sm" key={item.id}>
            <p className="truncate font-medium">{item.outputName}</p>
            <p className="truncate text-muted-foreground">{item.sourceName}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

async function convertOne(file: File): Promise<{ ok: true; outputName: string; blob: Blob } | { ok: false; error: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/convert", { method: "POST", body: formData });

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    return { ok: false, error: body.error ?? "Conversion failed." };
  }

  const outputName = getOutputName(response, file.name);
  return { ok: true, outputName, blob: await response.blob() };
}

function getOutputName(response: Response, fallback: string): string {
  const disposition = response.headers.get("Content-Disposition") ?? "";
  return disposition.match(/filename="(.+)"/)?.[1] ?? fallback.replace(/\.[^.]+$/, ".pdf");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
