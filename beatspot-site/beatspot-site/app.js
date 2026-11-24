const $ = s => document.querySelector(s),
  $$ = s => [...document.querySelectorAll(s)];
const ST = (k, d) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d
    } catch (e) {
      return d
    }
  },
  SV = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v))
    } catch (e) {}
  };
const toast = m => {
  const t = $('#toast');
  t.textContent = m;
  t.className = 's';
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.className = '', 2000)
};
const fmt = s => {
  s = Math.max(0, Math.round(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
};
/* ---------- data (all demo music is generated live in the browser: original + royalty-free) ---------- */
const M = {
  m9: [0, 3, 7, 10, 14],
  M9: [0, 4, 7, 11, 14],
  d9: [0, 4, 7, 10, 14]
};
const TR = [{
  t: 'Late Night Notes',
  a: 'Moonlit Keys',
  bpm: 72,
  g: ['#7c3aed', '#0ea5e9'],
  p: [
    [62, 'm9'],
    [67, 'm9'],
    [60, 'd9'],
    [65, 'M9']
  ]
}, {
  t: 'Rainy Window',
  a: 'Paper Lanterns',
  bpm: 68,
  g: ['#0891b2', '#1e1b4b'],
  p: [
    [64, 'm9'],
    [69, 'm9'],
    [62, 'd9'],
    [67, 'M9']
  ]
}, {
  t: 'Coffee Steam',
  a: 'Tea & Tape',
  bpm: 80,
  g: ['#f97316', '#be185d'],
  p: [
    [65, 'M9'],
    [64, 'm9'],
    [62, 'm9'],
    [67, 'd9']
  ]
}, {
  t: 'Dusk Walk',
  a: 'Static Bloom',
  bpm: 75,
  g: ['#ec4899', '#7c3aed'],
  p: [
    [60, 'M9'],
    [69, 'm9'],
    [62, 'm9'],
    [67, 'd9']
  ]
}, {
  t: 'Winter Study',
  a: 'Moonlit Keys',
  bpm: 66,
  g: ['#38bdf8', '#4c1d95'],
  p: [
    [58, 'M9'],
    [67, 'm9'],
    [60, 'm9'],
    [65, 'd9']
  ]
}];
const ARTISTS = [
  ['Moonlit Keys', 'Lofi Piano', '#22d3ee'],
  ['Paper Lanterns', 'Chillhop', '#a855f7'],
  ['Tea & Tape', 'Jazzhop', '#f97316'],
  ['Static Bloom', 'Ambient', '#ec4899']
];
const HUBS = {
  'Midnight Study Club': {
    n: '142K',
    o: 28,
    m: [
      ['stellarbeat', '“Late Night Notes” is basically the sound of 2 a.m. deadlines, in the best way.', 2],
      ['beanbagjoe', 'pass ba ang project niyo? hahaha', 5],
      ['neonpulse', 'The Rhodes chords on this one hit different when you’re cramming. Total grower.', 8],
      ['basslinequeen', 'Been using this hub as my study-with-me room since last term. Focus mode unlocked.', 12]
    ]
  },
  'Rainy Day Radio': {
    n: '89K',
    o: 17,
    m: [
      ['drizzle_dan', 'Rainy Window on repeat. Typhoon weather, perfect soundtrack.', 3],
      ['kapeko', 'who else is listening from Davao?', 9]
    ]
  },
  'Coffee Beat Crew': {
    n: '54K',
    o: 11,
    m: [
      ['latte.lena', 'Coffee Steam + a warm mug = my whole Saturday.', 4]
    ]
  }
};
const EV = [
  ['Moonlit Keys Live', 'Lofi Night Vol. 3', '2026-10-30', 'SMX Convention Center · Davao City, PH', 312, 847, 'Lofi', '#22d3ee', 0, '10 km'],
  ['Paper Lanterns', 'Rainy Season Sessions', '2026-11-14', 'Cultural Center · Metro Manila, PH', 1284, 3201, 'Chillhop', '#a855f7', 1, '1000 km'],
  ['Tea & Tape', 'Coffee & Beats Fest', '2026-11-28', 'Okada Crystal Pavilion · Parañaque, PH', 984, 1593, 'Jazzhop', '#ec4899', 2, '1000 km'],
  ['Static Bloom', 'Winter Ambient Kick-Off', '2026-12-12', 'Philippine Arena · Bulacan, PH', 156, 423, 'Ambient', '#f97316', 3, '1000 km']
];
const REPLY = ['Same here!', 'Haha true 😄', 'Adding this to my playlist.', 'This track never gets old.', 'Study session starts now 📚', 'Facing finals soon, send help (and more lofi)'];
/* ---------- audio engine (Web Audio, generative lofi) ---------- */
const A = {
  ctx: null,
  on: false,
  i: 0,
  step: 0,
  next: 0,
  timer: null,
  sh: false,
  rp: false,
  vol: .8,
  eq: 'Flat'
};
const hz = m => 440 * 2 ** ((m - 69) / 12),
  LEN = 512;

function init() {
  if (A.ctx) return;
  const c = A.ctx = new(window.AudioContext || window.webkitAudioContext)();
  const f = (t, fr, g) => {
    const b = c.createBiquadFilter();
    b.type = t;
    b.frequency.value = fr;
    if (g != null) b.gain.value = g;
    return b
  };
  A.bus = c.createGain();
  A.lp = f('lowpass', 3800);
  A.lo = f('lowshelf', 200, 0);
  A.md = f('peaking', 1500, 0);
  A.hi = f('highshelf', 4000, 0);
  A.m = c.createGain();
  A.m.gain.value = A.vol;
  A.bus.connect(A.lp);
  A.lp.connect(A.lo);
  A.lo.connect(A.md);
  A.md.connect(A.hi);
  A.hi.connect(A.m);
  A.m.connect(c.destination);
  const b = A.nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate),
    d = b.getChannelData(0);
  for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
  const n = c.createBufferSource(),
    g = c.createGain(),
    h = f('highpass', 3500);
  n.buffer = b;
  n.loop = true;
  g.gain.value = .012;
  n.connect(h);
  h.connect(g);
  g.connect(A.m);
  n.start()
}

function tone(t, m, d, v, ty) {
  const c = A.ctx,
    o = c.createOscillator(),
    g = c.createGain();
  o.type = ty || 'triangle';
  o.frequency.value = hz(m);
  o.detune.value = (Math.random() - .5) * 14;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + .02);
  g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g);
  g.connect(A.bus);
  o.start(t);
  o.stop(t + d + .05)
}

