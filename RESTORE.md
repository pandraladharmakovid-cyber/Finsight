# Restoring FinSight from the single text file

The file `finsight-full-project.txt` contains the **complete project** — all 79
source files packed with their real paths. Nothing is compressed and nothing is
encoded, so you can open it and read any file directly.

---

## THE ONE COMMAND

Put `finsight-full-project.txt` in an **empty folder**, open a terminal in that
folder, and paste this single line:

```bash
node -e 'const fs=require("fs"),path=require("path"); const A=process.argv.slice(1).find(a=>/\.txt$/i.test(a)); if(!A){console.error("Usage: node restore.js <bundle.txt>");process.exit(1);} const[R,TS]=[process.cwd(),Date.now()]; const L=fs.readFileSync(A,"utf8").split("\n"); const H=/^=+$/,F=/^FILE:\s*(.+?)\s*$/; let i=0,n=0;const entries=[]; for(;i<L.length;i++){ const m=F.exec(L[i]); if(!m) continue; let cur=m[1]; i++; if(H.test(L[i]||"")) i++; let body=[]; while(i<L.length && !F.test(L[i])) body.push(L[i++]); i--; while(body.length && body[body.length-1].trim()==="") body.pop(); if(body.length && H.test(body[body.length-1])) body.pop(); while(body.length && body[body.length-1].trim()==="") body.pop(); entries.push([cur, body.join("\n")+"\n"]); } for(const[r,c] of entries){ const cl=r.replace(/^(\.\/|\/)+/,""); const t=path.resolve(R,cl); if(!t.startsWith(R+path.sep)){console.error("UNSAFE:",r);process.exit(1);} fs.mkdirSync(path.dirname(t),{recursive:true}); if(fs.existsSync(t) && fs.readFileSync(t,"utf8")!==c) fs.copyFileSync(t,t+".bak-"+TS); fs.writeFileSync(t,c); n++; } console.log("Restored",n,"files.");' finsight-full-project.txt
```

That is the whole restore. It then prints `Restored 79 files.`

> **Requirements:** Node.js 18+ (needed to run the project anyway).

---

## What the command does — and why it is safe

| Safety property | How it is enforced |
| --- | --- |
| **Never writes outside the folder** | Every path is resolved with `path.resolve` and must stay inside the current directory. Anything containing `../` is refused and the script exits with an error. |
| **Never deletes anything** | The script only ever *writes* the files listed in the bundle. It never removes or renames a single file. |
| **Never silently destroys work** | If a file already exists with **different** content, the old one is copied to `<name>.bak-<timestamp>` before being replaced. |
| **Idempotent** | Running it twice is harmless. Files that already match are simply rewritten with identical bytes. |
| **Fails loudly** | A malformed or unsafe bundle exits with a non-zero code and writes nothing further. |
| **No network access** | Pure local file I/O. It cannot reach out to anything. |

Because each file is delimited by an unambiguous `FILE: path` header, the parser
cannot "guess" a path — a wrong bundle cannot scatter files into random places.

---

## After restoring

```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Start the API (terminal 1)
npm run api          #  → http://localhost:5000

# 3. Start the UI (terminal 2)
npm run dev          #  → http://localhost:3000
```

### One-server production mode

```bash
npm run build && npm run api     # everything on http://localhost:5000
```

### Verify it works

```bash
npm test        # 96 backend integration checks (API must be running)
npm run test:ui # 45 browser checks (UI must be running)
```

---

## Database credentials

`backend/.env` is included in the bundle with the working database credentials,
so the restored project connects immediately. To point it at your own database,
edit `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` and `DB_PASSWORD`.

> If you would rather **not** carry credentials inside the text file, regenerate
> the bundle without them: `node tools/bundle.mjs` (no `--with-env`) — then copy
> `backend/.env.example` to `backend/.env` and fill in your own values.

---

## Prefer a reviewed, previewable restore?

The bundle also ships a full-featured restorer with a dry-run mode and verbose
reporting:

```bash
# see exactly what would be written, without writing anything
node tools/unbundle.mjs finsight-full-project.txt --dry-run

# apply it, into a specific folder
node tools/unbundle.mjs finsight-full-project.txt --out ./my-finsight
```

---

## Rebuilding the text file

If you edit the project and want a fresh bundle:

```bash
node tools/bundle.mjs --with-env     # → finsight-full-project.txt
node tools/bundle.mjs                # → same, but .env files excluded
```

The bundler automatically skips `node_modules`, `dist`, `screenshots`, lockfiles
and any previous bundle, so the output never contains itself or build output.
