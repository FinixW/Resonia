// RBGA：鸣域通用 BGA 场景引擎（模型是纯 JSON，贴图是图片素材）。游戏页与 Studio 共用同一份源码。
// 模型：{rbga:1, w,h, fps, clips:{id:{frames, sprites:[{tex:[贴图id…], life?:[起,止], kf:[关键帧…]}]}},
//        tracks:[[{f:起始帧, clip:片段id, mode:'once'|'loop'|'stop'}…]…]}   轨道序号越大越靠上
// 关键帧：{f, v:{x,y,uv:[u0,v0,宽,高],px:[4],py:[4],rot,col:[r,g,b],a,bl,seq}, d?:{同名字段的“每帧增量”}}
//   某一帧的状态 = 最近一个 f<=当前帧的关键帧：v + d×(当前帧−f)。线性插值也用它表示（d=(下一键−本键)/间隔）。
//   a：不透明度 0~1；bl：'normal'|'add'|'multiply'|'exclusion'；seq：贴图序列的播放速度（张/帧）。
const RBGA=(()=>{
  const BL={normal:'source-over',add:'lighter',multiply:'multiply',exclusion:'exclusion'};
  const DEF={x:0,y:0,uv:[0,0,1,1],px:[0,0,0,0],py:[0,0,0,0],rot:0,col:[255,255,255],a:1,bl:'normal',seq:0};
  function make(M,tex){
    const W=M.w||640,H=M.h||480,fps=M.fps||60,clips=M.clips||{},tracks=M.tracks||[];
    const tint=document.createElement('canvas'),tc=tint.getContext('2d'),acc=new WeakMap();
    function sample(sp,lf){
      const ks=sp.kf;if(!ks.length)return null;
      let lo=0,hi=ks.length-1,i=-1;while(lo<=hi){const m=(lo+hi)>>1;if(ks[m].f<=lf){i=m;lo=m+1}else hi=m-1}
      if(i<0)return null;const k=ks[i],v=k.v,d=k.d,t=lf-k.f,o={};
      const g=(n)=>v[n]!==undefined?v[n]:DEF[n];
      for(const n of ['x','y','rot','a']){o[n]=g(n)+(d&&d[n]?d[n]*t:0)}
      for(const n of ['uv','px','py','col']){const b=g(n),r=d&&d[n];o[n]=r?b.map((x,j)=>x+(r[j]||0)*t):b}
      o.bl=g('bl');o.seq=g('seq');return o;
    }
    function imgIndex(sp,lf,once){
      const n=sp.tex.length;if(n<=1)return 0;
      let A=acc.get(sp);if(!A){A=[0];acc.set(sp,A)}
      const L=Math.min(Math.floor(lf),200000);
      while(A.length<=L){const f=A.length-1,st=sample(sp,f);A.push(A[f]+(st?st.seq:0))}
      const k=Math.floor(A[Math.max(0,L)]+1e-6);return once?Math.max(0,Math.min(n-1,k)):((k%n)+n)%n;
    }
    const seg=(s0,len)=>{const o=[];let t=s0;for(let n=0;t<s0+len-1e-6&&n<70;n++){const k=Math.floor(t+1e-6),e=Math.min(s0+len,k+1);o.push([t,e,k]);t=e}return o};
    function draw(c,sp,lf,base,once){
      if(sp.life&&(lf<sp.life[0]||lf>sp.life[1]))return;
      const st=sample(sp,lf);if(!st)return;
      const im=tex[sp.tex[imgIndex(sp,lf,once)]];if(!im)return;
      const al=st.a;if(!(al>0.002))return;
      const iw=im.width,ih=im.height,[u0,v0,uw,vh]=st.uv;if(!(uw>0&&vh>0)||uw>64||vh>64)return;
      const sw=uw*iw,sh=vh*ih,r=st.rot*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r);
      const P=i=>{const px=st.px[i],py=st.py[i];return[st.x+px*cs-py*sn,st.y+px*sn+py*cs]};
      const p0=P(0),p1=P(1),p3=P(3);
      if(Math.hypot(p1[0]-p0[0],p1[1]-p0[1])<0.01||Math.hypot(p3[0]-p0[0],p3[1]-p0[1])<0.01)return;
      const a=(p1[0]-p0[0])/sw,b=(p1[1]-p0[1])/sw,cc=(p3[0]-p0[0])/sh,d=(p3[1]-p0[1])/sh;
      let src=im;const col=st.col;
      if(Math.min(col[0],col[1],col[2])<250){
        tint.width=iw;tint.height=ih;tc.globalCompositeOperation='source-over';tc.clearRect(0,0,iw,ih);
        tc.drawImage(im,0,0);tc.globalCompositeOperation='multiply';tc.fillStyle='rgb('+(col[0]|0)+','+(col[1]|0)+','+(col[2]|0)+')';tc.fillRect(0,0,iw,ih);
        tc.globalCompositeOperation='destination-in';tc.drawImage(im,0,0);src=tint;
      }
      c.globalAlpha=Math.min(1,al);c.globalCompositeOperation=BL[st.bl]||'source-over';
      c.setTransform(base.s*a,base.s*b,base.s*cc,base.s*d,base.x+base.s*p0[0],base.y+base.s*p0[1]);
      for(const [ua,ub,ku] of seg(u0,uw))for(const [va,vb,kv] of seg(v0,vh)){
        const pw=(ub-ua)*iw,ph=(vb-va)*ih;if(pw<0.01||ph<0.01)continue;
        c.drawImage(src,(ua-ku)*iw,(va-kv)*ih,pw,ph,(ua-u0)*iw,(va-v0)*ih,pw,ph);
      }
    }
    const reset=c=>{c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over'};
    return{model:M,tex,
      render(c,cw,ch,ms){
        reset(c);c.fillStyle='#000';c.fillRect(0,0,cw,ch);if(ms<0)return;
        const F=ms*fps/1000,s=Math.min(cw/W,ch/H),base={s,x:(cw-W*s)/2,y:(ch-H*s)/2};
        c.imageSmoothingEnabled=true;c.save();c.beginPath();c.rect(base.x,base.y,W*s,H*s);c.clip();
        for(const ents of tracks){
          let lo=0,hi=ents.length-1,i=-1;while(lo<=hi){const m=(lo+hi)>>1;if(ents[m].f<=F){i=m;lo=m+1}else hi=m-1}
          if(i<0)continue;const e=ents[i];if(e.mode==='stop'||!e.clip)continue;const cl=clips[e.clip];if(!cl)continue;
          let lf=F-e.f;if(e.mode==='loop'&&cl.frames>0)lf%=cl.frames;else if(cl.frames>0&&lf>=cl.frames)continue;
          for(const sp of cl.sprites)draw(c,sp,lf,base,e.mode!=='loop');
          reset(c);
        }
        c.restore();reset(c);
      }};
  }
  const texIds=M=>{const s=new Set();for(const k in M.clips||{})for(const sp of M.clips[k].sprites)for(const t of sp.tex)s.add(t);return[...s]};
  return{make,texIds};
})();
