

## Plan: Inline Analysis Results with Visual Score

### What changes

**Single file: `src/components/TestCopyBriefingForm.tsx`**

### 1. Move analysis results inline (between PDF upload and "Informações adicionais")

Currently `handleAnalyze` shows results in a separate `Dialog`. Instead:
- Remove the `showAnalysisResult` dialog
- Display the analysis result directly below the PDF drop zone and above the "Informações adicionais" textarea
- When `analysisResult` has content, render a new results card in that position

### 2. Visual Score Display

Parse the AI response for a score value (e.g. "Score: 85/100" or "Nota: 7/10"). Display it as:
- A circular progress indicator or a colored progress bar at the top of the results section
- Color-coded: red (0-40%), yellow (41-70%), green (71-100%)
- Large score number with label (e.g. "85/100 — Briefing Completo")

The score will be extracted via regex from the AI response. The system prompt sent to Anthropic will be updated to always include a structured score line.

### 3. Update the analysis system prompt

Modify `handleAnalyze` to call the Anthropic API directly (via the existing `generate-copy-ai` edge function or a direct call) with a system prompt that instructs:
- Evaluate the briefing PDF against the configured instructions and ideal result models
- Return a score line in format `SCORE: XX/100` at the beginning
- Then provide detailed feedback in Markdown

### 4. Technical details

**Score extraction:**
```typescript
function extractScore(text: string): number | null {
  const match = text.match(/SCORE:\s*(\d+)\s*\/\s*100/i)
  return match ? parseInt(match[1]) : null
}
```

**Inline results UI (between PDF zone and textarea):**
```tsx
{analysisResult && (
  <Card className="border-primary/30 bg-primary/5">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">Resultado da Análise</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setAnalysisResult('')}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {/* Visual score gauge */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative h-20 w-20">
          {/* Circular SVG progress */}
        </div>
        <div>
          <p className="text-2xl font-bold">{score}/100</p>
          <p className="text-sm text-muted-foreground">Completude do Briefing</p>
        </div>
      </div>
      {/* Markdown feedback */}
      <MarkdownRenderer content={analysisResultWithoutScore} />
    </CardContent>
  </Card>
)}
```

**System prompt update in `handleAnalyze`:** Instead of saving to DB and calling `generate-copy-ai` with `materialTypes: ['analise_briefing']`, the analysis will include the config instructions and ideal models directly in `informacao_extra`, and the edge function will use these to build a proper analysis prompt. The system prompt will instruct the AI to output `SCORE: XX/100` as the first line.

### Layout order inside CardContent
1. PDF drop zone
2. **Analysis results card** (score + feedback) — visible only after analysis
3. "Informações adicionais" textarea
4. "Gerar Materiais" button

### Files Modified
- `src/components/TestCopyBriefingForm.tsx`

