"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProspect } from "@/app/actions/prospects";

const prospectSchema = z.object({
  name: z.string().min(1, "회사명을 입력해주세요"),
  contact_name: z.string().optional(),
  contact_email: z.string().email("올바른 이메일을 입력해주세요"),
  url: z.string().url("올바른 URL을 입력해주세요"),
  memo: z.string().optional(),
});

type ProspectFormData = z.infer<typeof prospectSchema>;

export function ProspectForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProspectFormData>({
    resolver: zodResolver(prospectSchema),
  });

  const onSubmit = async (data: ProspectFormData) => {
    try {
      const prospect = await createProspect({
        name: data.name,
        contact_name: data.contact_name || undefined,
        contact_email: data.contact_email,
        url: data.url,
        memo: data.memo || undefined,
      });

      toast.success("고객사가 등록되었습니다.");
      router.push(`/prospects/${prospect.id}/mix`);
    } catch (error) {
      console.error("Prospect 생성 실패:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "고객사 등록에 실패했습니다."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-lg border border-white/[0.03] bg-zinc-900/30 backdrop-blur-md p-6 space-y-6"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">
            회사명 <span className="text-red-400">*</span>
          </Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="예: 올리브영"
            className="mt-1"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="contact_name">담당자 이름</Label>
          <Input
            id="contact_name"
            {...register("contact_name")}
            placeholder="예: 홍길동"
            className="mt-1"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="contact_email">
            담당자 이메일 <span className="text-red-400">*</span>
          </Label>
          <Input
            id="contact_email"
            type="email"
            {...register("contact_email")}
            placeholder="예: contact@example.com"
            className="mt-1"
            disabled={isSubmitting}
          />
          {errors.contact_email && (
            <p className="mt-1 text-sm text-red-400">
              {errors.contact_email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="url">
            타겟 URL <span className="text-red-400">*</span>
          </Label>
          <Input
            id="url"
            type="url"
            {...register("url")}
            placeholder="예: https://store.example.com"
            className="mt-1"
            disabled={isSubmitting}
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-400">{errors.url.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="memo">메모</Label>
          <Textarea
            id="memo"
            {...register("memo")}
            placeholder="추가 정보를 입력하세요"
            className="mt-1"
            rows={4}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "등록 중..." : "등록하기"}
        </Button>
      </div>
    </form>
  );
}


















