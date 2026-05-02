"use client";

import { Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { copyShareLink, type ShareContentType } from "@/lib/share";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
  contentType: ShareContentType;
  itemId: string;
}

export function ShareModal({
  open,
  onOpenChange,
  url,
  title,
  contentType,
  itemId,
}: ShareModalProps) {
  const handleCopy = async () => {
    await copyShareLink(url, { contentType, itemId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">공유하기</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground line-clamp-2">
            {title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            readOnly
            value={url}
            aria-label="공유 링크"
            className="flex-1 min-w-0 bg-input-background border border-black/5 rounded-xl px-3 h-10 text-sm text-foreground"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            onClick={handleCopy}
            aria-label="링크 복사"
            className="inline-flex items-center gap-1.5 px-4 h-10 shrink-0 rounded-xl bg-pastel-pink hover:bg-pastel-pink-hover text-foreground text-sm font-semibold transition-colors"
          >
            <Copy size={15} strokeWidth={1.8} />
            복사
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
