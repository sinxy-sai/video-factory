# Contributing

Thanks for helping improve Video Factory.

## Development setup

```powershell
npm install
npm test
```

Use Node.js 20 or newer. Keep episode content self-contained under
`content/episodes/<episode-id>/` and update generated files with the project
commands instead of editing generated output by hand.

## Pull requests

1. Explain the user-facing or workflow change in the pull request description.
2. Add or update documentation when a command or contract changes.
3. Run `npm test` before opening the pull request.
4. Keep commits focused and avoid committing generated renders or local assets.

Small documentation fixes and reproducible bug reports are welcome. For larger
changes, open an issue first so the design can be discussed before code is
written.
