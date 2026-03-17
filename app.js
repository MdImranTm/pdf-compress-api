const express = require('express');
const multer  = require('multer');
const { exec } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── Multer: memory storage, max 100 MB ──────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf')
      return cb(new Error('Only PDF files are accepted'), false);
    cb(null, true);
  },
});

// ── Ghostscript quality presets ─────────────────────────────────────────────
const GS_SETTINGS = {
  screen : '/screen',   // ~72 DPI  — max compression (email / messaging)
  ebook  : '/ebook',    // ~150 DPI — balanced (sharing online)
  print  : '/printer',  // ~300 DPI — high quality (printable)
  meta   : '/prepress', // lossless — metadata strip only
};

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ghostscript: true }));

// ── POST /compress ────────────────────────────────────────────────────────────
app.post('/compress', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

  const quality    = (req.body.quality || 'ebook').toLowerCase();
  const pdfSetting = GS_SETTINGS[quality] || GS_SETTINGS.ebook;
  const stripMeta  = req.body.stripMeta !== 'false';   // default true
  const stripAnnot = req.body.stripAnnot === 'true';   // default false

  const uid        = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const inputPath  = path.join(os.tmpdir(), `gs_in_${uid}.pdf`);
  const outputPath = path.join(os.tmpdir(), `gs_out_${uid}.pdf`);

  const cleanup = () => {
    try { fs.unlinkSync(inputPath);  } catch (_) {}
    try { fs.unlinkSync(outputPath); } catch (_) {}
  };

  try {
    // Write uploaded bytes to temp file
    fs.writeFileSync(inputPath, req.file.buffer);
    const origSize = req.file.buffer.length;

    // Build Ghostscript command
    // -dFastWebView=true  → linearise (byte-serve friendly)
    // -dDetectDuplicateImages=true → dedup identical embedded images
    // -dCompressFonts=true         → subset + compress fonts
    const stripAnnotFlag = stripAnnot
      ? ' -dNoAnnotations=true'
      : '';
    const stripMetaFlags = stripMeta
      ? ' -dOmitInfoDict=true'
      : '';

    const gsCmd = [
      'gs',
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.5',
      `-dPDFSETTINGS=${pdfSetting}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dFastWebView=true',
      '-dDetectDuplicateImages=true',
      '-dCompressFonts=true',
      stripAnnotFlag,
      stripMetaFlags,
      `-sOutputFile="${outputPath}"`,
      `"${inputPath}"`,
    ].filter(Boolean).join(' ');

    // Run Ghostscript
    await new Promise((resolve, reject) => {
      exec(gsCmd, { timeout: 120_000 }, (err, _stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve();
      });
    });

    // Read result
    const compressedBuffer = fs.readFileSync(outputPath);
    const compSize = compressedBuffer.length;

    // Always send the SMALLER of the two
    const finalBuffer = compSize < origSize ? compressedBuffer : req.file.buffer;
    const finalSize   = finalBuffer === compressedBuffer ? compSize : origSize;

    cleanup();

    res.set({
      'Content-Type'               : 'application/pdf',
      'Content-Disposition'        : 'attachment; filename="compressed.pdf"',
      'X-Original-Size'            : String(origSize),
      'X-Compressed-Size'          : String(compSize),
      'X-Final-Size'               : String(finalSize),
      'Access-Control-Expose-Headers':
        'X-Original-Size, X-Compressed-Size, X-Final-Size',
    });

    res.send(finalBuffer);

  } catch (err) {
    cleanup();
    console.error('[compress error]', err.message);
    res.status(500).json({ error: err.message || 'Compression failed.' });
  }
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[unhandled]', err.message);
  res.status(500).json({ error: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅  PDF Compress API running on port ${PORT}`)
);
