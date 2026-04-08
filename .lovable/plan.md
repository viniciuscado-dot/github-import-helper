
## Plan: Add "Configurações" and "Analisar Informações" Buttons to Briefing Card

### Fix runtime error first
`Index.tsx` already imports `TestCopyBriefingForm` correctly (line 20), but there's likely a stale reference to `TestCopyForm` somewhere in `renderContent`. This will be fixed as part of the implementation.

### Changes

**Single file: `src/components/TestCopyBriefingForm.tsx`**

1. **Add state for the config modal**
   - `showConfigModal` boolean state
   - `analysisInstructions` and `idealResults` text states for the instruction/model content
   - `isAnalyzing` boolean for the analyze button loading state
   - `analysisResult` string to hold the analysis output

2. **Add two buttons to the CardHeader** (top-right of "Analisador de Briefing" box)
   - **"Analisar Informações"** button (with `Eye` or `Search` icon) — triggers PDF analysis against the configured prompts/instructions. Sends the uploaded PDF to the edge function for analysis (or displays a toast if no PDF is uploaded). Shows results in a dialog.
   - **"Configurações"** (gear icon button) — opens a dialog/sheet with:
     - "Instruções de Análise" textarea — instructions for how the AI should evaluate the briefing
     - "Modelo de Resultados Ideais" textarea — example of what a complete briefing should contain
     - Save button (persists to localStorage keyed by client)

3. **Config dialog UI**
   - Uses existing `Dialog` component
   - Two large textareas for instructions and ideal results
   - Save button that stores to localStorage (`test-copy-analysis-config`)

4. **"Analisar Informações" flow**
   - Uploads the PDF to Supabase storage (same bucket `briefing-documents`)
   - Calls `generate-copy-ai` edge function (or a lightweight Anthropic call) with a system prompt built from the config instructions, asking to evaluate briefing completeness
   - Shows results in a dialog with the markdown renderer

### CardHeader layout change
```tsx
<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle className="flex items-center gap-2 text-xl">
      <FileUp className="h-5 w-5" />
      Analisador de Briefing
    </CardTitle>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={!briefingFile || isAnalyzing}>
        {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        Analisar Informações
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setShowConfigModal(true)}>
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  </div>
  <CardDescription>...</CardDescription>
</CardHeader>
```

### Files Modified
- `src/components/TestCopyBriefingForm.tsx` — add buttons, config dialog, analysis flow
