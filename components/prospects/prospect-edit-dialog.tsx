"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProspect } from "@/app/actions/prospects";
import type { Prospect, UpdateProspectInput } from "@/types/prospect";

interface ProspectEditDialogProps {
  prospect: Prospect;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProspectEditDialog({
  prospect,
  open,
  onOpenChange,
}: ProspectEditDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: prospect.name,
    contact_name: prospect.contact_name || "",
    contact_email: prospect.contact_email || "",
    url: prospect.url || "",
    memo: prospect.memo || "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: prospect.name,
        contact_name: prospect.contact_name || "",
        contact_email: prospect.contact_email || "",
        url: prospect.url || "",
        memo: prospect.memo || "",
      });
    }
  }, [open, prospect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: UpdateProspectInput = {
        name: formData.name,
        contact_name: formData.contact_name || undefined,
        contact_email: formData.contact_email || undefined,
        url: formData.url || undefined,
        memo: formData.memo || undefined,
      };

      await updateProspect(prospect.id, updateData);
      toast.success("고객사 정보가 업데이트되었습니다.");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Prospect 업데이트 실패:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "고객사 정보 업데이트에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>고객사 정보 편집</DialogTitle>
            <DialogDescription>
              고객사 정보를 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">
                회사명 <span className="text-red-400">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-contact-name">담당자 이름</Label>
              <Input
                id="edit-contact-name"
                value={formData.contact_name}
                onChange={(e) =>
                  setFormData({ ...formData, contact_name: e.target.value })
                }
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-contact-email">담당자 이메일</Label>
              <Input
                id="edit-contact-email"
                type="email"
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-url">타겟 URL</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-memo">메모</Label>
              <Textarea
                id="edit-memo"
                value={formData.memo}
                onChange={(e) =>
                  setFormData({ ...formData, memo: e.target.value })
                }
                className="mt-1"
                rows={4}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

