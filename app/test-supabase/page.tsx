/**
 * @file page.tsx
 * @description Supabase 연동 테스트 페이지
 *
 * 이 페이지는 Supabase 데이터베이스와의 연동을 테스트하는 UI를 제공합니다.
 * - API 호출을 통한 데이터베이스 테스트
 * - 테스트 결과 시각화
 * - 에러 정보 표시
 *
 * @dependencies
 * - app/api/test-supabase: 테스트 API 엔드포인트
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2, Database, RefreshCw, Plus, Trash2 } from "lucide-react";

interface TestResult {
  timestamp: string;
  tests: Record<string, any>;
  errors: Array<{ test: string; error: string }>;
  summary?: {
    total_tests: number;
    passed: number;
    failed: number;
    success_rate: string;
  };
}

interface AddDataResult {
  success: boolean;
  table: string;
  data: any;
  message?: string;
  error?: string;
}

export default function TestSupabasePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 데이터 추가 관련 상태
  const [addLoading, setAddLoading] = useState(false);
  const [addResult, setAddResult] = useState<AddDataResult | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<"users" | "prospects" | "sequences">("users");
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    users: { clerk_id: "", email: "", name: "" },
    prospects: { user_id: "", name: "", contact_name: "", contact_email: "", url: "", memo: "" },
    sequences: { user_id: "", prospect_id: "", name: "", custom_context: "" },
  });
  
  // 추가된 데이터 목록
  const [addedData, setAddedData] = useState<Array<{ table: string; data: any; timestamp: string }>>([]);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.group("🧪 Supabase 테스트 시작");
      const response = await fetch("/api/test-supabase");
      const data = await response.json();

      console.log("📊 테스트 결과:", data);
      console.groupEnd();

      if (!response.ok && response.status !== 207) {
        throw new Error(data.error || "테스트 실행 실패");
      }

      setResult(data);
    } catch (err) {
      console.error("❌ 테스트 실행 중 에러:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 에러");
    } finally {
      setLoading(false);
    }
  };

  const addData = async () => {
    setAddLoading(true);
    setAddError(null);
    setAddResult(null);

    try {
      console.group(`➕ ${selectedTable} 데이터 추가 시작`);
      const currentFormData = formData[selectedTable];
      
      // 필수 필드 검증
      if (selectedTable === "users") {
        if (!currentFormData.clerk_id?.trim() || !currentFormData.email?.trim()) {
          throw new Error("clerk_id와 email은 필수입니다.");
        }
      } else if (selectedTable === "prospects") {
        if (
          !currentFormData.user_id?.trim() ||
          !currentFormData.name?.trim() ||
          !currentFormData.contact_email?.trim() ||
          !currentFormData.url?.trim()
        ) {
          throw new Error("user_id, name, contact_email, url은 필수입니다.");
        }
      } else if (selectedTable === "sequences") {
        if (
          !currentFormData.user_id?.trim() ||
          !currentFormData.prospect_id?.trim() ||
          !currentFormData.name?.trim()
        ) {
          throw new Error("user_id, prospect_id, name은 필수입니다.");
        }
      }
      
      const response = await fetch("/api/test-supabase/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: selectedTable,
          data: currentFormData,
        }),
      });

      const data = await response.json();
      console.log("📊 추가 결과:", data);
      console.groupEnd();

      if (!response.ok) {
        throw new Error(data.error || "데이터 추가 실패");
      }

      setAddResult(data);
      
      // 추가된 데이터를 목록에 추가
      setAddedData((prev) => [
        {
          table: selectedTable,
          data: data.data,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      // 폼 초기화
      const initialValues = {
        users: { clerk_id: "", email: "", name: "" },
        prospects: { user_id: "", name: "", contact_name: "", contact_email: "", url: "", memo: "" },
        sequences: { user_id: "", prospect_id: "", name: "", custom_context: "" },
      };
      
      setFormData((prev) => ({
        ...prev,
        [selectedTable]: initialValues[selectedTable],
      }));
    } catch (err) {
      console.error("❌ 데이터 추가 중 에러:", err);
      setAddError(err instanceof Error ? err.message : "알 수 없는 에러");
    } finally {
      setAddLoading(false);
    }
  };

  const deleteAddedData = (index: number) => {
    setAddedData((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8" />
          Supabase 연동 테스트
        </h1>
        <p className="text-muted-foreground">
          데이터베이스와의 연동 상태를 확인하고 테스트합니다.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>테스트 실행</CardTitle>
          <CardDescription>
            아래 버튼을 클릭하여 Supabase 데이터베이스 연동을 테스트합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runTests}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                테스트 실행 중...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                테스트 실행
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              에러 발생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 데이터 추가 섹션 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>데이터 추가 테스트</CardTitle>
          <CardDescription>
            직접 데이터를 입력하여 Supabase에 저장하고 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 테이블 선택 */}
          <div>
            <Label>테이블 선택</Label>
            <div className="flex gap-2 mt-2">
              {(["users", "prospects", "sequences"] as const).map((table) => (
                <Button
                  key={table}
                  variant={selectedTable === table ? "default" : "outline"}
                  onClick={() => setSelectedTable(table)}
                  className="flex-1"
                >
                  {table}
                </Button>
              ))}
            </div>
          </div>

          {/* 폼 입력 */}
          <div className="space-y-4">
            {selectedTable === "users" && (
              <>
                <div>
                  <Label htmlFor="clerk_id">Clerk ID</Label>
                  <Input
                    id="clerk_id"
                    value={formData.users.clerk_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        users: { ...prev.users, clerk_id: e.target.value },
                      }))
                    }
                    placeholder="test_user_123"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.users.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        users: { ...prev.users, email: e.target.value },
                      }))
                    }
                    placeholder="test@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.users.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        users: { ...prev.users, name: e.target.value },
                      }))
                    }
                    placeholder="테스트 사용자"
                  />
                </div>
              </>
            )}

            {selectedTable === "prospects" && (
              <>
                <div>
                  <Label htmlFor="user_id">User ID *</Label>
                  <Input
                    id="user_id"
                    value={formData.prospects.user_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prospects: { ...prev.prospects, user_id: e.target.value },
                      }))
                    }
                    placeholder="UUID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prospect_name">고객사 이름 *</Label>
                  <Input
                    id="prospect_name"
                    value={formData.prospects.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prospects: { ...prev.prospects, name: e.target.value },
                      }))
                    }
                    placeholder="테스트 고객사"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_name">담당자 이름</Label>
                  <Input
                    id="contact_name"
                    value={formData.prospects.contact_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prospects: { ...prev.prospects, contact_name: e.target.value },
                      }))
                    }
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">담당자 이메일 *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.prospects.contact_email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prospects: { ...prev.prospects, contact_email: e.target.value },
                      }))
                    }
                    placeholder="contact@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.prospects.url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prospects: { ...prev.prospects, url: e.target.value },
                      }))
                    }
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="memo">메모</Label>
                  <Input
                    id="memo"
                    value={formData.prospects.memo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prospects: { ...prev.prospects, memo: e.target.value },
                      }))
                    }
                    placeholder="테스트용 메모"
                  />
                </div>
              </>
            )}

            {selectedTable === "sequences" && (
              <>
                <div>
                  <Label htmlFor="seq_user_id">User ID *</Label>
                  <Input
                    id="seq_user_id"
                    value={formData.sequences.user_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sequences: { ...prev.sequences, user_id: e.target.value },
                      }))
                    }
                    placeholder="UUID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prospect_id">Prospect ID *</Label>
                  <Input
                    id="prospect_id"
                    value={formData.sequences.prospect_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sequences: { ...prev.sequences, prospect_id: e.target.value },
                      }))
                    }
                    placeholder="UUID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="seq_name">시퀀스 이름 *</Label>
                  <Input
                    id="seq_name"
                    value={formData.sequences.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sequences: { ...prev.sequences, name: e.target.value },
                      }))
                    }
                    placeholder="테스트 시퀀스"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="custom_context">커스텀 컨텍스트</Label>
                  <Input
                    id="custom_context"
                    value={formData.sequences.custom_context}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sequences: { ...prev.sequences, custom_context: e.target.value },
                      }))
                    }
                    placeholder="마케터 강점 (나만의 무기)"
                  />
                </div>
              </>
            )}
          </div>

          {/* 추가 버튼 */}
          <Button
            onClick={addData}
            disabled={addLoading}
            className="w-full"
          >
            {addLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                추가 중...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                데이터 추가
              </>
            )}
          </Button>

          {/* 추가 결과 */}
          {addResult && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-medium">{addResult.message}</p>
              </div>
              <details className="mt-2">
                <summary className="text-sm text-green-600 dark:text-green-400 cursor-pointer">
                  추가된 데이터 보기
                </summary>
                <pre className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs overflow-auto">
                  {JSON.stringify(addResult.data, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {addError && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <XCircle className="w-5 h-5" />
                <p className="font-medium">{addError}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가된 데이터 목록 */}
      {addedData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>추가된 데이터 목록</CardTitle>
            <CardDescription>
              이 페이지에서 추가한 데이터 목록입니다. (페이지 새로고침 시 초기화됩니다)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {addedData.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                        {item.table}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString("ko-KR")}
                      </span>
                    </div>
                    <details className="mt-2">
                      <summary className="text-sm text-muted-foreground cursor-pointer">
                        데이터 보기
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(item.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAddedData(index)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          {/* 요약 정보 */}
          {result.summary && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>테스트 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">전체 테스트</p>
                    <p className="text-2xl font-bold">{result.summary.total_tests}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">성공</p>
                    <p className="text-2xl font-bold text-green-600">
                      {result.summary.passed}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">실패</p>
                    <p className="text-2xl font-bold text-red-600">
                      {result.summary.failed}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">성공률</p>
                    <p className="text-2xl font-bold">{result.summary.success_rate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 테스트 결과 상세 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>테스트 결과 상세</CardTitle>
              <CardDescription>
                실행 시간: {new Date(result.timestamp).toLocaleString("ko-KR")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(result.tests).map(([testName, testResult]) => (
                  <div
                    key={testName}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{testName}</p>
                      {testResult.count !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          {testResult.count}개 항목 조회됨
                        </p>
                      )}
                      {testResult.data && (
                        <details className="mt-2">
                          <summary className="text-sm text-muted-foreground cursor-pointer">
                            데이터 보기
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(testResult.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 에러 정보 */}
          {result.errors.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">에러 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.errors.map((err, index) => (
                    <div key={index} className="p-3 bg-destructive/10 rounded-lg">
                      <p className="font-medium text-destructive">{err.test}</p>
                      <p className="text-sm text-muted-foreground">{err.error}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

