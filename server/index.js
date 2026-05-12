import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import solutionsRouter from './routes/solutions.js';
import potdRouter from './routes/potd.js';
import weakAreasRouter from './routes/weakAreas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

app.use('/api', solutionsRouter);
app.use('/api', potdRouter);
app.use('/api', weakAreasRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(3001, () => console.log('Server running on http://localhost:3001'));
