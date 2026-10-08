"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/settings/service";
import styles from "./SettingsForm.module.css";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [siteTitle, setSiteTitle] = useState(initial.siteTitle);
  const [siteDescription, setSiteDescription] = useState(initial.siteDescription ?? "");
  const [about, setAbout] = useState(initial.about ?? "");
  const [contactEmail, setContactEmail] = useState(initial.contactEmail ?? "");
  const [links, setLinks] = useState(initial.links);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  function updateLink(index: number, field: "label" | "url", value: string) {
    setLinks((prev) => prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteTitle,
        siteDescription,
        about,
        contactEmail,
        // Rows left completely empty are dropped rather than rejected.
        links: links.filter((l) => l.label.trim() || l.url.trim()),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const { issues = [] } = await res.json().catch(() => ({}));
      const linkIssue = issues.some((p: string) => p.startsWith("links"));
      setStatus({
        ok: false,
        message: linkIssue
          ? "Each link needs a label and a full URL starting with https://."
          : issues.includes("contactEmail")
            ? "That email address doesn't look right."
            : "Couldn't save. Check the fields and try again.",
      });
      return;
    }

    const { settings } = await res.json();
    setLinks(settings.links);
    setStatus({ ok: true, message: "Saved" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>Site settings</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Site</h2>
        <label htmlFor="siteTitle">Site title</label>
        <input
          id="siteTitle"
          value={siteTitle}
          onChange={(e) => setSiteTitle(e.target.value)}
          placeholder="Your name or studio"
          required
          maxLength={100}
        />
        <label htmlFor="siteDescription">Short description</label>
        <input
          id="siteDescription"
          value={siteDescription}
          onChange={(e) => setSiteDescription(e.target.value)}
          placeholder="Landscape and street photography from the Pacific Northwest"
          maxLength={300}
        />
        <p className={styles.hint}>Shown in search results and when your site is shared.</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>About page</h2>
        <label htmlFor="about">About you</label>
        <textarea
          id="about"
          rows={8}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          maxLength={5000}
        />
        <p className={styles.hint}>Leave a blank line between paragraphs.</p>

        <label htmlFor="contactEmail">Contact email</label>
        <input
          id="contactEmail"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="hello@example.com"
        />

        <span className={styles.label}>Links</span>
        {links.map((link, index) => (
          <div key={index} className={styles.linkRow}>
            <input
              aria-label={`Link ${index + 1} label`}
              value={link.label}
              onChange={(e) => updateLink(index, "label", e.target.value)}
              placeholder="Instagram"
              maxLength={50}
            />
            <input
              aria-label={`Link ${index + 1} URL`}
              type="url"
              value={link.url}
              onChange={(e) => updateLink(index, "url", e.target.value)}
              placeholder="https://instagram.com/you"
            />
            <button
              type="button"
              className="secondary"
              onClick={() => setLinks((prev) => prev.filter((_, i) => i !== index))}
              aria-label={`Remove link ${index + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
        {links.length < 12 && (
          <button
            type="button"
            className={`secondary ${styles.addLink}`}
            onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
          >
            Add link
          </button>
        )}
        <p className={styles.hint}>
          The About page appears in your site&apos;s navigation once any of these are filled in.
        </p>
      </section>

      <div className={styles.actions}>
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        {status && (
          <span role="status" className={status.ok ? styles.saved : styles.error}>
            {status.message}
          </span>
        )}
      </div>
    </form>
  );
}
