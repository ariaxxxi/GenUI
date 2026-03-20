// Legacy fallback for file:// usage. This provides minimal SHAPES and small helper stubs on window so the page doesn't crash when loaded from file://.
(function(){
  window.SHAPES = {
    idle:{main:{w:0,h:0,br:'0px',tx:0,ty:0,op:0},left:{w:0,h:0,br:'0px',tx:0,ty:0,op:0},right:{w:0,h:0,br:'0px',tx:0,ty:0,op:0}},
    circle:{main:{w:100,h:100,br:'50px',tx:-50,ty:-50,op:1},left:{w:100,h:100,br:'50px',tx:-50,ty:-50,op:0},right:{w:100,h:100,br:'50px',tx:-50,ty:-50,op:0}},
    dot:{main:{w:100,h:100,br:'50px',tx:-50,ty:-50,op:1},left:{w:100,h:100,br:'50px',tx:-50,ty:-50,op:0},right:{w:100,h:100,br:'50px',tx:-50,ty:-50,op:0}},
    pill:{main:{w:420,h:100,br:'60px',tx:-210,ty:-50,op:1},left:{w:100,h:100,br:'50px',tx:-210,ty:-50,op:0},right:{w:100,h:100,br:'50px',tx:60,ty:-50,op:0}},
    card:{main:{w:420,h:260,br:'30px',tx:-210,ty:-130,op:1},left:{w:100,h:100,br:'50px',tx:-210,ty:-50,op:0},right:{w:100,h:100,br:'50px',tx:110,ty:-50,op:0}},
    'card-s':{main:{w:420,h:260,br:'30px',tx:-210,ty:-130,op:1},left:{w:100,h:100,br:'50px',tx:-210,ty:-50,op:0},right:{w:100,h:100,br:'50px',tx:110,ty:-50,op:0}},
    image:{main:{w:420,h:260,br:'30px',tx:-210,ty:-130,op:1},left:{w:100,h:100,br:'50px',tx:-210,ty:-50,op:0},right:{w:100,h:100,br:'50px',tx:110,ty:-50,op:0}},
    ai:{main:{w:100,h:100,br:'50px',tx:-50,ty:-50,op:1},left:{w:100,h:100,br:'50px',tx:-50,ty:-50,op:0},right:{w:100,h:100,br:'50px',tx:-50,ty:-50,op:0}}
  };
  window.defaultTypographyForShape = function(shape){
    return { icon:{size:40,color:'#ffffff'}, primary:{size:28,color:'#ffffff'}, secondary:{size:24,color:'#d4d4d4'}, detail:{size:24,color:'#a3a3a3'} };
  };
  window.normalizeIcon = function(v){ if (v && typeof v === 'object') return {kind: v.kind||'none', value: v.value||''}; const t=String(v||'').trim(); return t?{kind:'emoji',value:t}:{kind:'none',value:''}; };
  window.normalizeTypography = function(value, shape){ return window.defaultTypographyForShape(shape); };
  window.normalizeTypographyByShape = function(v, f){ return { [f]: window.defaultTypographyForShape(f) }; };
  window.normalizeStage = function(raw, fallback){ return fallback || (raw||{}); };
  window.normalizeStageImage = function(v){ if(!v||typeof v!=='object') return null; if(!v.src) return null; return {src:v.src,width:v.width||0,height:v.height||0}; };
  window.normalizeStageImages = function(v){ if(!Array.isArray(v)) return []; return v.map(window.normalizeStageImage).filter(Boolean); };
  window.normalizeIconByShape = function(v,f,legacy){ return {}; };
  window.normalizeImagesByShape = function(v,f,legacy){ return {}; };
  window.configureShapeHelpers = function(){};
})();
