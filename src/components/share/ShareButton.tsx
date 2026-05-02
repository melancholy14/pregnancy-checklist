"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareModal } from "./ShareModal";
import { triggerShare, type ShareContentType } from "@/lib/share";

interface ShareButtonProps {
  title: string;
  description: string;
  url: string;
  contentType: ShareContentType;
  itemId: string;
  className?: string;
  label?: string;
}

export function ShareButton({
  title,
  description,
  url,
  contentType,
  itemId,
  className = "",
  label = "공유하기",
}: ShareButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = () => {
    triggerShare({
      data: { title, text: description, url },
      contentType,
      itemId,
      onFallback: () => setModalOpen(true),
    });
  };

  const buttonClass =
    `inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-muted hover:bg-muted/80 text-sm font-medium text-foreground transition-colors ${className}`.trim();

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        className={buttonClass}
      >
        <Share2 size={15} strokeWidth={1.8} />
        {label}
      </button>

      <ShareModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        url={url}
        title={title}
        contentType={contentType}
        itemId={itemId}
      />
    </>
  );
}
