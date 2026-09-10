"use client";

import { useRef, useState } from "react";
import { saveAppNotes } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { renderMarkdownToHtml } from "@/lib/inventaire/markdown";

function wrapSelection(textarea: HTMLTextAreaElement, marker: string) {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd) || "texte";
  textarea.value = value.slice(0, selectionStart) + marker + selected + marker + value.slice(selectionEnd);
  textarea.setSelectionRange(selectionStart + marker.length, selectionStart + marker.length + selected.length);
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function prefixLines(textarea: HTMLTextAreaElement, prefix: string) {
  const { selectionStart, selectionEnd, value } = textarea;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd = value.indexOf("\n", selectionEnd) === -1 ? value.length : value.indexOf("\n", selectionEnd);
  const block = value.slice(lineStart, lineEnd);
  const prefixed = block
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line}`))
    .join("\n");
  textarea.value = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
  textarea.setSelectionRange(lineStart, lineStart + prefixed.length);
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

export function AccesNotesForm({ content }: { content: string | null }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(content ?? "");
  const [showPreview, setShowPreview] = useState(false);

  return (
    <ActionForm className="card p-5" autoSave action={saveAppNotes}>
      {({ pending, error, success }) => (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={showPreview}
                onClick={() => textareaRef.current && wrapSelection(textareaRef.current, "**")}
                className="btn-secondary btn-sm px-3 font-semibold"
                title="Gras"
              >
                G
              </button>
              <button
                type="button"
                disabled={showPreview}
                onClick={() => textareaRef.current && wrapSelection(textareaRef.current, "*")}
                className="btn-secondary btn-sm px-3 italic"
                title="Italique"
              >
                I
              </button>
              <button
                type="button"
                disabled={showPreview}
                onClick={() => textareaRef.current && wrapSelection(textareaRef.current, "`")}
                className="btn-secondary btn-sm px-3 font-mono"
                title="Code"
              >
                {"</>"}
              </button>
              <button
                type="button"
                disabled={showPreview}
                onClick={() => textareaRef.current && prefixLines(textareaRef.current, "- ")}
                className="btn-secondary btn-sm"
                title="Liste à puces"
              >
                • Liste
              </button>
              <button
                type="button"
                disabled={showPreview}
                onClick={() => textareaRef.current && prefixLines(textareaRef.current, "## ")}
                className="btn-secondary btn-sm"
                title="Titre"
              >
                Titre
              </button>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className={`btn-secondary btn-sm ${showPreview ? "bg-[#0071e3]/10 text-[#0071e3]" : ""}`}
              >
                {showPreview ? "✎ Éditer" : "👁 Aperçu"}
              </button>
            </div>
            <SaveStatus pending={pending} error={error} success={success} />
          </div>

          {showPreview ? (
            <div
              className="prose-notes mt-2 min-h-[24rem] w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[14px] text-[#1d1d1f]
                [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]
                [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h4]:mb-1 [&_h4]:mt-3 [&_h4]:text-[15px] [&_h4]:font-semibold
                [&_h5]:mb-1 [&_h5]:mt-3 [&_h5]:text-[14px] [&_h5]:font-semibold
                [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{
                __html: value.trim()
                  ? renderMarkdownToHtml(value)
                  : '<p class="text-black/35">Aucun contenu.</p>',
              }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              name="content"
              defaultValue={content ?? ""}
              onChange={(e) => setValue(e.target.value)}
              rows={20}
              placeholder="Ex. : identifiants Supabase, GitHub, mots de passe divers… (Markdown : **gras**, *italique*, - liste, ## titre)"
              className="mt-2 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 font-mono text-[14px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
            />
          )}

          {showPreview && <input type="hidden" name="content" value={value} readOnly />}
        </>
      )}
    </ActionForm>
  );
}
