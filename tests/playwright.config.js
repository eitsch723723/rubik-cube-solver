const {defineConfig}=require('@playwright/test');
const localChromium=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
module.exports=defineConfig({
  testDir:'.',timeout:45000,expect:{timeout:8000},workers:1,retries:0,
  use:{baseURL:'http://127.0.0.1:4173',ignoreHTTPSErrors:true},
  projects:[
    {name:'chromium',use:{browserName:'chromium',viewport:{width:402,height:874},...(localChromium?{launchOptions:{executablePath:localChromium}}:{})}},
    {name:'webkit',use:{browserName:'webkit',viewport:{width:402,height:874}}}
  ]
});
