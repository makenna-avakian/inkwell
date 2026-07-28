"use client";

export interface SocialLink {
  id: string;
  label: string;
  url: string;
}

interface SocialLinksEditorProps {
  socialLinks: SocialLink[];
  onChange: (socialLinks: SocialLink[]) => void;
}

export default function SocialLinksEditor({ socialLinks, onChange }: SocialLinksEditorProps) {
  function addLink() {
    onChange([...socialLinks, { id: crypto.randomUUID(), label: "", url: "" }]);
  }

  function updateLink(id: string, patch: Partial<SocialLink>) {
    onChange(socialLinks.map((link) => (link.id === id ? { ...link, ...patch } : link)));
  }

  function removeLink(id: string) {
    onChange(socialLinks.filter((link) => link.id !== id));
  }

  return (
    <div data-testid="social-links-editor">
      {socialLinks.map((link) => (
        <div key={link.id} className="mb-3 flex gap-2" data-testid={`social-links-editor-row-${link.id}`}>
          <input
            value={link.label}
            onChange={(e) => updateLink(link.id, { label: e.target.value })}
            placeholder="Label (e.g. Instagram)"
            data-testid="social-links-editor-label-input"
            className="w-1/3 border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
          />
          <input
            value={link.url}
            onChange={(e) => updateLink(link.id, { url: e.target.value })}
            placeholder="https://..."
            data-testid="social-links-editor-url-input"
            className="flex-1 border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeLink(link.id)}
            data-testid="social-links-editor-remove-button"
            className="text-xs font-medium tracking-[0.1em] text-muted uppercase transition-colors hover:text-accent"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addLink}
        data-testid="social-links-editor-add-button"
        className="text-xs font-medium tracking-[0.1em] text-foreground uppercase underline underline-offset-4 transition-colors hover:text-accent"
      >
        + Add Link
      </button>
    </div>
  );
}
