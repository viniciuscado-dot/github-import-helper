// Centralized layout tokens for the Approval module
// All pages MUST use these tokens — no local overrides allowed.

export const layoutTokens = {
  container: {
    maxWidth: "max-w-[1280px]",
    paddingX: "px-6 md:px-6",  // 24px desktop, 16px mobile handled by responsive
    paddingXMobile: "px-4",
    mx: "mx-auto",
  },
  spacing: {
    sectionGap: "space-y-6",       // 24px between sections
    cardPadding: "p-4 md:p-5",    // 16–20px internal padding
    gridGap: "gap-4 md:gap-6",    // 16–24px grid gap
  },
  card: {
    base: "rounded-xl border border-border/60 bg-card",   // border-radius 12–16px
    padding: "p-4 md:p-5",
  },
  header: {
    wrapper: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
    title: "text-2xl font-bold text-foreground",
  },
  grid: {
    cols2: "grid grid-cols-1 sm:grid-cols-2",
    cols3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    cols4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  },
} as const;