function drum(t, k) {
  const c = A.ctx,
    g = c.createGain();
  g.connect(A.bus);
  if (k == 'k') {
    const o = c.createOscillator();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(40, t + .15);
    g.gain.setValueAtTime(.9, t);
    g.gain.exponentialRampToValueAtTime(.001, t + .3);
    o.connect(g);
    o.start(t);
    o.stop(t + .35)
  } else {
    const s = c.createBufferSource(),
      f = c.createBiquadFilter(),
      sn = k == 's';
    s.buffer = A.nb;
    f.type = sn ? 'bandpass' : 'highpass';
    f.frequency.value = sn ? 1800 : 7000;
    g.gain.setValueAtTime(sn ? .45 : .1, t);
    g.gain.exponentialRampToValueAtTime(.001, t + (sn ? .18 : .04));
    s.connect(f);
    f.connect(g);
    s.start(t, Math.random());
    s.stop(t + .2)
  }
}

function sched(s, t) {
  const T = TR[A.i],
    q = 60 / T.bpm / 4,
    pos = s & 15,
    [r, ty] = T.p[(s >> 4) % 4],
    ch = M[ty].map(x => r + x);
  t += s % 2 ? q * .3 : 0;
  if (pos == 0) ch.forEach((x, k) => tone(t + k * .012, x, q * 15, .06));
  if (pos == 10 && Math.random() < .6) ch.slice(1, 4).forEach(x => tone(t, x, q * 3, .04));
  if (pos == 0 || pos == 10) tone(t, r - 24, q * 4, .3, 'sine');
  if (pos == 0 || pos == 10 || (pos == 7 && Math.random() < .3)) drum(t, 'k');
  if (pos == 4 || pos == 12) drum(t, 's');
  if (pos % 2 == 0 && Math.random() < .85) drum(t, 'h');
  if ([0, 3, 6, 8, 11, 14].includes(pos) && Math.random() < .33) {
    const sc = [0, 2, 4, 7, 9],
      n = r + 12 + sc[Math.floor(Math.random() * 5)] + (Math.random() < .3 ? 12 : 0);
    tone(t, n, q * 3, .05, 'sine')
  }
}

