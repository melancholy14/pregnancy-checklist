"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { PageDescription } from "@/components/common/PageDescription";
import { ChecklistProgress } from "./ChecklistProgress";
import { ChecklistRelatedContent } from "./ChecklistRelatedContent";
import { ChecklistAddForm } from "./ChecklistAddForm";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { ChecklistEmptyState, type ChecklistEmptyStateCase } from "./ChecklistEmptyState";
import { AllDoneBadge } from "./AllDoneBadge";
import { ShareButton } from "@/components/share/ShareButton";
import { sendGAEvent } from "@/lib/analytics";
import { BASE_URL } from "@/lib/constants";
import type { ArticleMeta } from "@/types/article";
import type { VideoItem } from "@/types/video";
import type { ChecklistData, ChecklistItem } from "@/types/checklist";
import {
  CHECKLIST_STORE_BY_SLUG,
  type ChecklistStoreSlug,
} from "@/store/createChecklistStore";

export type { ChecklistStoreSlug };

const EMPTY_CHECKED_IDS: string[] = [];
const ITEMS_ANCHOR_ID = "checklist-items";

interface ChecklistPageProps {
  data: ChecklistData;
  storeSlug: ChecklistStoreSlug;
  linkedArticles: ArticleMeta[];
  linkedVideos: VideoItem[];
}

export function ChecklistPage({ data, storeSlug, linkedArticles, linkedVideos }: ChecklistPageProps) {
  const { meta, items: baseItems } = data;
  const useStore = CHECKLIST_STORE_BY_SLUG[storeSlug];
  const {
    checkedIds,
    customItems,
    migrationLostFlag,
    toggle,
    addCustomItem,
    removeCustomItem,
    updateCustomItem,
    clearMigrationLost,
  } = useStore();
  const hydrated = useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false
  );
  const router = useRouter();

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

  const allDone = useMemo(
    () =>
      hydrated &&
      allItems.length > 0 &&
      allItems.every((i) => effectiveCheckedIds.includes(i.id)),
    [hydrated, allItems, effectiveCheckedIds]
  );

  const emptyStateCase = useMemo<ChecklistEmptyStateCase | null>(() => {
    if (!hydrated) return null;
    if (migrationLostFlag) return "migration_lost";
    if (effectiveCheckedIds.length === 0 && customItems.length === 0) return "first_visit";
    if (baseItems.length === 0 && customItems.length >= 1) return "custom_only";
    return null;
  }, [hydrated, migrationLostFlag, effectiveCheckedIds.length, customItems.length, baseItems.length]);

  const allDoneToastEvaluatedRef = useRef(false);
  useEffect(() => {
    if (!hydrated || allDoneToastEvaluatedRef.current) return;
    allDoneToastEvaluatedRef.current = true;
    if (!allDone) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const delay = prefersReducedMotion ? 0 : 100;
    const timer = window.setTimeout(() => {
      toast("다른 체크리스트도 살펴보시겠어요?", {
        duration: 3000,
        action: {
          label: "둘러보기",
          onClick: () => router.push("/checklist"),
        },
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [hydrated, allDone, router]);

  const handleBrowse = useCallback(() => {
    if (typeof window === "undefined") return;
    const target = document.getElementById(ITEMS_ANCHOR_ID);
    if (!target) return;
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  const handleToggle = useCallback(
    (item: ChecklistItem) => {
      const willCheck = !effectiveCheckedIds.includes(item.id);
      toggle(item.id);
      if (migrationLostFlag) {
        clearMigrationLost();
      }
      sendGAEvent("checklist_check", {
        category: item.category,
        item_id: item.id,
        checked: willCheck,
        slug: meta.slug,
      });
    },
    [effectiveCheckedIds, toggle, meta.slug, migrationLostFlag, clearMigrationLost]
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

        {allDone && <AllDoneBadge />}

        <div className="flex justify-end mb-4">
          <ShareButton
            title={meta.title}
            description={meta.description}
            url={`${BASE_URL}/checklist/${meta.slug}`}
            contentType="checklist"
            itemId={meta.slug}
          />
        </div>

        {emptyStateCase && (
          <ChecklistEmptyState
            case={emptyStateCase}
            onBrowse={handleBrowse}
            onMigrationConfirm={clearMigrationLost}
          />
        )}

        <ChecklistProgress
          items={allItems}
          checkedIds={effectiveCheckedIds}
          subcategories={meta.subcategories}
        />

        <div id={ITEMS_ANCHOR_ID} className="space-y-6 mb-8 scroll-mt-4">
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
