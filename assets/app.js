(function(){
'use strict';
var D = window.SAVED;
var POSTS = D.posts;
var META = {
  "Recipes":{e:"🍲",s:"recipes",d:"Meal ideas, all in one place"},
  "Workouts":{e:"💪",s:"workouts",d:"Your saved workouts, sorted by focus"},
  "Pregnancy & Postpartum":{e:"🤰",s:"pregnancy-postpartum",d:"Core rehab, birth prep & recovery"},
  "Baby & Parenting":{e:"👶",s:"baby-parenting",d:"Newborn, toddler & mom life"},
  "Weddings":{e:"💍",s:"weddings",d:"Dresses, flowers & inspo"},
  "Money & Career":{e:"💼",s:"money-career",d:"Finance, side hustles & tech"},
  "Crafts, DIY & Home":{e:"🧶",s:"crafts-diy-home",d:"Makes, decor & home"},
  "Shopping & Style":{e:"🛍️",s:"shopping-style",d:"Outfits, gifts & finds"},
  "Funny & Quotes":{e:"😂",s:"funny-quotes",d:"Memes, quotes & relationships"},
  "Other":{e:"✨",s:"other",d:"Travel, local Detroit & more"}
};
var BYSLUG = {}; Object.keys(META).forEach(function(k){BYSLUG[META[k].s]=k;});
var BYID = {}; POSTS.forEach(function(p){BYID[p.shortcode]=p;});
var app = document.getElementById('app');

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
POSTS.forEach(function(p){
  var parts=[p.title,p.summary,p.caption,p.username,p.category,p.subcategory,(p.tags||[]).join(' ')];
  if(p.recipe){parts.push(p.recipe.ingredients.join(' '),p.recipe.steps.join(' '),p.recipe.meal_type,p.recipe.main_protein,p.recipe.cook_method);}
  if(p.workout){parts.push(p.workout.exercises.join(' '),p.workout.body_focus,p.workout.equipment);}
  if(p.details){parts.push(p.details.join(' '));}
  p._hay=norm(parts.join(' \n '));
});
function matches(p,q){
  if(!q) return true;
  var toks=norm(q).split(/\s+/).filter(Boolean);
  for(var i=0;i<toks.length;i++){ if(p._hay.indexOf(toks[i].replace(/^@/,''))<0) return false; }
  return true;
}
function rnd(n){try{var a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n;}catch(e){return Math.floor(Math.random()*n);}}
function countBy(list,fn){var m={};list.forEach(function(p){var k=fn(p);if(k){m[k]=(m[k]||0)+1;}});return m;}

/* ---------- cards ---------- */
function thumbHTML(p,cls){
  if(p.thumbnail) return '<img class="'+cls+'" loading="lazy" src="'+esc(p.thumbnail)+'" alt="">';
  return cls==='thumb' ? '<div class="thumb ph">'+(META[p.category]||{}).e+'</div>' : '';
}
function badges(p){
  var b=[];
  if(p.recipe){
    var r=p.recipe;
    if(r.meal_type) b.push('<span class="badge">'+esc(r.meal_type)+'</span>');
    if(r.cook_method) b.push('<span class="badge">'+esc(r.cook_method)+'</span>');
    if(r.high_protein) b.push('<span class="badge hp">High-protein</span>');
    if(r.recipe_in_caption==='full') b.push('<span class="badge full">Full recipe</span>');
    else if(r.recipe_in_caption==='partial') b.push('<span class="badge">Ingredients listed</span>');
    else if(r.comment_keyword) b.push('<span class="badge kw">Comment “'+esc(r.comment_keyword)+'”</span>');
    else if(r.recipe_link) b.push('<span class="badge kw">Recipe link</span>');
    else b.push('<span class="badge">Recipe in video</span>');
  } else if(p.workout){
    var w=p.workout;
    b.push('<span class="badge">'+esc(w.body_focus)+'</span>');
    b.push('<span class="badge">'+esc(w.equipment==='None'?'No equipment':w.equipment)+'</span>');
    if(w.exercises.length) b.push('<span class="badge hp">Exercises listed</span>');
    if(w.pregnancy_postpartum && p.category!=='Pregnancy & Postpartum') b.push('<span class="badge">Pregnancy/PP</span>');
  } else if(p.subcategory){
    b.push('<span class="badge">'+esc(p.subcategory)+'</span>');
  }
  if(p.summary_is_guess) b.push('<span class="badge guess">Best guess</span>');
  return b.join('');
}
function cardHTML(p,showCat){
  var by='@'+esc(p.username)+(showCat?' · '+esc(p.category):(p.subcategory?' · '+esc(p.subcategory):''));
  var sum=p.summary.replace(/^Best guess \(caption is a teaser; based on the thumbnail\): /,'');
  return '<article class="card" id="p-'+esc(p.shortcode)+'" data-id="'+esc(p.shortcode)+'">'+
    '<button class="card-head" aria-expanded="false">'+thumbHTML(p,'thumb')+
    '<div class="meta"><h3>'+esc(p.title)+'</h3><div class="by">'+by+'</div><p class="sum">'+esc(sum)+'</p><div class="badges">'+badges(p)+'</div></div>'+
    '</button><div class="card-body" hidden></div></article>';
}
function list(items){return '<ul>'+items.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';}
function bodyHTML(p){
  var h='';
  if(p.recipe){
    var r=p.recipe, f=[];
    if(r.meal_type) f.push(r.meal_type);
    if(r.main_protein) f.push('Protein: '+r.main_protein);
    if(r.cook_method) f.push(r.cook_method);
    if(r.high_protein) f.push('High-protein');
    f.push(r.recipe_in_caption==='full'?'Full recipe in caption':r.recipe_in_caption==='partial'?'Ingredients/partial recipe in caption':'Recipe not in caption');
    h+='<div class="facts">'+f.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>';
    if(r.ingredients.length) h+='<h4>Ingredients</h4>'+list(r.ingredients);
    if(r.steps.length) h+='<h4>Steps</h4><ol>'+r.steps.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol>';
    var how=[];
    if(r.comment_keyword) how.push('Comment “'+esc(r.comment_keyword)+'” on the post and the creator will DM you the full recipe.');
    if(r.recipe_link) how.push('Recipe link: <a href="'+esc(/^https?:/.test(r.recipe_link)?r.recipe_link:'https://'+r.recipe_link)+'" target="_blank" rel="noopener">'+esc(r.recipe_link)+'</a>');
    if(!r.ingredients.length && !how.length) how.push('The recipe is shown in the video. Open it on Instagram to watch.');
    if(how.length) h+='<div class="note">'+how.join('<br>')+'</div>';
  } else if(p.workout){
    var w=p.workout;
    h+='<div class="facts"><span>'+esc(w.body_focus)+'</span><span>'+esc(w.equipment==='None'?'No equipment':w.equipment)+'</span></div>';
    if(w.exercises.length) h+='<h4>Exercises / sets</h4>'+list(w.exercises);
    else h+='<div class="note">The exercises are shown in the video. Open it on Instagram to follow along.</div>';
    if(p.comment_keyword) h+='<div class="note">Creator offer: comment “'+esc(p.comment_keyword)+'”.</div>';
  } else {
    if(p.details && p.details.length) h+='<h4>Key points</h4>'+list(p.details);
    if(p.comment_keyword) h+='<div class="note">Comment “'+esc(p.comment_keyword)+'” on the post for the creator’s list/link.</div>';
  }
  h+=thumbHTML(p,'big');
  if(p.summary_is_guess) h+='<div class="note">ℹ️ The caption doesn’t say much, so this summary is a best guess based on the cover image.</div>';
  if(p.caption) h+='<details class="cap"><summary>Full caption</summary><div class="caption">'+esc(p.caption)+'</div></details>';
  if(p.tags && p.tags.length) h+='<div class="tagline">'+p.tags.map(function(t){return '#'+esc(t.replace(/\s+/g,''));}).join(' ')+'</div>';
  h+='<div class="actions"><a class="btn primary small" href="'+esc(p.url)+'" target="_blank" rel="noopener">Open on Instagram ↗</a></div>';
  return h;
}
function toggleCard(card,force){
  var open = force!==undefined ? force : !card.classList.contains('open');
  var body=card.querySelector('.card-body'), head=card.querySelector('.card-head');
  if(open && !body.innerHTML){ body.innerHTML=bodyHTML(BYID[card.dataset.id]); }
  card.classList.toggle('open',open); body.hidden=!open; head.setAttribute('aria-expanded',open?'true':'false');
}
document.addEventListener('click',function(ev){
  var head=ev.target.closest('.card-head');
  if(head){ toggleCard(head.parentNode); }
});
function reveal(id){
  var card=document.getElementById('p-'+id); if(!card) return;
  document.querySelectorAll('.card.open').forEach(function(c){ if(c!==card) toggleCard(c,false); });
  toggleCard(card,true);
  card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
  var top=card.getBoundingClientRect().top+window.pageYOffset-80;
  window.scrollTo({top:top,behavior:'smooth'});
}

/* ---------- pages ---------- */
function searchBox(id,ph,val){
  return '<div class="search'+(val?' has':'')+'"><span class="ico">🔎</span><input id="'+id+'" type="search" enterkeyhint="search" autocomplete="off" placeholder="'+esc(ph)+'" value="'+esc(val||'')+'"><button class="clear" aria-label="Clear search">×</button></div>';
}
function wireSearch(id,onChange){
  var inp=document.getElementById(id), box=inp.parentNode, t;
  inp.addEventListener('input',function(){ box.classList.toggle('has',!!inp.value); clearTimeout(t); t=setTimeout(function(){onChange(inp.value);},120); });
  box.querySelector('.clear').addEventListener('click',function(){ inp.value=''; box.classList.remove('has'); onChange(''); inp.focus(); });
}
var homeQ='';
function renderHome(){
  document.title="Peggy's Saved Posts";
  var counts=countBy(POSTS,function(p){return p.category;});
  var tiles=D.categories.map(function(c,i){
    var m=META[c];
    if(i<2) return '<a class="tile big" href="#c/'+m.s+'"><span class="emo">'+m.e+'</span><span class="txt"><div class="name">'+esc(c)+'</div><div class="desc">'+esc(m.d)+'</div></span><span class="n">'+(counts[c]||0)+'</span></a>';
    return '<a class="tile" href="#c/'+m.s+'"><span class="emo">'+m.e+'</span><span class="name">'+esc(c)+'</span><span class="n">'+(counts[c]||0)+' saves</span></a>';
  }).join('');
  app.innerHTML='<div class="wrap"><div class="hero"><h1>Peggy’s Saved Posts</h1><p>All '+D.total_saved+' Instagram saves, sorted so you can actually find things.</p></div>'+
    searchBox('q','Search recipes, workouts, creators, ingredients…',homeQ)+
    '<div class="quick"><button class="btn primary" id="rand-dinner">🍽️ Give me a dinner idea</button><button class="btn secondary" id="rand-workout">🏋️ Pick a workout for today</button></div>'+
    '<div id="homebody"></div>'+
    '<div class="foot">'+D.usable+' of '+D.total_saved+' saves organized · <a href="#unavailable">'+D.unavailable.length+' couldn’t load</a> · updated Oct 7, 2026</div></div>';
  function body(q){
    homeQ=q;
    var hb=document.getElementById('homebody');
    if(!q){ hb.innerHTML='<div class="sect">Browse</div><div class="tiles">'+tiles+'</div>'; return; }
    var res=POSTS.filter(function(p){return matches(p,q);});
    hb.innerHTML='<div class="resinfo">'+res.length+' result'+(res.length===1?'':'s')+' for “'+esc(q)+'”</div>'+
      (res.length?'<div class="list">'+res.map(function(p){return cardHTML(p,true);}).join('')+'</div>':'<div class="empty">Nothing matched. Try fewer words.</div>');
  }
  body(homeQ); wireSearch('q',body);
  document.getElementById('rand-dinner').onclick=function(){ go('recipes',{random:'dinner'}); };
  document.getElementById('rand-workout').onclick=function(){ go('workouts',{random:'workout'}); };
}
var pending=null;
function go(slug,opts){ pending=opts||null; if(location.hash==='#c/'+slug){ route(); } else { location.hash='#c/'+slug; } }

var STATE={};
function chipGroup(label,key,counts,st,order){
  var keys=Object.keys(counts);
  if(order) keys.sort(function(a,b){var ia=order.indexOf(a),ib=order.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib);});
  else keys.sort(function(a,b){return counts[b]-counts[a];});
  return '<div class="fgroup"><div class="flabel">'+esc(label)+'</div><div class="chips">'+
    '<button class="chip'+(!st[key]?' on':'')+'" data-k="'+key+'" data-v="">All</button>'+
    keys.map(function(k){return '<button class="chip'+(st[key]===k?' on':'')+'" data-k="'+key+'" data-v="'+esc(k)+'">'+esc(k)+'<span class="c">'+counts[k]+'</span></button>';}).join('')+
    '</div></div>';
}
function toggleChip(label,key,st){return '<button class="chip toggle'+(st[key]?' on':'')+'" data-t="'+key+'">'+esc(label)+'</button>';}

function renderCategory(cat){
  var m=META[cat]; document.title=cat+" · Peggy's Saved Posts";
  var st=STATE[cat]||(STATE[cat]={q:''});
  var base;
  if(cat==='Workouts'){ base=POSTS.filter(function(p){return p.workout;}); }
  else base=POSTS.filter(function(p){return p.category===cat;});
  var MO=["Lunch & Dinner","Breakfast","Snack","Dessert","Drink","Toddler & Kids","Sides & Salads","Baking & Bread","Meal Plans & Guides"];
  var FO=["Full Body","Legs & Glutes","Core & Abs","Upper Body","Cardio & HIIT","Splits & Programs","Mobility & Stretching"];
  function oi(arr,v){var i=arr.indexOf(v);return i<0?99:i;}
  base=base.slice().sort(function(a,b){
    var ka,kb;
    if(cat==='Recipes'){ka=oi(MO,a.recipe.meal_type);kb=oi(MO,b.recipe.meal_type);}
    else if(cat==='Workouts'){ka=oi(FO,a.workout.body_focus)+(a.workout.pregnancy_postpartum?50:0);kb=oi(FO,b.workout.body_focus)+(b.workout.pregnancy_postpartum?50:0);}
    else {ka=a.subcategory;kb=b.subcategory;}
    if(ka<kb) return -1; if(ka>kb) return 1;
    return a.title.localeCompare(b.title);
  });
  var extra='';
  if(cat==='Recipes') extra='<div class="toolbar"><button class="btn primary small" id="rand">🍽️ Give me a dinner idea</button></div>';
  if(cat==='Workouts') extra='<div class="toolbar"><button class="btn secondary small" id="rand">🏋️ Pick a workout for today</button></div>';
  app.innerHTML='<div class="top"><div class="wrap"><div class="bar"><button class="back" aria-label="Back to home" onclick="location.hash=\'\'">‹</button><h1>'+m.e+' '+esc(cat)+'</h1><span class="count" id="cnt"></span></div>'+
    searchBox('cq','Search '+cat.toLowerCase()+'…',st.q)+'</div></div>'+
    '<div class="wrap">'+extra+'<div class="filters" id="filters"></div><div class="resinfo" id="info"></div><div class="list" id="list"></div></div>';
  function filtered(){
    return base.filter(function(p){
      if(!matches(p,st.q)) return false;
      if(cat==='Recipes'){
        var r=p.recipe;
        if(st.meal && r.meal_type!==st.meal) return false;
        if(st.protein && r.main_protein!==st.protein) return false;
        if(st.method && r.cook_method!==st.method) return false;
        if(st.hp && !r.high_protein) return false;
        if(st.full && r.recipe_in_caption!=='full') return false;
      } else if(cat==='Workouts'){
        var w=p.workout;
        if(!st.pp && w.pregnancy_postpartum) return false;
        if(st.focus && w.body_focus!==st.focus) return false;
        if(st.equip && w.equipment!==st.equip) return false;
        if(st.ex && !w.exercises.length) return false;
      } else {
        if(st.sub && p.subcategory!==st.sub) return false;
      }
      return true;
    });
  }
  function drawFilters(){
    var f='';
    if(cat==='Recipes'){
      f+=chipGroup('Meal type','meal',countBy(base,function(p){return p.recipe.meal_type;}),st,["Lunch & Dinner","Breakfast","Snack","Dessert","Drink","Toddler & Kids","Baking & Bread","Sides & Salads","Meal Plans & Guides"]);
      f+=chipGroup('Main protein','protein',countBy(base,function(p){return p.recipe.main_protein;}),st);
      f+=chipGroup('Cook method','method',countBy(base,function(p){return p.recipe.cook_method;}),st,["Crockpot","Sheet pan","Air fryer","One-pot / one-pan","Oven-baked","Stovetop","No-cook / no-bake","Freezer meal","Meal prep"]);
      f+='<div class="fgroup"><div class="chips">'+toggleChip('💪 High-protein','hp',st)+toggleChip('📝 Full recipe in caption','full',st)+'</div></div>';
    } else if(cat==='Workouts'){
      var pool=base.filter(function(p){return st.pp||!p.workout.pregnancy_postpartum;});
      f+=chipGroup('Body focus','focus',countBy(pool,function(p){return p.workout.body_focus;}),st,["Full Body","Legs & Glutes","Core & Abs","Upper Body","Cardio & HIIT","Splits & Programs","Mobility & Stretching"]);
      f+=chipGroup('Equipment','equip',countBy(pool,function(p){return p.workout.equipment;}),st,["None","Dumbbells","Gym"]);
      var ppn=base.filter(function(p){return p.workout.pregnancy_postpartum;}).length;
      f+='<div class="fgroup"><div class="chips">'+toggleChip('📋 Has exercise list','ex',st)+toggleChip('🤰 Include pregnancy & postpartum ('+ppn+')','pp',st)+'</div></div>';
    } else {
      var sc=countBy(base,function(p){return p.subcategory;});
      if(Object.keys(sc).length>1) f+=chipGroup('Type','sub',sc,st);
    }
    var fe=document.getElementById('filters'); fe.innerHTML=f;
    fe.querySelectorAll('.chip[data-k]').forEach(function(b){ b.onclick=function(){ st[b.dataset.k]=b.dataset.v||''; drawFilters(); draw(); }; });
    fe.querySelectorAll('.chip[data-t]').forEach(function(b){ b.onclick=function(){ st[b.dataset.t]=!st[b.dataset.t]; if(b.dataset.t==='pp'){st.focus='';st.equip='';} drawFilters(); draw(); }; });
  }
  function draw(){
    var res=filtered();
    var total=cat==='Workouts'&&!st.pp ? base.filter(function(p){return !p.workout.pregnancy_postpartum;}).length : base.length;
    document.getElementById('cnt').textContent=res.length+(res.length===total?'':' of '+total);
    var info='';
    if(res.length!==total) info=res.length+' match'+(res.length===1?'':'es');
    else if(cat==='Workouts'&&!st.pp) info=total+' workouts · pregnancy & postpartum moves are under the 🤰 toggle';
    document.getElementById('info').textContent=info;
    document.getElementById('list').innerHTML = res.length ? res.map(function(p){return cardHTML(p,false);}).join('') : '<div class="empty">No saves match these filters.</div>';
    return res;
  }
  function pickRandom(){
    var res=filtered(), pool;
    if(cat==='Recipes'){
      pool=res.filter(function(p){return p.recipe.meal_type==='Lunch & Dinner';});
      if(!pool.length){ Object.keys(st).forEach(function(k){ if(k!=='q') st[k]=''; }); st.q=''; document.getElementById('cq').value=''; drawFilters(); res=draw(); pool=res.filter(function(p){return p.recipe.meal_type==='Lunch & Dinner';}); }
    } else {
      pool=res;
      if(!pool.length){ Object.keys(st).forEach(function(k){ st[k]=''; }); document.getElementById('cq').value=''; drawFilters(); pool=draw(); }
    }
    var p=pool[rnd(pool.length)];
    if(p) reveal(p.shortcode);
  }
  drawFilters(); draw();
  wireSearch('cq',function(q){st.q=q; draw();});
  var rb=document.getElementById('rand'); if(rb) rb.onclick=pickRandom;
  if(pending && pending.random){ pending=null; setTimeout(pickRandom,30); }
}
function renderUnavailable(){
  document.title="Couldn't load · Peggy's Saved Posts";
  app.innerHTML='<div class="top"><div class="wrap"><div class="bar"><button class="back" aria-label="Back to home" onclick="location.hash=\'\'">‹</button><h1>⚠️ Couldn’t load</h1><span class="count">'+D.unavailable.length+'</span></div></div></div>'+
    '<div class="wrap"><p class="resinfo">These saves didn’t return any data. The post was probably deleted, made private, or has embedding turned off. Tap to try them on Instagram.</p><ul class="unav">'+
    D.unavailable.map(function(u){return '<li><a href="'+esc(u.url)+'" target="_blank" rel="noopener">'+esc(u.url)+'</a></li>';}).join('')+'</ul></div>';
}
function route(){
  var h=decodeURIComponent(location.hash.replace(/^#/,''));
  window.scrollTo(0,0);
  if(h.indexOf('c/')===0 && BYSLUG[h.slice(2)]) renderCategory(BYSLUG[h.slice(2)]);
  else if(h==='unavailable') renderUnavailable();
  else renderHome();
}
try{history.scrollRestoration='manual';}catch(e){}
window.addEventListener('hashchange',route);
route();
})();
