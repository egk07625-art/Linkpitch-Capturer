"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, Trash2, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProspectEditDialog } from "./prospect-edit-dialog";
import { ProspectDeleteDialog } from "./prospect-delete-dialog";
import type { Prospect } from "@/types/prospect";
import { useRouter } from "next/navigation";

interface ProspectActionsMenuProps {
  prospect: Prospect;
}

export function ProspectActionsMenu({ prospect }: ProspectActionsMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            편집
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/prospects/${prospect.id}/mix`);
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            이메일 편집
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              // TODO: 시퀀스 생성 기능 연결
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            시퀀스 생성
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
            className="text-red-400 focus:text-red-300"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProspectEditDialog
        prospect={prospect}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ProspectDeleteDialog
        prospect={prospect}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