function tick() {
  const c = A.ctx;
  while (A.next < c.currentTime + .2) {
    sched(A.step, A.next);
    A.next += 60 / TR[A.i].bpm / 4;
    A.step++;
    if (A.step >= LEN) {
      skip(1, true);
      return
    }
  }
}

function load(i) {
  A.i = (i + TR.length) % TR.length;
  A.step = 0;
  if (A.ctx) A.next = A.ctx.currentTime + .05;
  const p = ST('plays', {});
  p[A.i] = (p[A.i] || 0) + 1;
  SV('plays', p)
}

function play(i) {
  init();
  if (i != null && i !== A.i || i != null && !A.on && A.step == 0) {
    if (i !== A.i || A.step == 0) load(i)
  }
  A.ctx.resume();
  if (!A.timer) {
    A.next = A.ctx.currentTime + .05;
    A.timer = setInterval(tick, 40)
  }
  A.on = true;
  ui()
}

function pause() {
  if (A.ctx) A.ctx.suspend();
  A.on = false;
  ui()
}

function toggle() {
  A.on ? pause() : play()
}

function skip(d, auto) {
  if (auto && A.rp) {
    load(A.i)
  } else load(A.sh ? Math.floor(Math.random() * TR.length) : A.i + d);
  if (A.ctx) A.next = A.ctx.currentTime + .05;
  if (!A.on && !auto) play();
  ui();
  if (location.hash == '#/player') render()
}
const EQ = {
  Flat: [0, 0, 0],
  'Bass Boost': [9, 0, 0],
  Vocal: [-2, 6, 0],
  Treble: [0, 0, 8],
  Custom: [4, -2, 5]
};

function setEQ(n) {
  A.eq = n;
  if (!A.ctx) init();
  const [a, b, c] = EQ[n];
  A.lo.gain.value = a;
  A.md.gain.value = b;
  A.hi.gain.value = c
}
const pos = () => A.step * 60 / TR[A.i].bpm / 4,
  dur = () => LEN * 60 / TR[A.i].bpm / 4;
/* ---------- UI helpers ---------- */
const cov = (i, s) => `<div class="cov" style="width:${s}px;height:${s}px;background:linear-gradient(135deg,${TR[i].g[0]},${TR[i].g[1]})"></div>`;
const user = () => ST('user', null),
  initial = () => (user() || 'G')[0].toUpperCase();
const liked = () => ST('liked', []);
const IC = {
  pl: '▶',
  pa: '❚❚'
};

function ui() {
  const T = TR[A.i],
    p = pos(),
    d = dur(),
    f = p / d * 100;
  $$('[data-pp]').forEach(e => e.textContent = A.on ? IC.pa : IC.pl);
  $$('.pgv').forEach(e => {
    e.style.setProperty('--p', f + '%');
    if (document.activeElement !== e) e.value = f * 10
  });
  $$('.tcur').forEach(e => e.textContent = fmt(p));
  $$('.trem').forEach(e => e.textContent = '-' + fmt(d - p));
  document.body.classList.toggle('on-air', A.on);
  $$('.tr[data-i]').forEach(e => e.classList.toggle('cur', +e.dataset.i == A.i && (A.on || A.step > 0)));
  $$('.sh').forEach(e => e.classList.toggle('on', A.sh));
  $$('.rp').forEach(e => e.classList.toggle('on', A.rp));
  $$('.hrt').forEach(e => e.textContent = liked().includes(A.i) ? '♥' : '♡')
}

