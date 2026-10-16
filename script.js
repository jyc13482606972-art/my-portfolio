const torch=document.querySelector('.torch'),glow=document.querySelector('.cursor-glow');
const canvas=document.querySelector('#fire-canvas'),ctx=canvas.getContext('2d');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let pointerX=innerWidth/2,pointerY=innerHeight/2,raf=0,fireState=null,embers=[],trail=[],lastTrail=0;
function resizeCanvas(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
resizeCanvas();addEventListener('resize',resizeCanvas);
function makeEmber(x,y,boost=1){
  const angle=Math.random()*Math.PI*2,speed=(.35+Math.random()*2.2)*boost;
  embers.push({x:x+(Math.random()-.5)*12,y:y+(Math.random()-.5)*12,
    vx:Math.cos(angle)*speed*.55+(Math.random()-.5)*.8,
    vy:-Math.random()*2.5-.25,life:.65+Math.random()*.65,
    max:.65+Math.random()*.65,size:1+Math.random()*3.2,
    hue:Math.random(),smoke:Math.random()>.84});
}
function makeFlame(x,y,amount=5){
  for(let i=0;i<amount;i++){
    const spread=8+Math.random()*20;
    trail.push({x:x+(Math.random()-.5)*spread,y:y+(Math.random()-.5)*spread,
      vx:(Math.random()-.5)*1.25,vy:-.6-Math.random()*2.8,
      life:.38+Math.random()*.45,max:.38+Math.random()*.45,
      size:4+Math.random()*13,kind:Math.random()});
  }
  if(trail.length>360)trail.splice(0,trail.length-360);
}
addEventListener('pointermove',e=>{
  pointerX=e.clientX;pointerY=e.clientY;
  if(torch){torch.style.left=pointerX+'px';torch.style.top=pointerY+'px'}
  if(glow){glow.style.left=pointerX+'px';glow.style.top=pointerY+'px'}
  if(!reduceMotion&&e.pointerType!=='touch'){
    const now=performance.now();
    if(now-lastTrail>18){makeFlame(pointerX,pointerY,3);if(Math.random()>.55)makeEmber(pointerX,pointerY,.8);lastTrail=now;ensureAnimation()}
  }
});
function drawFlameParticle(p){
  const a=Math.max(0,p.life/p.max);ctx.globalAlpha=a*.72;
  if(p.kind!==undefined){
    const grad=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);
    grad.addColorStop(0,'rgba(255,248,204,.96)');
    grad.addColorStop(.22,'rgba(255,190,83,.88)');
    grad.addColorStop(.55,'rgba(242,83,29,.55)');
    grad.addColorStop(1,'rgba(115,30,15,0)');
    ctx.fillStyle=grad;ctx.beginPath();
    ctx.ellipse(p.x,p.y,p.size*(.28+a*.25),p.size*(.9+a*.65),p.vx*.15,0,Math.PI*2);ctx.fill();
  }else{
    ctx.fillStyle=p.smoke?'rgba(83,75,64,.18)':(p.hue>.5?'#ffd68a':'#f16b31');
    ctx.beginPath();ctx.arc(p.x,p.y,p.size*a,0,Math.PI*2);ctx.fill();
  }
}
function animateEmbers(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  trail=trail.filter(p=>p.life>0);
  for(const p of trail){p.x+=p.vx;p.y+=p.vy;p.vx*=.985;p.vy*=.985;p.life-=.018;drawFlameParticle(p)}
  embers=embers.filter(p=>p.life>0);
  for(const p of embers){p.x+=p.vx;p.y+=p.vy;p.vy-=.008;p.life-=.014;drawFlameParticle(p)}
  ctx.globalAlpha=1;if(fireState)drawBurn();
  if(embers.length||trail.length||fireState)raf=requestAnimationFrame(animateEmbers);
  else{raf=0;ctx.clearRect(0,0,innerWidth,innerHeight)}
}
function ensureAnimation(){if(!raf)raf=requestAnimationFrame(animateEmbers)}
function drawBurn(){
 const f=fireState;if(!f)return;const elapsed=performance.now()-f.start;
 const progress=Math.min(1,elapsed/f.duration),maxR=Math.hypot(innerWidth,innerHeight)*.78,r=maxR*progress;
 ctx.save();ctx.fillStyle='#100f0d';ctx.beginPath();ctx.rect(0,0,innerWidth,innerHeight);
 const pts=150;
 for(let i=0;i<=pts;i++){const a=i/pts*Math.PI*2;
   const wobble=1+Math.sin(a*6+f.seed)*.045+Math.sin(a*15+f.seed*2)*.027+Math.sin(a*29+performance.now()*.015)*.018;
   const rr=Math.max(0,r*wobble),x=f.x+Math.cos(a)*rr,y=f.y+Math.sin(a)*rr;
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
 ctx.closePath();ctx.fill('evenodd');ctx.restore();
 if(progress<.995){
   for(let i=0;i<pts;i++){
    const a=i/pts*Math.PI*2,w=1+Math.sin(a*6+f.seed)*.045+Math.sin(a*15+f.seed*2)*.027+Math.sin(a*29+performance.now()*.015)*.018;
    const rr=r*w,x=f.x+Math.cos(a)*rr,y=f.y+Math.sin(a)*rr;
    const flicker=Math.random();ctx.globalAlpha=.52+flicker*.48;
    ctx.fillStyle=flicker>.72?'#fff8c6':flicker>.4?'#ff9b39':flicker>.18?'#e84c22':'#4c1b12';
    ctx.beginPath();ctx.ellipse(x,y,2+flicker*4,7+flicker*17,a+Math.PI/2,0,Math.PI*2);ctx.fill();
    if(Math.random()>.55)makeEmber(x,y,1.1);
    if(Math.random()>.55)makeFlame(x,y,1);
   }
   ctx.globalAlpha=1;
 }
 if(elapsed>=f.duration)fireState=null;
}
function burnTransitionAt(x,y,callback){
 if(reduceMotion){callback();return}
 fireState={x,y,start:performance.now(),duration:1650,seed:Math.random()*1000};
 for(let i=0;i<28;i++)makeEmber(x,y,1.5);
 makeFlame(x,y,32);ensureAnimation();
 setTimeout(callback,640);
 setTimeout(()=>{if(fireState&&performance.now()-fireState.start>1600)fireState=null},1700);
}
// Every click gets a brief flame bloom, including clicks on cards, controls, and blank areas.
addEventListener('click',e=>{
 if(reduceMotion||e.pointerType==='touch')return;
 makeFlame(e.clientX,e.clientY,22);
 for(let i=0;i<15;i++)makeEmber(e.clientX,e.clientY,1.2);
 ensureAnimation();
},true);
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
const menuButton=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav');
menuButton?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open))});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuButton?.setAttribute('aria-expanded','false')}));

