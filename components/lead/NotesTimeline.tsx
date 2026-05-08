"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { relativeTime } from "@/lib/utils/cn";
import type { LeadNote } from "@/types/database";

interface Props {
  leadId: string;
}

const MAX_CHARS = 2000;

export function NotesTimeline({ leadId }: Props) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/leads/${leadId}/notes`, {
          cache: "no-store"
        });
        if (!res.ok) {
          if (!cancelled) setLoaded(true);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setNotes(Array.isArray(data?.notes) ? (data.notes as LeadNote[]) : []);
        setLoaded(true);
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  async function save() {
    const content = input.trim();
    if (!content || saving) return;

    setSaving(true);
    setError(null);

    const tempId = `temp-${Date.now()}`;
    const placeholder: LeadNote = {
      id: tempId,
      lead_id: leadId,
      user_id: "",
      content,
      created_at: new Date().toISOString()
    };
    setNotes((prev) => [placeholder, ...prev]);
    setInput("");

    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setNotes((prev) => prev.filter((n) => n.id !== tempId));
        setError(
          data?.details === "content_too_long"
            ? "Note is too long."
            : data?.error
              ? "Could not save note. Try again."
              : "Could not save note. Try again."
        );
        setInput(content);
        return;
      }
      const data = await res.json();
      const saved = data?.note as LeadNote | undefined;
      if (!saved) {
        setNotes((prev) => prev.filter((n) => n.id !== tempId));
        setError("Could not save note. Try again.");
        setInput(content);
        return;
      }
      setNotes((prev) => prev.map((n) => (n.id === tempId ? saved : n)));
    } catch {
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      setError("Network error. Try again.");
      setInput(content);
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(id: string) {
    const previous = notes;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await fetch(`/api/leads/${leadId}/notes/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        setNotes(previous);
        setError("Could not delete note. Try again.");
      }
    } catch {
      setNotes(previous);
      setError("Network error. Try again.");
    }
  }

  return (
    <section>
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
        Notes
      </p>

      <div className="mb-4 rounded-lg border border-border bg-surface p-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Add a note..."
          rows={3}
          maxLength={MAX_CHARS}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] tabular-nums text-faint">
            {input.length} / {MAX_CHARS}
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={save}
            disabled={!input.trim() || saving}
            loading={saving}
          >
            Add note
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-[12px] text-danger-fg">{error}</p>
        )}
      </div>

      {!loaded ? (
        <p className="text-[13px] italic text-faint">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-[13px] italic text-faint">No notes yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="group relative rounded-md border border-border bg-surface p-4"
            >
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[11px] tabular-nums text-faint">
                  {relativeTime(n.created_at)}
                </span>
                <button
                  type="button"
                  onClick={() => deleteNote(n.id)}
                  className="text-[11px] text-faint opacity-0 transition-all hover:text-danger-fg group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-[1.6] text-text">
                {n.content}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
