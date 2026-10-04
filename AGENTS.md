<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- AI analysis lives in `src/lib/analyze.functions.ts` as a single `createServerFn` calling the Lovable AI Gateway (`openai/gpt-6-astra` via Responses API) — keeps the API key server-side and returns one parsed JSON payload per review.
- PWA support is manifest-only (`public/manifest.webmanifest` + icons); saved input/output history uses localStorage for offline review without adding a service worker.
- Design tokens are earthy oklch values in `src/styles.css`; components must use semantic tokens only, never hardcoded color utilities.
