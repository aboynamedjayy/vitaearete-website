/* ── BLOG POST BACKGROUND CANVAS ──────────────────────────────
   Adapted from vitaearete.com main site canvas system.
   Usage: <canvas id="bgCanvas"></canvas>
          <script src="bg-canvas.js" data-mode="helix"></script>
   Modes: molecular, helix, metabolic, pulse, drift
───────────────────────────────────────────────────────────── */
(function(){
  const scriptTag = document.currentScript;
  const MODE = (scriptTag && scriptTag.getAttribute('data-mode')) || 'molecular';

  const canvas = document.getElementById('bgCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  let mouse = {x:-9999, y:-9999};

  /* Shared state */
  let particles = [], pulseRings = [];
  let helixT = 0, metabolicAngle = 0;

  /* Colour palette — matches main site */
  const GOLD=[200,169,110], MINT=[72,200,140], EMERALD=[100,220,160];
  const SEAFOAM=[140,230,190], PALE=[230,200,140];
  const NODE_COLS=[MINT,GOLD,EMERALD,SEAFOAM,PALE];

  function initParticles(){
    particles = Array.from({length:45},()=>{
      const col=NODE_COLS[Math.floor(Math.random()*NODE_COLS.length)];
      return{x:Math.random()*W,y:Math.random()*H,
             vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,
             r:Math.random()*2.2+1.2,col:col,a:Math.random()*.4+.22};
    });
    pulseRings=[];
  }

  function resize(){
    W=canvas.width=window.innerWidth;
    H=canvas.height=document.documentElement.scrollHeight;
    initParticles();
  }

  /* Mouse tracking */
  document.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY+window.scrollY;});

  /* Shared particle physics */
  function tickParticles(spd){
    particles.forEach(p=>{
      p.x+=p.vx*spd; p.y+=p.vy*spd;
      if(p.x<0){p.x=0;p.vx*=-1;} if(p.x>W){p.x=W;p.vx*=-1;}
      if(p.y<0){p.y=0;p.vy*=-1;} if(p.y>H){p.y=H;p.vy*=-1;}
      const scrollY=window.scrollY;
      const dx=p.x-mouse.x,dy=p.y-(mouse.y);
      const d=Math.hypot(dx,dy);
      if(d<125&&d>0){
        const f=(125-d)/125*.05;
        p.vx+=(dx/d)*f; p.vy+=(dy/d)*f;
        const s=Math.hypot(p.vx,p.vy);
        if(s>1.5){p.vx=p.vx/s*1.5;p.vy=p.vy/s*1.5;}
      }
    });
  }

  /* ── MOLECULAR: floating node + link network ── */
  function drawMolecular(){
    tickParticles(1);
    for(let i=0;i<particles.length-1;i++){
      for(let j=i+1;j<particles.length;j++){
        const pa=particles[i],pb=particles[j];
        const d=Math.hypot(pa.x-pb.x,pa.y-pb.y);
        if(d<160){
          const c=pa.col;
          ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);
          ctx.strokeStyle=`rgba(${c[0]},${c[1]},${c[2]},${(1-d/160)*.22})`;
          ctx.lineWidth=1;ctx.stroke();
        }
      }
    }
    particles.forEach(p=>{
      const[r,g,b]=p.col;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*4.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${.06})`;ctx.fill();
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${p.a*.85})`;ctx.fill();
    });
  }

  /* ── HELIX: DNA double-helix sweeping the full page ── */
  function drawHelix(){
    helixT+=.006;
    const cx=W/2, amp=Math.min(W*.22,185);
    const steps=Math.ceil(H/8);
    for(let strand=0;strand<2;strand++){
      const off=strand*Math.PI, col=strand===0?MINT:GOLD;
      ctx.beginPath();
      for(let i=0;i<=steps;i++){
        const t=i/steps,y=t*H,x=cx+Math.sin(t*Math.PI*4.5+helixT+off)*amp;
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.strokeStyle=`rgba(${col[0]},${col[1]},${col[2]},.15)`;
      ctx.lineWidth=1.5;ctx.stroke();
    }
    /* Rungs */
    const rungStep=Math.max(3,Math.floor(steps/20));
    for(let i=0;i<=steps;i+=rungStep){
      const t=i/steps,y=t*H;
      const x1=cx+Math.sin(t*Math.PI*4.5+helixT)*amp;
      const x2=cx+Math.sin(t*Math.PI*4.5+helixT+Math.PI)*amp;
      ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);
      ctx.strokeStyle='rgba(200,169,110,.07)';ctx.lineWidth=1;ctx.stroke();
      [[x1,MINT],[x2,GOLD]].forEach(([x,col])=>{
        ctx.beginPath();ctx.arc(x,y,2.6,0,Math.PI*2);
        ctx.fillStyle=`rgba(${col[0]},${col[1]},${col[2]},.45)`;ctx.fill();
      });
    }
    /* Background drift particles */
    tickParticles(.3);
    particles.forEach(p=>{
      const[r,g,b]=p.col;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*.6,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${p.a*.18})`;ctx.fill();
    });
  }

  /* ── METABOLIC: Krebs-cycle orbital system ── */
  function drawMetabolic(){
    metabolicAngle+=.003;
    /* Draw at multiple vertical centers so it covers the full page height */
    const centers=[];
    const spacing=Math.min(H,800);
    for(let cy=spacing/2;cy<H;cy+=spacing){
      centers.push({x:W/2,y:cy});
    }
    centers.forEach(({x:cx,y:cy})=>{
      [{r:68,n:5,col:MINT,s:1},{r:132,n:8,col:GOLD,s:-.65},{r:208,n:11,col:EMERALD,s:.45}]
      .forEach(orb=>{
        ctx.beginPath();ctx.arc(cx,cy,orb.r,0,Math.PI*2);
        ctx.strokeStyle=`rgba(${orb.col[0]},${orb.col[1]},${orb.col[2]},.06)`;
        ctx.lineWidth=1;ctx.stroke();
        for(let i=0;i<orb.n;i++){
          const ang=metabolicAngle*orb.s+(i/orb.n)*Math.PI*2;
          const x=cx+Math.cos(ang)*orb.r, y=cy+Math.sin(ang)*orb.r;
          ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);
          ctx.fillStyle=`rgba(${orb.col[0]},${orb.col[1]},${orb.col[2]},.06)`;ctx.fill();
          ctx.beginPath();ctx.arc(x,y,2.8,0,Math.PI*2);
          ctx.fillStyle=`rgba(${orb.col[0]},${orb.col[1]},${orb.col[2]},.55)`;ctx.fill();
        }
      });
      /* Pulse rings */
      if(Math.random()<.008) pulseRings.push({r:0,alpha:.25,col:GOLD,cx:cx,cy:cy});
    });
    pulseRings.forEach(ring=>{ring.r+=1.2;ring.alpha*=.977;});
    pulseRings=pulseRings.filter(ring=>ring.alpha>.004);
    pulseRings.forEach(ring=>{
      const c=ring.col;
      ctx.beginPath();ctx.arc(ring.cx,ring.cy,ring.r,0,Math.PI*2);
      ctx.strokeStyle=`rgba(${c[0]},${c[1]},${c[2]},${ring.alpha})`;
      ctx.lineWidth=1;ctx.stroke();
    });
    /* Background particles */
    tickParticles(.2);
    particles.forEach(p=>{
      const[r,g,b]=p.col;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${p.a*.15})`;ctx.fill();
    });
  }

  /* ── PULSE: ECG waveforms — heartbeat / vital signs ── */
  function drawPulse(){
    helixT+=.008;
    const numWaves=Math.max(3,Math.ceil(H/250));
    for(let w=0;w<numWaves;w++){
      const yOff=(w+.5)/numWaves*H, phase=helixT+w*.8;
      const col=w%2===0?MINT:GOLD;
      ctx.beginPath();
      for(let x=0;x<=W;x+=3){
        const t=(x/W)*5+phase, mod=((t%1)+1)%1;
        let y=yOff;
        if(mod<.04)      y=yOff-Math.sin(mod/.04*Math.PI)*38;
        else if(mod<.09) y=yOff+Math.sin((mod-.04)/.05*Math.PI)*14;
        else             y=yOff+Math.sin(t*2.2)*4;
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.strokeStyle=`rgba(${col[0]},${col[1]},${col[2]},.16)`;
      ctx.lineWidth=1.5;ctx.stroke();
    }
    tickParticles(.4);
    particles.forEach(p=>{
      const[r,g,b]=p.col;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*.7,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${p.a*.25})`;ctx.fill();
    });
  }

  /* ── DRIFT: slow luminous orbs — calm / wellness ── */
  function drawDrift(){
    particles.forEach(p=>{
      p.vx+=(Math.random()-.5)*.008; p.vy+=(Math.random()-.5)*.008;
      const s=Math.hypot(p.vx,p.vy); if(s>.25){p.vx=p.vx/s*.25;p.vy=p.vy/s*.25;}
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=W; if(p.x>W)p.x=0;
      if(p.y<0)p.y=H; if(p.y>H)p.y=0;
      const[r,g,b]=p.col;
      const grd=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*9);
      grd.addColorStop(0,`rgba(${r},${g},${b},.10)`);
      grd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grd;ctx.beginPath();ctx.arc(p.x,p.y,p.r*9,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*1.1,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${p.a*.45})`;ctx.fill();
    });
  }

  const MODES = { molecular:drawMolecular, helix:drawHelix, metabolic:drawMetabolic, pulse:drawPulse, drift:drawDrift };
  const drawFn = MODES[MODE] || drawMolecular;

  function draw(){
    ctx.clearRect(0,0,W,H);
    drawFn();
    requestAnimationFrame(draw);
  }

  /* Resize on scroll too (for long pages) */
  let resizeTimer;
  function handleResize(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      const newH=document.documentElement.scrollHeight;
      if(Math.abs(canvas.height-newH)>50||canvas.width!==window.innerWidth){
        resize();
      }
    },200);
  }

  window.addEventListener('resize',handleResize);
  window.addEventListener('load',()=>{resize();draw();});
  /* Initial kick */
  resize();
  draw();
})();
