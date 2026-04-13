"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  onConfirm: () => void;
  iconSize?: number;
}

export function DeleteConfirmDialog({ onConfirm, iconSize = 16 }: DeleteConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="p-2 rounded-lg text-[#9CA0A4] hover:text-red-400 hover:bg-red-50 transition-colors"
          aria-label="삭제"
        >
          <Trash2 size={iconSize} />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">이 항목을 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>삭제된 항목은 복구할 수 없습니다.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl text-sm">취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl text-sm bg-red-500 hover:bg-red-600 text-white"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
