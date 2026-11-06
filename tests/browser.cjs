const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const requested=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!requested.startsWith(root+path.sep)&&requested!==root){res.writeHead(403).end();return;}
 const file=requested+(path.extname(requested)?'':'/index.html');
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),headless:true,args:['--no-sandbox'],...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}}:{})});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/','/ils-analysis/']){
   const response=await page.goto(`http://127.0.0.1:${server.address().port}${route}`);assert.equal(response.status(),200);
   await page.waitForFunction(()=>typeof Chart==='function'&&typeof GPAnalysis==='object');
   assert.equal(await page.locator('[data-app-version]').textContent(),'v1.1.17');
   for(const index of [0,1]){
    for(const offset of [0,15,-15]){
     const csv=await page.evaluate(({index,offset})=>{
      const r=RUNWAYS[index],c=runwayCourse(r)*Math.PI/180,rows=['Position,Direction,Altitude,Speed,UTC'];
      for(let i=0;i<60;i++){
       const nm=5-i*.09,meters=nm*1852,lat=r.lat-Math.cos(c)*meters/6371000*180/Math.PI,lon=r.lon-Math.sin(c)*meters/(6371000*Math.cos(r.lat*Math.PI/180))*180/Math.PI;
       const height=15.24+meters*Math.tan(Math.PI/60)+offset;
       rows.push(`"${lat},${lon}",${runwayCourse(r)},${height/.3048},130,${new Date(Date.UTC(2026,10,6,8,0,i*10)).toISOString()}`);
      }return rows.join('\n');
     },{index,offset});
     await page.locator('#fileInput').setInputFiles({name:'known-height.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
     await page.waitForFunction(()=>document.querySelector('#status').classList.contains('success'));
     assert.match(await page.locator('#altitudeMessage').textContent(),/unknown/i);
     assert.equal(await page.evaluate(()=>gpChart.data.datasets[0].data.length),0);
     assert.ok(await page.evaluate(()=>finalChart.data.datasets[0].data.length>10));
     await page.selectOption('#altitudeType','geometric');await page.selectOption('#altitudeReference','threshold');
     await page.locator('#altitudeForm button').click();
     const data=await page.evaluate(()=>({runway:detectedRunway.runway,main:gpChart.data.datasets[0].data,zoom:gpZoomChart.data.datasets[0].data,reverse:gpChart.options.scales.x.reverse,zoomReverse:gpZoomChart.options.scales.x.reverse}));
     assert.equal(data.runway,index===0?'09':'27');assert.ok(data.main.length>10);assert.ok(data.zoom.length>2);assert.equal(data.reverse,data.zoomReverse);
     for(const point of data.main)assert.ok(Math.abs(point.gpDeviationM-offset)<1e-5,`${route} RWY ${data.runway} expected ${offset}, got ${point.gpDeviationM}`);
     assert.deepEqual(data.zoom,data.main.filter(p=>p.x<=.5));
     await page.fill('#altitudeCorrection','10');await page.fill('#altitudeBasis','Independent synthetic calibration +10 m');await page.fill('#altitudeUncertainty','2');await page.locator('#altitudeForm button').click();
     assert.match(await page.locator('#altitudeMessage').textContent(),/correction 10 m/);
     const corrected=await page.evaluate(()=>gpChart.data.datasets[0].data[0]);assert.ok(Math.abs(corrected.gpDeviationM-offset-10)<1e-5);assert.equal(corrected.uncertaintyM,2);
     await page.fill('#altitudeBasis','');await page.locator('#altitudeForm button').click();assert.equal(await page.evaluate(()=>gpChart.data.datasets[0].data.length),0);assert.match(await page.locator('#altitudeMessage').textContent(),/basis/);
     console.log(`PASS ${route} RWY ${data.runway}: ${offset} m, unknown datum, manual correction, shared zoom data`);
    }
   }
   const multi=await page.evaluate(()=>{
    const rows=['Position,Direction,Altitude,Speed,UTC'];
    for(let pass=0;pass<2;pass++){if(pass)for(let j=0;j<8;j++)rows.push(`"0,0",0,0,130,${new Date(Date.UTC(2026,10,6,8,0,900+j*10)).toISOString()}`);rawFlightPoints.forEach((p,i)=>rows.push(`"${p.lat},${p.lon}",${p.direction},${p.altitude+pass*30/.3048},130,${new Date(Date.UTC(2026,10,6,8,0,i*10+pass*1200)).toISOString()}`));}
    return rows.join('\n');
   });
   await page.locator('#fileInput').setInputFiles({name:'two-approaches.csv',mimeType:'text/csv',buffer:Buffer.from(multi)});
   await page.waitForFunction(()=>document.querySelector('#status').classList.contains('success'));
   assert.equal(await page.evaluate(()=>approaches.length),2);
   await page.selectOption('#altitudeType','geometric');await page.selectOption('#altitudeReference','threshold');await page.locator('#altitudeForm button').click();
   if(route==='/'){
    await page.locator('[data-approach-controls="loc"] input[data-approach="1"]').check();
    const deviations=await page.evaluate(()=>[gpChart.data.datasets[0].data.map(p=>p.gpDeviationM),gpChart.data.datasets[5].data.map(p=>p.gpDeviationM)]);
    assert.ok(deviations.every(points=>points.length>10));
    for(const value of deviations[0])assert.ok(Math.abs(value+15)<1e-5);
    for(const value of deviations[1])assert.ok(Math.abs(value-15)<1e-5);
   }else{
    await page.selectOption('#approachSelect','1');
    assert.ok(await page.evaluate(()=>gpChart.data.datasets[0].data.every(p=>Math.abs(p.gpDeviationM-15)<1e-5)));
   }
   console.log('PASS',route,'two approaches retain distinct vertical offsets');
   for(const [name,content] of [['invalid.csv','BadColumn\n1'],['invalid.kml','<not-valid']]){
    await page.locator('#fileInput').setInputFiles({name,mimeType:'text/plain',buffer:Buffer.from(content)});
    await page.waitForFunction(()=>document.querySelector('#status').classList.contains('error'));
    assert.match(await page.locator('#status').textContent(),/Error:.*No analysis is displayed/);
    assert.equal(await page.evaluate(()=>gpChart.data.datasets[0].data.length+finalChart.data.datasets[0].data.length),0);
   }
   await page.setViewportSize({width:390,height:844});
   await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth);
   await page.setViewportSize({width:1280,height:800});
  }
  assert.deepEqual(errors,[]);console.log('PASS both entry points, 12 single-approach uploads, 2 multi-approach uploads, failure messages, mobile width, no uncaught exceptions');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
