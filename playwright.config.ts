import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',workers:1,timeout:60000,
  use:{baseURL:'http://127.0.0.1:5173',browserName:'chromium',
    viewport:{width:1280,height:720},screenshot:'only-on-failure'},
  webServer:{command:'npm run dev -- --host 127.0.0.1',url:'http://127.0.0.1:5173',
    reuseExistingServer:!process.env.CI,timeout:60000}
});
