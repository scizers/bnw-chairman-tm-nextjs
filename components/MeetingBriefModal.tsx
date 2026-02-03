"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Spin } from "antd";
import { momsApi } from "@/lib/api/moms";

interface MeetingBriefModalProps {
  open: boolean;
  momIds: string[];
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

const SECTION_ORDER = [
  "Executive Summary",
  "Key Topics",
  "Decisions",
  "Open Items",
  "Repeated Concerns",
  "Suggested Talking Points"
];

const HEADER_MAP: Record<string, string> = {
  "executive summary": "Executive Summary",
  "key topics": "Key Topics",
  "key discussion themes": "Key Topics",
  "decisions": "Decisions",
  "decisions made": "Decisions",
  "open items": "Open Items",
  "open action items": "Open Items",
  "repeated concerns": "Repeated Concerns",
  "suggested talking points": "Suggested Talking Points",
  "suggested talking points for next meeting": "Suggested Talking Points"
};

const parseMeetingBrief = (summaryText: string) => {
  if (!summaryText) {
    return SECTION_ORDER.map((title) => ({ title, content: "" }));
  }

  const sections: Record<string, string[]> = {};
  SECTION_ORDER.forEach((title) => {
    sections[title] = [];
  });

  const lines = summaryText.split(/\r?\n/);
  let currentSection = "";

  lines.forEach((line) => {
    const trimmed = line.trim();
    const normalized = trimmed.replace(/:$/, "").toLowerCase();
    const mapped = HEADER_MAP[normalized];

    if (mapped) {
      currentSection = mapped;
      return;
    }

    if (!currentSection) {
      currentSection = "Executive Summary";
    }

    sections[currentSection].push(line);
  });

  return SECTION_ORDER.map((title) => ({
    title,
    content: sections[title].join("\n").trim()
  }));
};

export default function MeetingBriefModal({
  open,
  momIds,
  onClose,
  onLoadingChange
}: MeetingBriefModalProps) {
  const [summaryText, setSummaryText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState("");
  const [downloading, setDownloading] = useState(false);
  const shouldShowLoading =
    loading || (open && momIds.length > 0 && !summaryText && !error);

  useEffect(() => {
    if (!open) return;
    if (!momIds.length) {
      setSummaryText("");
      setError("No meetings selected.");
      setLoading(false);
      onLoadingChange?.(false);
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      onLoadingChange?.(true);
      setError(null);
      setShareFeedback("");
      setSummaryText("");
      try {
        const result = await momsApi.generateMeetingBrief(momIds);
        if (!active) return;
        setSummaryText(result?.summaryText || "");
      } catch (err) {
        if (active) setError("Unable to generate meeting brief.");
      } finally {
        if (active) setLoading(false);
        onLoadingChange?.(false);
      }
    };

    void load();

    return () => {
      active = false;
      onLoadingChange?.(false);
    };
  }, [open, momIds, onLoadingChange]);

  const sections = useMemo(() => parseMeetingBrief(summaryText), [summaryText]);

  const handleShare = async () => {
    if (!summaryText) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Meeting Brief",
          text: summaryText
        });
        setShareFeedback("Shared successfully.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summaryText);
        setShareFeedback("Copied to clipboard.");
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = summaryText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setShareFeedback("Copied to clipboard.");
    } catch (err) {
      setShareFeedback("Unable to share right now.");
    }
  };

  const handleDownloadPdf = async () => {
    if (!summaryText) return;
    setDownloading(true);
    try {
      const result = await momsApi.downloadMeetingBriefPdf(summaryText);
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename || "meeting-brief.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setShareFeedback("Unable to download PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      title="Meeting Brief"
      destroyOnHidden
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
    >
      {shouldShowLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Spin size="large" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : !summaryText ? (
        <p className="text-sm text-text-muted">No meeting brief available.</p>
      ) : (
        <div className="space-y-6">
          <div className="space-y-5">
            {sections.map((section) => (
              <div key={section.title}>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                  {section.title}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-primary">
                  {section.content || "—"}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-4">
            <Button onClick={handleShare} disabled={!summaryText}>
              Share
            </Button>
            <Button
              type="primary"
              onClick={handleDownloadPdf}
              loading={downloading}
              disabled={!summaryText}
            >
              Download PDF
            </Button>
            {shareFeedback ? (
              <span className="text-xs text-text-muted">{shareFeedback}</span>
            ) : null}
          </div>
        </div>
      )}
    </Modal>
  );
}
