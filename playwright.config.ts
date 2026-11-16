import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir:'./tests/browser',
  timeout:60000,
  workers:1,
  use:{
    baseURL:'http://127.0.0.1:5173',
    browserName:'chromium',
    viewport:{width:960,height:540},
    launchOptions:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']},
    screenshot:'only-on-failure'
  },
  webServer:{
    command:'npm run dev -- --host 127.0.0.1',
    url:'http://127.0.0.1:5173',
    reuseExistingServer:!process.env.CI,
    timeout:30000
  }
});
