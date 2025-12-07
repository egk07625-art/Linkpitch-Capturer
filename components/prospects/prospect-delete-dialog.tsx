"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteProspect } from "@/app/actions/prospects";
import type { Prospect } from "@/types/prospect";

interface ProspectDeleteDialogProps {
  prospect: Prospect;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProspectDeleteDialog({
  prospect,
  open,
  onOpenChange,
}: ProspectDeleteDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteProspect(prospect.id);
      toast.success("고객사가 삭제되었습니다.");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Prospect 삭제 실패:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "고객사 삭제에 실패했습니다.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>고객사 삭제</DialogTitle>
          <DialogDescription>
            정말로 <strong>{prospect.name}</strong> 고객사를 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}












