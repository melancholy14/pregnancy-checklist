"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageDescription } from "@/components/common/PageDescription";
import { ChecklistProgress } from "./ChecklistProgress";
import { ChecklistRelatedContent } from "./ChecklistRelatedContent";
import { ChecklistAddForm } from "./ChecklistAddForm";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { sendGAEvent } from "@/lib/analytics";
import type { ArticleMeta } from "@/types/article";
import type { VideoItem } from "@/types/video";
import type { ChecklistData, ChecklistItem } from "@/types/checklist";
import {
  CHECKLIST_STORE_BY_SLUG,
  type ChecklistStoreSlug,
} from "@/store/createChecklistStore";

export type { ChecklistStoreSlug };

const EMPTY_CHECKED_IDS: string[] = [];

interface ChecklistPageProps {
  data: ChecklistData;
  storeSlug: ChecklistStoreSlug;
  linkedArticles: ArticleMeta[];
  linkedVideos: VideoItem[];
}

export function ChecklistPage({ data, storeSlug, linkedArticles, linkedVideos }: ChecklistPageProps) {
  const { meta, items: baseItems } = data;
  const useStore = CHECKLIST_STORE_BY_SLUG[storeSlug];
  const { checkedIds, customItems, toggle, addCustomItem, removeCustomItem, updateCustomItem } = useStore();
  const hydrated = useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const allItems = useMemo<ChecklistItem[]>(
    () => [...baseItems, ...customItems],
    [baseItems, customItems]
  );

  const effectiveCheckedIds = useMemo<string[]>(
    () => (hydrated ? checkedIds : EMPTY_CHECKED_IDS),
    [hydrated, checkedIds]
  );

  const handleToggle = useCallback(
    (item: ChecklistItem) => {
      const willCheck = !checkedIds.includes(item.id);
      toggle(item.id);
      sendGAEvent("checklist_check", {
        category: item.category,
        item_id: item.id,
        checked: willCheck,
        slug: meta.slug,
      });
    },
    [checkedIds, toggle, meta.slug]
  );

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const saveEdit = () => {
    if (!editingId || !editTitle.trim()) return;
    updateCustomItem(editingId, { title: editTitle.trim() });
    setEditingId(null);
  };

  return (
    <div className="min-h-screen pb-24 px-4 bg-linear-to-b from-background to-white">
      <div className="pt-8">
        <h1 className="mb-2 text-center">
          <span className="mr-1.5">{meta.icon}</span>
          {meta.title}
        </h1>
        <PageDescription>{meta.description}</PageDescription>

        <ChecklistProgress
          items={allItems}
          checkedIds={effectiveCheckedIds}
          subcategories={meta.subcategories}
        />

        <div className="space-y-6 mb-8">
          {meta.subcategories.map((sub) => {
            const subItems = allItems.filter((i) => i.category === sub.key);
            if (subItems.length === 0) return null;
            const subChecked = subItems.filter((i) => effectiveCheckedIds.includes(i.id)).length;

            return (
              <section key={sub.key}>
                <div className="flex items-center justify-between mb-3 pl-2">
                  <h2 className="text-[15px] font-medium">{sub.label}</h2>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {subChecked}/{subItems.length}
                  </span>
                </div>
                <Card className="rounded-xl border border-black/4">
                  <CardContent className="p-2 space-y-1">
                    {subItems.map((item) => (
                      <ChecklistItemRow
                        key={item.id}
                        item={item}
                        isChecked={effectiveCheckedIds.includes(item.id)}
                        isEditing={editingId === item.id}
                        editTitle={editTitle}
                        onToggle={() => handleToggle(item)}
                        onStartEdit={() => startEdit(item)}
                        onChangeEditTitle={setEditTitle}
                        onSaveEdit={saveEdit}
                        onCancelEdit={() => setEditingId(null)}
                        onRemove={() => removeCustomItem(item.id)}
                      />
                    ))}
                  </CardContent>
                </Card>
              </section>
            );
          })}
        </div>

        <ChecklistRelatedContent
          linkedArticles={linkedArticles}
          linkedTimelineWeeks={meta.linked_timeline_weeks ?? []}
          linkedVideos={linkedVideos}
        />

        {showAddForm && (
          <ChecklistAddForm
            storeSlug={meta.slug}
            subcategories={meta.subcategories}
            onAdd={addCustomItem}
            onClose={() => setShowAddForm(false)}
          />
        )}

        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="fixed fab-bottom-safe right-6 w-14 h-14 rounded-2xl bg-pastel-lavender shadow-lg flex items-center justify-center hover:bg-pastel-lavender/80 hover:shadow-xl transition-all duration-200 z-10"
          aria-label="항목 추가"
        >
          <Plus size={24} className="text-foreground" />
        </button>
      </div>
    </div>
  );
}
