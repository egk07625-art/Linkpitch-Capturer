#!/bin/bash

BUCKET="app-assets"

echo "Creating storage bucket if not exists..."
supabase storage buckets create $BUCKET --public || true

# 폴더 경로 목록
FOLDERS=(
  "prospects/.keep"
  "reports/.keep"
  "emails/.keep"
  "thumbnails/.keep"
)

echo "Creating folders in bucket: $BUCKET"

for path in "${FOLDERS[@]}"
do
  echo "Uploading dummy file to: $path"
  echo "init" | supabase storage upload $BUCKET/$path --content-type "text/plain" >/dev/null
done

echo "🔥 Storage 폴더 자동 생성 완료!"
echo "📁 Bucket: $BUCKET"
echo "📂 Created folders: prospects, reports, emails, thumbnails"
