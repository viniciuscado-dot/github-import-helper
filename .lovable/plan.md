

## Plan: Accept PDF and HTML Files in Briefing Upload

### Problem
PDF text extraction via `pdf-parse` fails on scanned/image-based PDFs, resulting in 0/100 scores. HTML files contain readily extractable text and would solve this.

### Changes

**1. Frontend — `src/components/TestCopyBriefingForm.tsx`**
- Update `accept` attribute from `.pdf` to `.pdf,.html,.htm`
- Update file type validation in `handleDrop` and `handleFileSelect` to accept `application/pdf`, `text/html`, and files ending in `.html`/`.htm`
- Update UI text from "PDF" references to "PDF ou HTML"
- Update upload path logic to preserve the original file extension

**2. Backend — `supabase/functions/generate-copy-ai/index.ts`**
- Add HTML detection: `const isHtml = /\.(html?|htm)$/i.test(fileName)`
- For HTML files, read as text and strip HTML tags to extract clean content (using a simple regex strip since no npm packages are allowed in edge functions)
- Place the HTML handler alongside the existing `isTextLike` and `isPdf` handlers

### Files Modified
- `src/components/TestCopyBriefingForm.tsx`
- `supabase/functions/generate-copy-ai/index.ts` (+ redeploy)

