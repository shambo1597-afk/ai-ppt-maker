# scripts/

Ad hoc Node scripts used during development (design-grammar extraction,
manual Gemini API smoke tests). They are not part of the app's build or
test pipeline.

**No script in this directory may hardcode a credential.** A real API key
was committed here and sat in git history from the repo's very first
commit — every script that talks to a live API must read its key from
`process.env` (e.g. `process.env.VITE_GEMINI_API_KEY` or
`process.env.GEMINI_API_KEY`) and exit with a clear error if it's unset,
never fall back to a literal string. Set the key in your own shell
environment or an untracked `.env`/`.env.local` (already covered by
`.gitignore`) before running a script that needs one.
