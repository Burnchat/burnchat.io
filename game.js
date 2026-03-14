// Snake Game Server — standalone WebSocket on port 3003
var https = require('https');
var fs = require('fs');
var { Server } = require('socket.io');

var key = fs.readFileSync('/etc/letsencrypt/live/burnchat.io/privkey.pem');
var cert = fs.readFileSync('/etc/letsencrypt/live/burnchat.io/fullchain.pem');
var srv = https.createServer({key:key, cert:cert});
var io = new Server(srv, { cors:{origin:'*'}, transports:['websocket','polling'] });

// Game config
var W=28, H=18, TICK=130;
var COLORS=['#ff6b35','#4caf50','#60a5fa','#f472b6','#a78bfa','#34d399','#fbbf24','#f87171'];
var games = {}; // keyed by room name

function newFood(g) {
  var fx,fy,ok,t=0;
  do { fx=Math.floor(Math.random()*W); fy=Math.floor(Math.random()*H); ok=true;
    var ps=Object.keys(g.players);
    for(var i=0;i<ps.length&&ok;i++){var b=g.players[ps[i]].body;if(b)for(var j=0;j<b.length;j++)if(b[j].x===fx&&b[j].y===fy){ok=false;break;}}
    if(g.food&&g.food.x===fx&&g.food.y===fy)ok=false; t++;
  } while(!ok&&t<100);
  g.food={x:fx,y:fy};
}

function spawn(g,p,idx) {
  var sp=[{x:4,y:Math.floor(H/2),d:'right'},{x:W-5,y:Math.floor(H/2),d:'left'},
    {x:Math.floor(W/2),y:3,d:'down'},{x:Math.floor(W/2),y:H-4,d:'up'},
    {x:4,y:4,d:'right'},{x:W-5,y:H-5,d:'left'}];
  var s=sp[idx%sp.length];
  var bx=s.d==='left'?1:s.d==='right'?-1:0;
  var by=s.d==='up'?1:s.d==='down'?-1:0;
  p.body=[{x:s.x,y:s.y},{x:s.x+bx,y:s.y+by},{x:s.x+bx*2,y:s.y+by*2}];
  p.dir=s.d; p.nd=s.d; p.score=0; p.color=COLORS[idx%COLORS.length];
}

function respawn(p) {
  var x=3+Math.floor(Math.random()*(W-6));
  var y=1+Math.floor(Math.random()*(H-2));
  p.body=[{x:x,y:y},{x:x-1,y:y},{x:x-2,y:y}];
  p.dir='right'; p.nd='right';
}

function getState(g) {
  var sn={};
  var ps=Object.keys(g.players);
  for(var i=0;i<ps.length;i++){var p=g.players[ps[i]];if(p.body)sn[ps[i]]={body:p.body,score:p.score,name:p.name,color:p.color};}
  return {snakes:sn,food:g.food,gold:g.gold||null,w:W,h:H};
}

function scheduleGold(g) {
  if(g.goldTimer) clearTimeout(g.goldTimer);
  var delay = 60000 + Math.random() * 120000; // 1–3 minutes
  g.goldTimer = setTimeout(function() {
    if(!g.active) return;
    var gx,gy,gk=true,gt=0;
    do { gx=Math.floor(Math.random()*W); gy=Math.floor(Math.random()*H); gk=true;
      if(g.food&&g.food.x===gx&&g.food.y===gy) gk=false; gt++;
    } while(!gk&&gt<50);
    if(gk) g.gold={x:gx,y:gy,t:Date.now()};
  }, delay);
}

function startGame(g) {
  if(g.iv)clearInterval(g.iv);
  var ps=Object.keys(g.players);
  for(var i=0;i<ps.length;i++) spawn(g,g.players[ps[i]],i);
  g.food=null; newFood(g); g.active=true; g.gold=null;
  scheduleGold(g);
  var st=getState(g);
  ps.forEach(function(sid){io.to(sid).emit('snake-go',st);});

  g.iv=setInterval(function(){
    if(!g.active)return;
    var ps2=Object.keys(g.players);

    // Move
    for(var i=0;i<ps2.length;i++){
      var sid=ps2[i];
      var p=g.players[sid]; if(!p.body)continue;
      p.dir=p.nd;
      var h={x:p.body[0].x,y:p.body[0].y};
      if(p.dir==='up')h.y--;else if(p.dir==='down')h.y++;
      else if(p.dir==='left')h.x--;else if(p.dir==='right')h.x++;
      if(h.x<0)h.x=W-1;if(h.x>=W)h.x=0;if(h.y<0)h.y=H-1;if(h.y>=H)h.y=0;
      p.body.unshift(h);
      var ate=false;
      if(g.food&&h.x===g.food.x&&h.y===g.food.y){p.score++;newFood(g);ate=true;}
      if(g.gold&&h.x===g.gold.x&&h.y===g.gold.y){p.score+=2;g.gold=null;scheduleGold(g);ate=true;}
      if(!ate) p.body.pop();
    }

    // Collision detection — self only, hitting other snakes does nothing
    for(var i=0;i<ps2.length;i++){
      var sid=ps2[i];
      var p=g.players[sid]; if(!p.body||p.body.length<2)continue;
      var head=p.body[0];
      var hit=false;

      // Check self collision only (skip head = index 0)
      for(var j=1;j<p.body.length;j++){
        if(head.x===p.body[j].x&&head.y===p.body[j].y){hit=true;break;}
      }

      if(hit){
        respawn(p);
        p.score=0;
        io.to(sid).emit('snake-died',{});
      }
    }

    // Gold expires after 8s — schedule next one
    if(g.gold&&Date.now()-g.gold.t>8000){g.gold=null;scheduleGold(g);}
    var st2=getState(g);
    ps2.forEach(function(sid){io.to(sid).emit('snake-tick',st2);});
  }, TICK);
}

io.on('connection', function(sock) {
  var room=null, name=null;

  sock.on('join', function(d) {
    if(!d.room||!d.name)return;
    room=d.room; name=d.name;
    if(!games[room]) games[room]={players:{},active:false,iv:null,food:null,gold:null,goldTimer:null};
    var g=games[room];
    if(g.players[sock.id])return;
    g.players[sock.id]={name:name};
    if(g.active){ var idx=Object.keys(g.players).length-1; spawn(g,g.players[sock.id],idx); var st=getState(g); Object.keys(g.players).forEach(function(s){io.to(s).emit("snake-go",st);}); return; }
    var names=Object.keys(g.players).map(function(s){return g.players[s].name;});
    Object.keys(g.players).forEach(function(s){io.to(s).emit('lobby',{players:names});});
  });

  sock.on('start', function() {
    if(!room||!games[room])return;
    var g=games[room];
    if(g.active||Object.keys(g.players).length<1)return;
    startGame(g);
  });

  sock.on('dir', function(d) {
    if(!room||!games[room]||!games[room].active)return;
    var p=games[room].players[sock.id];
    if(!p||!p.body)return;
    var opp={up:'down',down:'up',left:'right',right:'left'};
    if(d.dir!==opp[p.dir]) p.nd=d.dir;
  });

  sock.on('disconnect', function() {
    if(!room||!games[room])return;
    var g=games[room];
    if(g.players[sock.id]) delete g.players[sock.id];
    if(Object.keys(g.players).length===0){
      if(g.iv)clearInterval(g.iv);
      delete games[room];
    }
  });
});

srv.listen(3003, '0.0.0.0', function(){
  console.log('Snake game server on wss://burnchat.io:3003');
});