function mini() {
  const T = TR[A.i];
  $('#mini').innerHTML = `<div class="t" data-go="player">${cov(A.i,40)}<div><b>${T.t}</b><span class="mu">${T.a}</span></div></div><input class="pgv pg" type="range" min="0" max="1000" data-seek><div class="c"><button class="sh" data-a="sh">⇄</button><button data-a="prev">⏮</button><button class="pp" data-pp data-a="tog">▶</button><button data-a="next">⏭</button><button class="rp" data-a="rp">↻</button></div><div class="k">LOSSLESS · 1411 KBPS</div>`;
  ui()
}
const NAV = [
  ['home', 'Home', '⌂'],
  ['community', 'Community', '◎'],
  ['concerts', 'Concerts', '◈'],
  ['profile', 'Profile', '◉']
];

function shell(r, body) {
  return `<div class="app"><aside><div class="logo"><i>♫</i>Beat<b>Spot</b></div>${NAV.map(n=>`<a class="nv ${r==n[0]?'on':''}" href="#/${n[0]}"><span>${n[2]}</span>${n[1]}</a>`).join('')}<div class="lib">LIBRARY</div>${['Liked Songs','My Playlists','Downloaded','History'].map(x=>`<div class="ll" data-a="lib">${x}</div>`).join('')}</aside><main>${body}</main></div>`
}
const trRow = (i, n, x) => `<div class="tr" data-i="${i}" data-a="row">${cov(i,40)}<span class="n">${n}</span><div class="m"><b>${TR[i].t}${x?'<span class="hot">HOT</span>':''}</b><small>${TR[i].a}</small></div><div class="r">${(24-n*1.3).toFixed(1)}M<br>${fmt(LEN*60/TR[i].bpm/4)}</div></div>`;
/* ---------- views ---------- */
const V = {
  home() {
    const h = new Date().getHours(),
      g = h < 12 ? 'Good morning,' : h < 18 ? 'Good afternoon,' : 'Good evening,';
    return shell('home', `<div class="hd"><div><small>${g}</small><h1>${user()||'Guest'}</h1></div><div class="av" data-go="profile">${initial()}</div></div>
<div class="hero"><span class="tag">● LIVE HUB</span><h2>Midnight Study Club is buzzing right now</h2><button class="btn" data-go="community">Join →</button></div>
<div class="sec"><h2>Featured Artists</h2><a data-a="toast" data-m="Artist pages coming soon">See all</a></div>
<div class="row">${ARTISTS.map((a,i)=>`<div class="art" data-a="row" data-i="${i}"><div class="ring" style="--c:${a[2]}"><div style="background:linear-gradient(135deg,${TR[i].g[0]},${TR[i].g[1]})"></div></div>${a[0]}<small>${a[1]}</small></div>`).join('')}</div>
<div class="sec"><h2>Trending Now</h2><a data-a="toast" data-m="Full chart coming soon">View chart</a></div>
<div class="card">${TR.map((_,i)=>trRow(i,i+1,i%4==0)).join('')}</div>
<div class="sec"><h2>Community Picks</h2><a data-go="community">Explore</a></div>
<div class="row">${[['Study Session Essentials','Rj Poiroux',74,[0,1,2,3]],['Where Is My Mind','Fretto',39,[3,4,0,2]],['Winter 2026','Shylo Popkin',166,[4,4,1,1]]].map(p=>`<div class="pk" data-a="row" data-i="${p[3][0]}"><div class="g">${p[3].map(i=>`<div style="background:linear-gradient(135deg,${TR[i].g[0]},${TR[i].g[1]})"></div>`).join('')}</div><b>${p[0]}</b><span class="mu">by ${p[1]} · ${p[2]} tracks</span></div>`).join('')}</div>
<div class="card up" data-go="concerts">${cov(0,48)}<div style="flex:1"><small>UPCOMING NEAR YOU</small><div class="sf" style="font-size:15px">Moonlit Keys, Paper Lanterns, Tea & Tape</div><span class="mu">Oct 30 · SMX Convention Center, Davao City</span></div><span style="color:var(--ac)">→</span></div>`)
  },
  community() {
    const names = Object.keys(HUBS),
      cur = ST('hub', names[0]),
      H = HUBS[cur],
      mine = ST('chat', {})[cur] || [],
      all = [...H.m.map(m => ({
        u: m[0],
        t: m[1],
        m: m[2] + 'm ago'
      })), ...mine];
    return shell('community', `<div class="hd"><h1>Community Hubs</h1></div><div class="chips">${names.map(n=>`<button class="chip ${n==cur?'on':''}" data-a="hub" data-n="${n}">${n}${n==cur?' ★':''}</button>`).join('')}</div>
<div class="hubh"><div class="av" style="width:46px;height:46px;background:linear-gradient(135deg,var(--ac),var(--pk))">${cur[0]}</div><div style="flex:1"><b>${cur}</b><div class="mu">${H.n} members · <span style="color:var(--cy)">● ${H.o} online</span></div></div><button class="chip on" data-a="toast" data-m="You’re already in this hub">Joined ✓</button></div>
<div class="tabs"><span class="tab on"># Live Chat</span><span class="tab" data-a="toast" data-m="Bulletin board coming soon">📌 Bulletin Board</span></div>
<div class="chat"><div class="msgs" id="msgs">${all.map(m=>`<div class="msg"><div class="av" style="background:linear-gradient(135deg,var(--ac),var(--cy))">${m.u[0].toUpperCase()}</div><div><b>${m.u}</b><time>${m.m}</time><div>${m.t.replace(/</g,'&lt;')}</div></div></div>`).join('')}</div>
<div class="inp"><input id="ci" placeholder="Message ${cur}…" maxlength="300"><button data-a="note" title="Share now playing">♫</button><button class="go" data-a="send">➜</button></div></div>`)
  },
  concerts() {
    const mo = ST('mo', 'All'),
      going = ST('going', []),
      months = ['All', 'Oct', 'Nov', 'Dec'];
    const L = EV.filter(e => mo == 'All' || new Date(e[2] + 'T00:00').toLocaleString('en', {
      month: 'short'
    }) == mo);
    return shell('concerts', `<div class="hd"><h1>Concerts & Events</h1></div><div class="chips">${months.map(m=>`<button class="chip ${m==mo?'on':''}" data-a="mo" data-m="${m}">${m=='All'?'All dates':m+' 2026'}</button>`).join('')}</div><div class="mu" style="margin-bottom:14px">● Davao City, PH · within 1000 km</div>
${L.map(e=>{const k=EV.indexOf(e),on=going.includes(k),n=e[4]+(on?1:0);return`<div class="card ev"><div class="im" style="background:linear-gradient(120deg,${TR[e[8]].g[0]},${TR[e[8]].g[1]})"><span class="chip" style="position:absolute;left:12px;top:12px;background:#000a">📍 ${e[9]}</span><span class="chip" style="position:absolute;right:12px;top:12px;color:${e[7]}">${e[6]}</span></div><div class="bd"><h2>${e[0]}</h2><div style="color:${e[7]};font-size:12px;margin:2px 0">${e[1]}</div><div>${new Date(e[2]+'T00:00').toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}</div><div class="mu">${e[3]}</div><div class="mu" style="margin-top:6px"><span style="color:var(--cy)">✓</span> ${n} going &nbsp; ${e[5]} interested</div><div class="acts"><button class="big ${on?'on':''}" style="--c:${e[7]}" data-a="going" data-k="${k}">${on?'You’re going ✓':'I’m Going'}</button><button class="sm" data-a="toast" data-m="Meetup created in the hub chat">Meetup</button></div></div></div>`}).join('')||'<p class="mu">No events this month.</p>'}`)
  },
  profile() {
    const u = user() || 'Guest',
      p = ST('plays', {}),
      tab = ST('ptab', 'stats'),
      lk = liked(),
      ac = ST('ac', '#a855f7'),
      top = TR.map((_, i) => i).sort((a, b) => (p[b] || 0) - (p[a] || 0));
    const G = [
      ['Lofi Chill', 38, '#a855f7'],
      ['Jazzhop', 27, '#22d3ee'],
      ['Study Beats', 18, '#ec4899'],
      ['Ambient', 11, '#f97316'],
      ['Other', 6, '#6b6a7e']
    ];
    const body = tab == 'stats' ? `<h2 style="font-size:18px;margin:6px 0 10px">Genre Breakdown</h2><div class="card" style="padding:14px 18px">${G.map(g=>`<div class="bar"><span>${g[0]}</span><i><u style="width:${g[1]*2}%;background:${g[2]}"></u></i><span>${g[1]}%</span></div>`).join('')}</div><h2 style="font-size:18px;margin:24px 0 10px">Most Played</h2><div class="card">${top.map((i,k)=>trRow(i,k+1,0).replace(/<div class="r">.*?<\/div>/,`<div class="r">${(p[i]||0)+[87,63,41,55,20][i]} plays</div>`)).join('')}</div>` : tab == 'lists' ? `<h2 style="font-size:18px;margin:6px 0 10px">Liked Songs</h2><div class="card">${lk.length?lk.map((i,k)=>trRow(i,k+1,0)).join(''):'<p class="mu" style="padding:18px">Tap ♡ in the player to like songs.</p>'}</div>` : `<h2 style="font-size:18px;margin:6px 0 10px">Accent color</h2><div class="chips">${['#a855f7','#22d3ee','#ec4899','#f97316'].map(c=>`<button class="chip" data-a="ac" data-c="${c}" style="${c==ac?'border-color:'+c:''}"><i style="width:14px;height:14px;border-radius:50%;background:${c}"></i>${c==ac?'Selected':''}</button>`).join('')}</div><button class="chip" data-a="logout">Log out</button>`;
    return shell('profile', `<div class="ban"></div><div class="pro"><div class="av">${initial()}</div><div style="flex:1;padding-bottom:6px"><h1 style="font-size:22px">${u}</h1><span class="mu">@${u.toLowerCase().replace(/\W/g,'')} · Davao City, PH</span></div><button class="chip on" data-a="toast" data-m="Profile editing coming soon">Edit Profile</button></div>
<p style="margin:12px 0 4px">Music is the answer. Hoping to find new friends who are music fanatics like me. Rock on!</p><span class="mu">Joined August 2026</span>
<div class="st">${[['3.2K','Following'],['847','Followers'],['12.4K','Scrobbles'],[EV.length+ST('going',[]).length,'Concerts']].map(s=>`<div class="card"><b>${s[0]}</b><small>${s[1]}</small></div>`).join('')}</div>
<div class="tabs">${[['stats','Listening Stats'],['lists','Playlists'],['cust','Customize']].map(t=>`<button class="tab ${t[0]==tab?'on':''}" data-a="ptab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>${body}`)
  },
  player() {
    const T = TR[A.i],
      tab = ST('pt', 'Player');
    return shell('player', `<div class="hd"><a class="mu" href="#/home">‹ Home</a><span class="lb">LOSSLESS · 1411 KBPS</span><span class="mu">⋯</span></div>
<div class="pl"><div class="disc" style="background:radial-gradient(circle at 35% 30%,${T.g[0]},${T.g[1]} 70%)"></div></div>
<div style="display:flex;justify-content:space-between;align-items:center"><div><h1 style="font-size:26px">${T.t}</h1><span class="mu">${T.a} · BeatSpot Lofi</span></div><button class="hrt" data-a="like" style="font-size:24px"></button></div>
<div class="seg">${['Player','Lyrics','Queue'].map(t=>`<button class="${t==tab?'on':''}" data-a="pt" data-t="${t}">${t}</button>`).join('')}</div>
${tab=='Player'?`<input class="pgv" type="range" min="0" max="1000" data-seek><div style="display:flex;justify-content:space-between" class="mu"><span class="tcur"></span><span class="trem"></span></div>
<div class="ctl"><button class="sh" data-a="sh">⇄</button><button data-a="prev">⏮</button><button class="pp" data-pp data-a="tog">▶</button><button data-a="next">⏭</button><button class="rp" data-a="rp">↻</button></div>
<div style="display:flex;gap:10px;align-items:center" class="mu">🔈<input type="range" min="0" max="100" value="${A.vol*100}" style="--p:${A.vol*100}%" data-vol>🔊</div>
<div class="chips" style="margin-top:14px">${Object.keys(EQ).map(n=>`<button class="chip ${n==A.eq?'on':''}" data-a="eq" data-n="${n}">${n}</button>`).join('')}</div>`:tab=='Lyrics'?`<div class="card" style="padding:28px;text-align:center"><p class="sf" style="font-size:20px">♪ Instrumental ♪</p><p class="mu" style="margin-top:8px">This demo track is generated live in your browser: no lyrics, just vibes.</p></div>`:`<div class="card">${TR.map((_,i)=>trRow(i,i+1,0)).join('')}</div>`}`)
  },
  login() {
    const su = ST('mode', 'up') == 'up';
    return `<div class="lg"><div class="h"><div class="logo" style="font-size:30px"><i>♫</i>Beat<b>Spot</b></div><h1>Jam your beats,<br>spot your community.</h1><p style="margin-top:12px;opacity:.85">Free lofi beats and live community hubs. Demo build.</p></div>
<form id="lf"><h1 style="font-size:28px;text-align:center">${su?'Create an Account':'Welcome back'}</h1><p class="mu" style="text-align:center;margin-bottom:8px">${su?'it’s free, instant beats!':'Nice to see you!'}</p>
<label>Username<input name="u" required placeholder="Juan dela Cruz" maxlength="30"></label>
${su?'<label>Email<input name="e" type="email" required placeholder="jdcruz@comsay.edu.ph"></label>':''}
<label>Password<input name="p" type="password" required minlength="4" placeholder="••••••••"></label>
<button class="cta" type="submit">${su?'Sign Up':'Log In'}</button><p class="mu" style="text-align:center">or ${su?'sign up':'log in'} with</p>
<div class="soc"><button type="button" data-a="toast" data-m="Social login is disabled in the demo">G</button><button type="button" data-a="toast" data-m="Social login is disabled in the demo">f</button><button type="button" data-a="toast" data-m="Social login is disabled in the demo"></button></div>
<p style="text-align:center" class="mu"><a href="#" data-a="mode" style="color:var(--ac)">${su?'Already have an account? Log in':'New here? Sign up'}</a> · <a href="#/home" data-a="guest" style="text-decoration:underline">Continue as guest</a></p></form></div>`
  }
};
/* ---------- router ---------- */
function render() {
  let r = location.hash.replace('#/', '') || (user() ? 'home' : 'login');
  if (!V[r]) r = 'home';
  if (r != 'login' && !user() && !ST('guest', 0)) {
    location.hash = '#/login';
    return
  }
  $('#v').innerHTML = V[r]();
  const out = r == 'login';
  $('#mini').style.display = out ? 'none' : '';
  $('#bn').style.display = out ? 'none' : '';
  $('#bn').innerHTML = NAV.map(n => `<a class="${r==n[0]?'on':''}" href="#/${n[0]}"><span>${n[2]}</span>${n[1]}</a>`).join('');
  document.documentElement.style.setProperty('--ac', ST('ac', '#a855f7'));
  mini();
  const m = $('#msgs');
  if (m) m.scrollTop = 1e9;
  scrollTo(0, 0);
  ui()
}
addEventListener('hashchange', render);
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) {
    location.hash = '#/' + g.dataset.go;
    return
  }
  const t = e.target.closest('[data-a]');
  if (!t) return;
  const a = t.dataset.a,
    d = t.dataset;
  if (a != 'guest' && t.tagName == 'A') e.preventDefault();
  ({
    row() {
      load(+d.i);
      play()
    },
    tog: toggle,
    prev: () => skip(-1),
    next: () => skip(1),
    sh() {
      A.sh = !A.sh;
      ui()
    },
    rp() {
      A.rp = !A.rp;
      ui()
    },
    toast: () => toast(d.m),
    lib: () => toast('Library features coming soon'),
    hub() {
      SV('hub', d.n);
      render()
    },
    mo() {
      SV('mo', d.m);
      render()
    },
    going() {
      const s = ST('going', []),
        k = +d.k;
      SV('going', s.includes(k) ? s.filter(x => x != k) : [...s, k]);
      toast(s.includes(k) ? 'Removed from your events' : 'Added to your events 🎉');
      render()
    },
    ptab() {
      SV('ptab', d.t);
      render()
    },
    pt() {
      SV('pt', d.t);
      render()
    },
    ac() {
      SV('ac', d.c);
      render()
    },
    eq() {
      setEQ(d.n);
      render()
    },
    like() {
      const l = liked();
      SV('liked', l.includes(A.i) ? l.filter(x => x != A.i) : [...l, A.i]);
      ui()
    },
    logout() {
      localStorage.removeItem('user');
      SV('guest', 0);
      location.hash = '#/login';
      render()
    },
    mode() {
      SV('mode', ST('mode', 'up') == 'up' ? 'in' : 'up');
      render()
    },
    guest() {
      SV('guest', 1)
    },
    send: chat,
    note() {
      $('#ci').value = '🎧 Now playing: ' + TR[A.i].t + ' by ' + TR[A.i].a;
      chat()
    }
  } [a] || (() => {}))()
});

