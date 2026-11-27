import { app } from './app.js';
import { config, assertJwtSecret } from './config.js';

assertJwtSecret(); // M8 (H4): ingen hemlighet, ingen server

app.listen(config.port, () => {
  console.log(`API lyssnar på http://localhost:${config.port}`);
});
