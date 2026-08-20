# File Conversion

A batch Office-to-PDF converter for DOCX, XLSX, and PPTX files.

[Open the app](https://convert.aqutte.co.ke)

## How it works

Drop one or more Office files into the queue, convert them, then download each PDF or all completed files. The queue shows progress and keeps the six most recent file names in browser storage.

Conversion runs through CloudConvert. The app does not try to redraw Office documents with a JavaScript PDF library because that loses layout, fonts, charts, and pagination. Files are limited to 15 MB each.

CloudConvert receives the uploaded files while it performs the conversion. The app itself has no database and does not keep converted files after the response is returned.

## Run it locally

You need Bun and a CloudConvert API key.

```bash
bun install
bun run dev
```

Set the key in `.env.local`.

```dotenv
CLOUDCONVERT_API_KEY=your-key
```

To use CloudConvert's sandbox API, also set `CLOUDCONVERT_SANDBOX=true`.

## Checks

```bash
bun run check
```

That command runs ESLint, TypeScript, the Vitest suite, and a production build.