function chat() {
  const i = $('#ci');
  if (!i || !i.value.trim()) return;
  const hub = ST('hub', Object.keys(HUBS)[0]),
    c = ST('chat', {});
  (c[hub] = c[hub] || []).push({
    u: user() || 'guest',
    t: i.value.trim(),
    m: 'just now'
  });
  SV('chat', c);
  render();
  setTimeout(() => {
    if (location.hash != '#/community' || ST('hub', 0) != hub) return;
    const c = ST('chat', {});
    c[hub].push({
      u: ['neonpulse', 'kapeko', 'stellarbeat'][Math.floor(Math.random() * 3)],
      t: REPLY[Math.floor(Math.random() * REPLY.length)],
      m: 'just now'
    });
    SV('chat', c);
    render()
  }, 1600)
}
document.addEventListener('keydown', e => {
  if (e.key == 'Enter' && e.target.id == 'ci') chat()
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.seek != null) {
    A.step = Math.floor(t.value / 1000 * LEN);
    if (A.ctx) A.next = A.ctx.currentTime + .05;
    t.style.setProperty('--p', t.value / 10 + '%')
  }
  if (t.dataset.vol != null) {
    A.vol = t.value / 100;
    if (A.ctx) A.m.gain.value = A.vol;
    t.style.setProperty('--p', t.value + '%')
  }
});
document.addEventListener('submit', e => {
  if (e.target.id != 'lf') return;
  e.preventDefault();
  const f = new FormData(e.target);
  SV('user', f.get('u').trim());
  location.hash = '#/home';
  render()
});
setInterval(() => A.on && ui(), 300);
render();