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
import { Switch } from "@/components/ui/switch";
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
import { classifyNote } from "@/lib/note-classifier";
import type { ArticleMeta } from "@/types/article";
import type { VideoItem } from "@/types/video";
import type { ChecklistData, ChecklistItem } from "@/types/checklist";
import {
  CHECKLIST_STORE_BY_SLUG,
  type ChecklistStoreSlug,
} from "@/store/createChecklistStore";
import { useDueDateStore } from "@/store/useDueDateStore";

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
  const currentPregnancyWeek = useDueDateStore((s) => s.currentPregnancyWeek);
  const router = useRouter();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showUncheckedOnly, setShowUncheckedOnly] = useState(false);

  const allItems = useMemo<ChecklistItem[]>(
    () => [...baseItems, ...customItems],
    [baseItems, customItems]
  );

  const effectiveCheckedIds = useMemo<string[]>(
    () => (hydrated ? checkedIds : EMPTY_CHECKED_IDS),
    [hydrated, checkedIds]
  );

  const isHighlighted = useCallback(
    (item: ChecklistItem) =>
      currentPregnancyWeek !== null &&
      item.recommendedWeek !== 0 &&
      item.recommendedWeek === currentPregnancyWeek,
    [currentPregnancyWeek]
  );

  const recommendedViewCount = useMemo(
    () =>
      currentPregnancyWeek === null
        ? 0
        : allItems.filter(
            (item) =>
              item.recommendedWeek !== 0 &&
              item.recommendedWeek === currentPregnancyWeek &&
              !effectiveCheckedIds.includes(item.id)
          ).length,
    [allItems, currentPregnancyWeek, effectiveCheckedIds]
  );

  const recommendedViewSentRef = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (recommendedViewSentRef.current) return;
    if (currentPregnancyWeek === null) return;
    if (recommendedViewCount === 0) return;
    recommendedViewSentRef.current = true;
    sendGAEvent("recommended_item_view", {
      count: recommendedViewCount,
      week: currentPregnancyWeek,
      slug: meta.slug,
    });
  }, [hydrated, currentPregnancyWeek, recommendedViewCount, meta.slug]);

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
      const noteType = classifyNote(item.note);
      sendGAEvent("checklist_check", {
        category: item.category,
        item_id: item.id,
        checked: willCheck,
        slug: meta.slug,
        note_type: item.note ? noteType : null,
      });
      if (
        willCheck &&
        currentPregnancyWeek !== null &&
        item.recommendedWeek !== 0 &&
        item.recommendedWeek === currentPregnancyWeek
      ) {
        sendGAEvent("recommended_item_check", {
          item_id: item.id,
          category: item.category,
          week: currentPregnancyWeek,
          slug: meta.slug,
        });
      }
      if (
        willCheck &&
        currentPregnancyWeek !== null &&
        item.recommendedWeek !== 0 &&
        item.recommendedWeek > currentPregnancyWeek
      ) {
        sendGAEvent("upcoming_item_check", {
          item_id: item.id,
          weeks_ahead: item.recommendedWeek - currentPregnancyWeek,
        });
      }
    },
    [
      effectiveCheckedIds,
      toggle,
      meta.slug,
      migrationLostFlag,
      clearMigrationLost,
      currentPregnancyWeek,
    ]
  );

  const handleToggleUncheckedOnly = useCallback((checked: boolean) => {
    setShowUncheckedOnly(checked);
    sendGAEvent("checklist_filter", {
      filter_type: "uncheck_only",
      value: checked ? "on" : "off",
    });
  }, []);

  const visibleItemCount = useMemo(() => {
    if (!showUncheckedOnly) return allItems.length;
    return allItems.filter((i) => !effectiveCheckedIds.includes(i.id)).length;
  }, [allItems, effectiveCheckedIds, showUncheckedOnly]);

  const showFilterEmptyState =
    hydrated && showUncheckedOnly && visibleItemCount === 0 && allItems.length > 0;

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
    <div className="min-h-screen pb-24 px-4 bg-background">
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
            position="top_right"
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

        {allItems.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-1">
            <label
              htmlFor="uncheck-only-toggle"
              className="text-sm text-foreground select-none cursor-pointer"
            >
              미체크만 보기
            </label>
            <Switch
              id="uncheck-only-toggle"
              checked={showUncheckedOnly}
              onCheckedChange={handleToggleUncheckedOnly}
              className="data-[state=checked]:bg-pastel-lavender data-[state=unchecked]:bg-muted focus-visible:ring-2 focus-visible:ring-pastel-lavender focus-visible:ring-offset-2"
              aria-label="미체크만 보기"
            />
          </div>
        )}

        <div id={ITEMS_ANCHOR_ID} className="space-y-6 mb-8 scroll-mt-4">
          {meta.subcategories.map((sub) => {
            const subItems = allItems.filter((i) => i.category === sub.key);
            if (subItems.length === 0) return null;
            const subChecked = subItems.filter((i) => effectiveCheckedIds.includes(i.id)).length;
            const subVisibleItems = showUncheckedOnly
              ? subItems.filter((i) => !effectiveCheckedIds.includes(i.id))
              : subItems;
            if (subVisibleItems.length === 0) return null;

            return (
              <section key={sub.key}>
                <div className="flex items-center justify-between mb-3 pl-2">
                  <h2>{sub.label}</h2>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {subChecked}/{subItems.length}
                  </span>
                </div>
                <Card className="rounded-2xl border border-black/4">
                  <CardContent className="p-2 space-y-1">
                    {subVisibleItems.map((item) => (
                      <ChecklistItemRow
                        key={item.id}
                        item={item}
                        slug={meta.slug}
                        isChecked={effectiveCheckedIds.includes(item.id)}
                        isHighlighted={isHighlighted(item)}
                        isEditing={editingId === item.id}
                        editTitle={editTitle}
                        currentPregnancyWeek={currentPregnancyWeek}
                        isHydrated={hydrated}
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
          {showFilterEmptyState && (
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground text-center py-6"
              style={{ wordBreak: "keep-all" }}
            >
              지금 보이는 항목은 모두 체크했어요
            </p>
          )}
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
