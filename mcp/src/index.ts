import express from 'express';
import { createJob, getJob, getEmitter } from './store.js';
import { runPipeline } from './pipeline.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/process', (req, res) => {
  const { jobId, filePath, fileName, mimeType } = req.body as {
    jobId: string;
    filePath: string;
    fileName: string;
    mimeType: string;
  };

  if (!jobId || !filePath || !fileName || !mimeType) {
    res.status(400).json({ error: 'jobId, filePath, fileName, mimeType are required' });
    return;
  }

  createJob(jobId, filePath, fileName, mimeType);

  runPipeline(jobId, filePath, fileName, mimeType).catch(console.error);

  res.status(202).json({ jobId, streamUrl: `/mcp/stream/${jobId}` });
});

app.get('/stream/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: object) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  for (const event of job.events) {
    send(event);
  }

  if (job.done) {
    res.end();
    return;
  }

  const emitter = getEmitter(jobId);
  if (!emitter) {
    res.end();
    return;
  }

  const onEvent = (event: object) => {
    send(event);
    if ((event as { type: string }).type === 'done') {
      res.end();
      cleanup();
    }
  };

  const cleanup = () => emitter.off('event', onEvent);

  emitter.on('event', onEvent);
  req.on('close', cleanup);
});

const port = process.env.PORT ?? 3001;
app.listen(port, () => {
  console.log(`MCP service listening on :${port}`);
});
