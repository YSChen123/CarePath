import { chromium } from '@playwright/test';
import { browserOptions } from './browser-options.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out=new URL('../docs/qa-survey-update/',import.meta.url);
await mkdir(out,{recursive:true});
const browser=await chromium.launch(browserOptions);
const page=await browser.newPage();
const observations=[];
try {
 for(const [width,height,name] of [[1440,1100,'desktop'],[390,844,'mobile']]) {
  await page.setViewportSize({width,height});
  for(const q of ['Q1','Q7','Q16','Q22']) {
   await page.goto('http://127.0.0.1:4173/#/research/survey?q='+q);
   await page.locator('[data-question-title]').waitFor();
   await page.locator('.question-reader').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
   await page.screenshot({path:fileURLToPath(new URL(`${name}-${q}.png`,out))});
   if(q!=='Q22') await page.locator('[data-stat-chart]').screenshot({path:fileURLToPath(new URL(`${name}-${q}-chart.png`,out))});
   await page.locator('.question-responses').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
   await page.screenshot({path:fileURLToPath(new URL(`${name}-${q}-answers.png`,out))});
   observations.push({width,q,...await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,fonts:{meta:getComputedStyle(document.querySelector('.question-meta')).fontSize,response:getComputedStyle(document.querySelector('[data-response-text]')).fontSize,chartLabel:document.querySelector('.vertical-bars dt')?getComputedStyle(document.querySelector('.vertical-bars dt')).fontSize:null}}))});
  }
 }
 await writeFile(new URL('layout-fonts.json',out),JSON.stringify(observations,null,2));
}finally{await browser.close();}
console.log('PASS: 问卷总体柱状图与逐人回答的桌面/手机截图已保存。');
