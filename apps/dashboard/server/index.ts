import { createApp } from './app.js';
import { DASHBOARD_PORT } from './config.js';

const app = createApp();

app.listen(DASHBOARD_PORT, () => {
  console.log(`Claude Assist dashboard API listening on http://localhost:${DASHBOARD_PORT}`);
});