// Content-rich rooms: a mix of reading notes, introductions, prompts, and clearly labeled original lines.
const rooms={
literature:{eyebrow:'ROOM A / WORDS & HUMANITY',title:'文学：人如何活着',subtitle:'从现实的裂缝里，看见人心；从细小的日常里，重新发现世界。',blocks:[
['从鲁迅开始：清醒的目光','鲁迅的文字像一盏不肯调暗的灯。他写麻木、孤独、围观与自我欺骗，也不断追问一个人如何在沉默中失去自己。读鲁迅，不只是读历史，更是练习辨认熟悉的精神困境。','阅读提示：读《呐喊》《彷徨》时，留意人物为什么无法真正说出自己的处境。'],
['余华与史铁生：苦难之后','余华常用冷静甚至荒诞的叙述，让命运的无常显露出来；史铁生则把身体、命运、信仰与生存的困境写成漫长的自我追问。他们不替苦难镀金，而是认真地看它。','可以从《活着》《许三观卖血记》《我与地坛》开始。'],
['张爱玲、朱自清、季羡林、林清玄','张爱玲擅长从衣着、房间、关系和时代的细节里照见人情的苍凉；朱自清把平常景物写出温柔的层次；季羡林的散文常有平实的学者气；林清玄的文字则常从日常经验转向内心的澄明。','阅读时可以比较：他们分别如何写孤独、亲情、时间与日常。'],
['给自己的阅读方法','不必把阅读变成任务。读到打动你的句子，记下页码和当时的感受；读到不理解的地方，先留下问题。过几个月再读，答案可能已经变了。','郁离自记：一本书不是一扇一次打开的门；它会在不同年纪，把你带去不同的房间。']
]},
philosophy:{eyebrow:'ROOM B / QUESTIONS OF BEING',title:'哲学：把问题想深一点',subtitle:'哲学不是一排必须背诵的答案，而是一场不断校准自己的漫长对话。',blocks:[
['加缪：荒诞与反抗','加缪从世界未必提供明确意义这一困境出发，讨论人如何面对荒诞。他并不鼓励轻易放弃，而是把清醒地生活、拒绝虚假的安慰与持续反抗看作重要姿态。可读《西西弗神话》《局外人》。','问题：如果世界没有预先写好的意义，我能否仍然认真地爱、工作和创造？'],
['康德：理性与尊严','康德试图追问理性能够认识什么、道德如何成立，以及人为什么不能仅仅被当作达成目的的工具。读康德不一定从最难的原著开始，可以先了解“人是目的，而不只是手段”的伦理思想。','问题：当利益与原则冲突时，我希望自己依据什么做决定？'],
['尼采：价值与自我超越','尼采质疑被习惯与社会评价当作天经地义的价值，鼓励人重新审视自己接受的道德、欲望与生活方式。他的文字有诗性，也有挑衅性，适合带着问题读，而不是把警句当成万能答案。','问题：我真正认同的价值，哪些是自己思考后选择的，哪些只是习惯？'],
['庄子、苏格拉底与其他岔路','庄子用寓言松动人对固定尺度的执着；苏格拉底以追问检验未经思考的信念；波伏瓦则让自由与责任进入具体的人际和社会处境。哲学传统并不只有一种声音。','郁离自记：答案让人暂时安稳，问题却可能让人真正长大。']
]},
psychology:{eyebrow:'ROOM C / THE INNER DARKROOM',title:'心理学：观察内心的天气',subtitle:'心理学不是读心术，而是用更谨慎的方法理解行为、情绪与认知。',blocks:[
['记忆并不是录像','记忆会被注意、情绪、后来获得的信息和当下的解释不断重构。回忆很真实地影响我们，但“我记得”并不自动等于“事情完全如此”。','练习：记录一件让你情绪强烈的事，把事实、推测和感受分开写。'],
['认知偏差与思维习惯','确认偏误会让人更容易注意支持自己观点的信息；基本归因错误会让人高估他人的性格、低估情境的影响。认识偏差不是为了给别人贴标签，而是提醒自己也可能判断失准。','问题：我最近一次坚信自己正确时，有没有认真寻找反例？'],
['荣格、弗洛姆与意义','荣格的分析心理学讨论象征、原型与个体化；弗洛姆关注爱、自由与现代社会中的疏离；弗兰克尔则从极端处境出发讨论意义。它们各有理论背景，适合当作思想入口，也要与现代实证研究区分阅读。','阅读提醒：心理学流派不是同一套理论，不要把文学性的说法直接当成临床结论。'],
['观察练习','留意自己在疲惫、被误解或受到赞扬时的反应。先观察，再解释；先描述发生了什么，再猜测为什么。好奇心也可以温柔地用在自己身上。','郁离自记：理解自己，不是替每一种情绪辩护，而是先允许它被看见。']
]},
music:{eyebrow:'ROOM D / SOUND & BREATH',title:'音乐与笛子：让气息有形状',subtitle:'音乐有时不是解释情绪，而是让情绪在一段旋律里获得安放。',blocks:[
['笛子的练习日记','笛子把呼吸变成音色。基础练习可以从稳定长音、气息控制、音准和节奏开始，再逐步练习连音、吐音与乐句。每次练习不必很长，但最好留下可比较的记录。','练习卡：今天的长音是否稳定？换气是否打断乐句？哪个音最容易发虚？'],
['建立自己的聆听清单','试着按场景整理音乐：适合夜晚独处的、适合散步的、让人想起某个地方的、听完后心里更安静的。不要只按流派分类，也可以按情绪、光线和季节分类。','可以留意旋律、节奏、音色、留白，以及一首曲子如何开始与结束。'],
['听觉观察','听一段音乐时，先不看标题与评论。记录三个词：它像什么天气？空间有多大？最明显的声音是什么？再回头听第二遍，观察感受有没有变化。','郁离自记：有些话不适合说出口，于是它们借一口气，绕过笛孔。']
]},
garden:{eyebrow:'ROOM E / SLOW BOTANY',title:'园艺：和时间一起生活',subtitle:'植物不会因为人的着急而更快生长。它教人观察，也教人等待。',blocks:[
['照料比装饰更重要','观察叶片、土壤湿度、光照方向和新芽，比频繁浇水更有用。不同植物需求不同；浇水应结合盆土干湿、季节、温度和盆器排水情况，而不是机械地按日历执行。','每周记录：新叶数量、叶色、盆土干燥速度、摆放位置和最近一次浇水。'],
['一片叶子的观察','看看叶脉如何分叉，叶缘是否完整，光从背面穿过时颜色怎样变化。把植物当作一个微型景观，而不是房间里的摆设。','观察练习：同一株植物，在早晨、午后和阴天分别拍一张照片。'],
['侘寂与不完美','枯叶、旧陶盆、苔痕与不对称并不总需要被立刻清理。美可以存在于变化中，但植物的病害和腐烂仍需要认真处理。','郁离自记：照料一株植物，是把耐心交给一种不会催促你的生命。']
]},
art:{eyebrow:'ROOM F / MATERIAL & FORM',title:'美术：留住材料的时间',subtitle:'我喜欢的美不必光滑、完整或喧闹；纹理、旧痕与留白同样能表达。',blocks:[
['侘寂不是“做旧滤镜”','侘寂常与不完美、无常、朴素和自然材料联系在一起，但它并非单一的装修模板。真正的质感来自材料、比例、光线和使用痕迹之间的关系，而不是简单加上泛黄纹理。','观察：木头的纹路、石头的粗糙、纸的纤维、墙面上缓慢移动的光。'],
['构图与留白','画面里的空白并不是没有内容。它可以让主体显得孤独、庄重或自由。试着只保留三个视觉元素，看看它们之间的距离是否足以形成张力。','练习：拍一张“主体只占画面十分之一”的照片或画一张小稿。'],
['艺术家的观看方式','欣赏作品时，先描述看见了什么，再说自己有什么感受，最后才查阅背景。这样能避免只背诵艺术史结论，也能保留自己的第一反应。','郁离自记：旧物没有停止说话，只是需要更安静的房间。']
]},
photography:{eyebrow:'ROOM G / LIGHT & TIME',title:'摄影：把瞬间留在光里',subtitle:'摄影不是把世界占为己有，而是短暂地向某个瞬间致意。',blocks:[
['光线比器材更先说话','观察顺光、侧光、逆光如何改变物体的轮廓和质感。阴天的光往往柔和，窗边的侧光能让纸张、木头与皮肤的纹理变得可见。','练习：同一件物品，在窗边不同时间拍摄；不急着套滤镜，先看光。'],
['构图不必总是居中','尝试留白、框中框、前景遮挡、反射与不对称。构图规则只是帮助观察的工具，不是每张照片都必须遵守的法则。','每次出门只给自己一个主题：影子、旧墙、植物、门窗，或某种颜色。'],
['建立个人视觉档案','给照片加上日期、地点和一句当时的感受。几年后再看，真正珍贵的可能不只是画面，还有你当时看世界的方式。','郁离自记：摄影不是阻止时间离开，而是承认它曾在这里停留。']
]},
technology:{eyebrow:'ROOM H / CODE & MATTER',title:'计算机：让想法接触现实',subtitle:'我正在从基础开始，把代码、操作系统与硬件慢慢连接起来。',blocks:[
['灯带项目：从现象到原理','灯带项目是一次从可见结果进入工程问题的机会：供电是否稳定？控制信号如何传递？不同颜色或亮度由什么决定？把现象写下来，再逐项验证。','项目档案建议：目标、硬件清单、接线图、控制逻辑、遇到的问题、解决方法和下一步改进。'],
['Linux 与树莓派','学习 Linux 不只是记住命令，而是理解文件系统、权限、进程、网络与服务如何协作。树莓派适合用来练习命令行、部署小服务、连接外设并记录实验。','可以逐步整理：常用命令、文件权限、SSH、Git、网络排错、脚本和系统服务。'],
['RK3588 与嵌入式 Linux','RK3588 这类平台可以让人进一步接触 Linux 系统、驱动、设备树、外设和性能调试。真正深入时，要结合开发板硬件资料与具体系统镜像，不要只停留在名词层面。','学习记录应区分：已完成、正在尝试、计划学习，避免把接触过的平台写成已经精通。'],
['工程的美学','工程与艺术并不冲突。接口、结构、交互和可靠性都可以被认真设计。一个作品既可以工作，也可以让人愿意靠近、理解和使用。','郁离自记：我想做的不只是能运行的东西，也想做让人愿意多看一眼的东西。']
]},
life:{eyebrow:'ROOM I / OPEN ENDED',title:'尚未命名的事',subtitle:'留一间空房，给未来突然闯进来的兴趣。',blocks:[
['随机漫游清单','学一点天文学，认几种云；去旧书店翻一本没听过的书；学会一种新的手工；认真研究一座城市的建筑；试着做一道从未做过的菜。','每个月选一件完全陌生的小事，给它一个下午。'],
['灵感碎片','随手记下一个问题、一张照片、一段旋律、一句偶然听见的话。碎片不需要马上变成作品，它们可以先在脑海里待着。','郁离自记：好奇心不必每次都带我抵达某个地方；有时它只是让我出发。'],
['给未来的自己','希望以后仍然能对新东西感到兴奋，也能耐心把某件事情做深。兴趣可以很多，重要的是在探索的自由里，慢慢找到愿意长期投入的方向。','“不要急着把自己活成一个已经完成的答案。” — 郁离自记']
]}
};
const overlay=document.querySelector('#room-overlay'),roomContent=document.querySelector('#room-content');
function openRoom(key,x=innerWidth*.5,y=innerHeight*.5){const room=rooms[key];if(!room)return;
 const render=()=>{roomContent.innerHTML=`<div class="room-eyebrow">${room.eyebrow}</div><h2 class="room-title">${room.title}</h2><p class="room-subtitle">${room.subtitle}</p><div class="room-rule"></div>${room.blocks.map((b,i)=>`<section><h3>${String(i+1).padStart(2,'0')} / ${b[0]}</h3><p>${b[1]}</p><div class="room-note"><p>${b[2]}</p></div></section>`).join('')}`;overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';overlay.scrollTop=0;};
 if(reduceMotion||matchMedia('(hover:none)').matches){render();return}
 burnTransitionAt(x,y,render);
}
function closeRoom(){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.body.style.overflow='';}
document.querySelectorAll('[data-room]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();openRoom(el.dataset.room,e.clientX||pointerX,e.clientY||pointerY)}));
document.querySelector('.room-close').addEventListener('click',closeRoom);
overlay.addEventListener('click',e=>{if(e.target===overlay)closeRoom()});
addEventListener('keydown',e=>{if(e.key==='Escape')closeRoom()});

// Internal anchor navigation uses a simulated paper-burn edge that expands from the click point.
document.querySelectorAll('a[href^="#"]:not([data-room])').forEach(link=>link.addEventListener('click',e=>{const href=link.getAttribute('href'),target=href&&document.querySelector(href);if(!target)return;if(reduceMotion||matchMedia('(hover:none)').matches)return;e.preventDefault();burnTransitionAt(e.clientX||pointerX,e.clientY||pointerY,()=>{target.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'',href)})}));
document.querySelectorAll('.interest-card').forEach(card=>card.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduceMotion)return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;const art=card.querySelector('.card-art');if(art)art.style.transform=`translate(${x*5}px,${y*5}px)`}));
document.querySelectorAll('.interest-card').forEach(card=>card.addEventListener('pointerleave',()=>{const art=card.querySelector('.card-art');if(art)art.style.transform=''}));
