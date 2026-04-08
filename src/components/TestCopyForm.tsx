import { CopyForm, CopyFormTableConfig } from "./CopyForm"

const TEST_TABLE_CONFIG: CopyFormTableConfig = {
  formsTable: 'test_copy_forms',
  draftsTable: 'test_copy_form_drafts',
}

interface TestCopyFormProps {
  onBack?: () => void
  clientName?: string
}

export function TestCopyForm({ onBack, clientName }: TestCopyFormProps) {
  return (
    <CopyForm
      onBack={onBack}
      clientName={clientName}
      tableConfig={TEST_TABLE_CONFIG}
    />
  )
}
