/**
 * Hero WebGL — experiência 3D sem dependências externas.
 * Renderiza um núcleo geométrico, órbitas e partículas em tempo real.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-3d-canvas');
  const shell = document.getElementById('hero-3d-shell');
  const fallback = document.getElementById('hero-3d-fallback');
  if (!canvas || !shell) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    shell.classList.add('webgl-unavailable');
    return;
  }

  shell.classList.add('webgl-ready');
  if (fallback) fallback.setAttribute('hidden', '');

  const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute float aAlpha;
    uniform mat4 uMVP;
    uniform float uPointSize;
    varying float vAlpha;
    void main() {
      gl_Position = uMVP * vec4(aPosition, 1.0);
      gl_PointSize = uPointSize;
      vAlpha = aAlpha;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uRoundPoint;
    varying float vAlpha;
    void main() {
      if (uRoundPoint > 0.5) {
        vec2 p = gl_PointCoord - vec2(0.5);
        float d = dot(p, p);
        if (d > 0.25) discard;
        float soft = smoothstep(0.25, 0.04, d);
        gl_FragColor = vec4(uColor, uOpacity * vAlpha * soft);
      } else {
        gl_FragColor = vec4(uColor, uOpacity * vAlpha);
      }
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('WebGL shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('WebGL program:', gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  const loc = {
    position: gl.getAttribLocation(program, 'aPosition'),
    alpha: gl.getAttribLocation(program, 'aAlpha'),
    mvp: gl.getUniformLocation(program, 'uMVP'),
    color: gl.getUniformLocation(program, 'uColor'),
    opacity: gl.getUniformLocation(program, 'uOpacity'),
    pointSize: gl.getUniformLocation(program, 'uPointSize'),
    roundPoint: gl.getUniformLocation(program, 'uRoundPoint'),
  };

  function createBuffer(positions, alphaValue) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const alphas = new Float32Array(positions.length / 3);
    alphas.fill(alphaValue == null ? 1 : alphaValue);
    const alphaBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.STATIC_DRAW);
    return { positionBuffer, alphaBuffer, count: positions.length / 3 };
  }

  function bindGeometry(geometry) {
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.positionBuffer);
    gl.enableVertexAttribArray(loc.position);
    gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.alphaBuffer);
    gl.enableVertexAttribArray(loc.alpha);
    gl.vertexAttribPointer(loc.alpha, 1, gl.FLOAT, false, 0, 0);
  }

  // Icosaedro central.
  const phi = (1 + Math.sqrt(5)) / 2;
  const rawVertices = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ];
  const vertices = rawVertices.map((v) => {
    const len = Math.hypot(v[0], v[1], v[2]);
    const r = 1.34;
    return v.map((n) => (n / len) * r);
  });
  const faces = [
    [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
    [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
    [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
    [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1],
  ];
  const edgeSet = new Set();
  const edgePositions = [];
  faces.forEach((face) => {
    [[0,1],[1,2],[2,0]].forEach(([a,b]) => {
      const i = face[a], j = face[b];
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (edgeSet.has(key)) return;
      edgeSet.add(key);
      edgePositions.push(...vertices[i], ...vertices[j]);
    });
  });
  const core = createBuffer(edgePositions, 1);

  // Estrutura externa: cubo técnico.
  const s = 1.75;
  const cubeV = [
    [-s,-s,-s],[s,-s,-s],[s,s,-s],[-s,s,-s],
    [-s,-s,s],[s,-s,s],[s,s,s],[-s,s,s],
  ];
  const cubeEdges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  const cubePos = [];
  cubeEdges.forEach(([a,b]) => cubePos.push(...cubeV[a], ...cubeV[b]));
  const cage = createBuffer(cubePos, 0.42);

  function rotatePoint([x,y,z], rx, ry, rz) {
    let cy=Math.cos(rx), sy=Math.sin(rx); let y1=y*cy-z*sy, z1=y*sy+z*cy; y=y1; z=z1;
    cy=Math.cos(ry); sy=Math.sin(ry); let x1=x*cy+z*sy; z1=-x*sy+z*cy; x=x1; z=z1;
    cy=Math.cos(rz); sy=Math.sin(rz); x1=x*cy-y*sy; y1=x*sy+y*cy;
    return [x1,y1,z];
  }

  function ring(radius, rx, ry, rz, segments) {
    const pts=[];
    for (let i=0;i<segments;i++) {
      const a=(i/segments)*Math.PI*2;
      pts.push(...rotatePoint([Math.cos(a)*radius, Math.sin(a)*radius, 0],rx,ry,rz));
    }
    return createBuffer(pts, 0.58);
  }
  const rings = [
    ring(2.15, 1.08, 0.12, 0.16, 120),
    ring(2.42, -0.38, 1.02, -0.24, 120),
    ring(2.02, 0.55, -0.72, 0.9, 120),
  ];

  // Partículas determinísticas para manter o mesmo visual entre carregamentos.
  let seed = 72831;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const particlePos=[];
  const particleCount = window.innerWidth < 700 ? 54 : 92;
  for (let i=0;i<particleCount;i++) {
    const u=random()*2-1;
    const theta=random()*Math.PI*2;
    const radius=2.65+random()*1.18;
    const q=Math.sqrt(1-u*u);
    particlePos.push(radius*q*Math.cos(theta), radius*u, radius*q*Math.sin(theta));
  }
  const particles=createBuffer(particlePos, 0.72);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0,0,0,0);

  function perspective(fov, aspect, near, far) {
    const f=1/Math.tan(fov/2), nf=1/(near-far);
    return new Float32Array([
      f/aspect,0,0,0,
      0,f,0,0,
      0,0,(far+near)*nf,-1,
      0,0,(2*far*near)*nf,0,
    ]);
  }

  function multiply(a,b) {
    const out=new Float32Array(16);
    for(let c=0;c<4;c++) {
      for(let r=0;r<4;r++) {
        out[c*4+r]=
          a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];
      }
    }
    return out;
  }
  function translation(x,y,z) {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
  }
  function rotationX(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);}
  function rotationY(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);}
  function rotationZ(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);}
  function scale(v){return new Float32Array([v,0,0,0,0,v,0,0,0,0,v,0,0,0,0,1]);}

  let aspect=1;
  let projection=perspective(Math.PI/4,1,0.1,100);
  function resize() {
    const rect=shell.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1, window.innerWidth<700?1.35:1.75);
    const w=Math.max(1,Math.round(rect.width*dpr));
    const h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=rect.width+'px';canvas.style.height=rect.height+'px';}
    gl.viewport(0,0,w,h);
    aspect=w/h;
    projection=perspective(Math.PI/4,aspect,0.1,100);
  }
  const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
  if(ro) ro.observe(shell); else window.addEventListener('resize',resize,{passive:true});
  resize();

  const target={x:0,y:0};
  const current={x:0,y:0};
  shell.addEventListener('pointermove',(e)=>{
    if(e.pointerType==='touch') return;
    const r=shell.getBoundingClientRect();
    target.x=((e.clientX-r.left)/r.width-.5)*2;
    target.y=((e.clientY-r.top)/r.height-.5)*2;
  },{passive:true});
  shell.addEventListener('pointerleave',()=>{target.x=0;target.y=0;});

  let visible=true;
  if('IntersectionObserver' in window) {
    new IntersectionObserver((entries)=>{visible=entries[0]?.isIntersecting!==false;},{threshold:0.05}).observe(shell);
  }

  function setColor(hex) {
    gl.uniform3f(loc.color, ((hex>>16)&255)/255, ((hex>>8)&255)/255, (hex&255)/255);
  }
  function draw(geometry, mode, opacity, color, pointSize, roundPoint) {
    bindGeometry(geometry);
    setColor(color);
    gl.uniform1f(loc.opacity,opacity);
    gl.uniform1f(loc.pointSize,pointSize||1);
    gl.uniform1f(loc.roundPoint,roundPoint?1:0);
    gl.drawArrays(mode,0,geometry.count);
  }

  let start=performance.now();
  function render(now) {
    requestAnimationFrame(render);
    if(!visible) return;
    const t=(now-start)*0.001;
    current.x+=(target.x-current.x)*0.045;
    current.y+=(target.y-current.y)*0.045;
    const idle=prefersReduced?0:t;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    let model=multiply(rotationY(idle*0.22+current.x*0.34),rotationX(idle*0.12-current.y*0.24));
    model=multiply(rotationZ(Math.sin(idle*0.18)*0.09),model);
    const breathing=1+(prefersReduced?0:Math.sin(t*1.4)*0.018);
    model=multiply(scale(breathing),model);
    const view=translation(0,0,-7.2);
    const mvp=multiply(projection,multiply(view,model));
    gl.uniformMatrix4fv(loc.mvp,false,mvp);

    draw(cage,gl.LINES,0.18,0x1269ff,1,false);
    rings.forEach((r,i)=>draw(r,gl.LINE_LOOP,0.24+i*0.055,i===1?0x57b3ff:0x0b7cff,1,false));
    draw(core,gl.LINES,0.95,0x3fa7ff,1,false);
    draw(particles,gl.POINTS,0.68,0x70c9ff,Math.max(2.2,2.8*(window.devicePixelRatio||1)),true);
  }
  requestAnimationFrame(render);
})();
