const {test}=require('node:test');
const assert=require('node:assert/strict');
const gp=require('../assets/gp-analysis.js');
const known={type:'geometric',reference:'threshold',correctionM:0,basis:'',uncertaintyM:null};
// Independent fixture: 50 ft TCH, 3 degrees, 1852 m/NM. No GP-fit correction.
for(const designator of ['09','27']){
 const runway={runway:designator,gpAngle:3,tchFt:50,thrElevFt:1745};
 for(const offset of [0,15,-15])test(`RWY ${designator}: preserve ${offset} m at every range`,()=>{
  for(const x of [0,.1,.5,1,3,5,10]){
   const expected=15.24+x*1852*Math.tan(3*Math.PI/180);
   const raw={x,source:{altitude:(expected+offset)/.3048}};
   const result=gp.analyzePoint(raw,runway,known);
   assert.ok(Math.abs(result.gpDeviationM-offset)<1e-9);
   assert.equal(result.rawAltitude,raw.source.altitude);
  }
 });
 test(`RWY ${designator}: MSL subtraction retains +15 m`,()=>{
  const x=2,nominal=15.24+x*1852*Math.tan(Math.PI/60);
  assert.ok(Math.abs(gp.analyzePoint({x,source:{altitude:1745+(nominal+15)/.3048}},runway,{...known,reference:'msl'}).gpDeviationM-15)<1e-9);
 });
}
test('unknown type or datum fails explicitly',()=>{
 for(const settings of [gp.defaults(),{...known,reference:'unknown'},{...known,type:'unknown'}])assert.throws(()=>gp.analyzePoint({x:1,source:{altitude:1000}},{gpAngle:3,tchFt:50},settings),/unknown/);
});
test('manual barometric conversion is applied and recorded, not fitted',()=>{
 const settings={type:'barometric',reference:'manual',correctionM:-500,basis:'Documented synthetic datum offset 500 m',uncertaintyM:8};
 const r=gp.analyzePoint({x:0,source:{altitude:(15.24+15+500)/.3048}},{gpAngle:3,tchFt:50},settings);
 assert.ok(Math.abs(r.gpDeviationM-15)<1e-9);assert.equal(r.correctionM,-500);assert.equal(r.basis,settings.basis);assert.equal(r.uncertaintyM,8);
});
test('barometric height cannot silently be used as geometric MSL',()=>assert.throws(()=>gp.aircraftHeight(1000,{thrElevFt:100},{...known,type:'barometric',reference:'msl'}),/Barometric/));
test('manual correction needs a basis, including zero total conversion',()=>{
 for(const s of [{...known,correctionM:15},{...known,reference:'manual'}])assert.throws(()=>gp.aircraftHeight(100,{},s),/basis/);
});
test('invalid numeric inputs are controlled errors',()=>{
 for(const altitude of [NaN,Infinity,'100',undefined])assert.throws(()=>gp.aircraftHeight(altitude,{},known),/finite/);
 assert.throws(()=>gp.nominalHeight(NaN,{gpAngle:3,tchFt:50}),/finite/);
 assert.throws(()=>gp.geometry({gpAngle:0,tchFt:50}),/Invalid/);
 assert.throws(()=>gp.geometry({gpAngle:3}),/finite/);
 assert.throws(()=>gp.aircraftHeight(100,{}, {...known,correctionM:NaN}),/finite/);
 assert.throws(()=>gp.aircraftHeight(100,{}, {...known,uncertaintyM:-1}),/non-negative/);
});
test('virtual origin uses configured TCH and crosses zero behind threshold',()=>{
 const runway={gpAngle:3,tchFt:50};assert.equal(gp.nominalHeight(0,runway),15.24);
 assert.ok(Math.abs(gp.nominalHeight(-gp.geometry(runway).originNM,runway))<1e-9);
 assert.equal(gp.nominalHeight(0,{...runway,tchFt:60}),18.288);
});
