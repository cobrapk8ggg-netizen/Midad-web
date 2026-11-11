import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',testMatch:'**/*.spec.ts',timeout:60000,use:{baseURL:process.env.BASE_URL||'http://localhost:3000',launchOptions:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']},screenshot:'only-on-failure'},reporter:[['list'],['html',{open:'never'}]]});
