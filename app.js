
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express()
  , playMode = process.env.PLAY_MODE || 'instant';

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('playMode', playMode);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);


// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

var server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , players = [];

// production settings for socket.io
//io.enable('browser client minification');  // send minified client
//io.enable('browser client etag');          // apply etag caching logic based on version number
//io.enable('browser client gzip');          // gzip the file
//io.set('log level', 1);                    // reduce logging
//io.set('transports', [                     // enable all transports
//    'websocket'
//  , 'flashsocket'
//  , 'htmlfile'
//  , 'xhr-polling'
//  , 'jsonp-polling'
//]);

io.on('connection', function (socket) {
  socket.emit('connected', {
		id: socket.id
	});

	socket.on('join', function(data) {
		io.sockets.emit('joined', {
			name: data.name,
			id: data.id,
			players: players
		});
		players.push({
			name: data.name,
			id: data.id,
			left: 0,
			top: 0,
      pinned: false
		});
	});

	socket.on('play', function(data) {
		var last,
			emit;
		if (playMode == 'delayed') {
			emit = { 
				id: data.id,
				offsets: data.offsets
			};
			last = data.offsets[data.offsets.length - 1];
			data = last;
		} else {
			emit = { 
				id: data.id,
				left: data.left,
				top: data.top 
			};
		}
		io.sockets.emit('played', emit);
		for (var i in players) {
			if (players[i].id == socket.id) {
				players[i].left = data.left;
				players[i].top = data.top;
			}
		}
	});

  socket.on('pin', function(data) {
    io.sockets.emit('pinned', {
      id: data.id
    });
		for (var i in players) {
			if (players[i].id == data.id) {
				players[i].pinned = true;
			}
		}
  });

  socket.on('unpin', function(data) {
    io.sockets.emit('unpinned', {
      id: data.id
    });
		for (var i in players) {
			if (players[i].id == data.id) {
				players[i].pinned = false;
			}
		}
  });

  socket.on('disconnect', function() {
		io.sockets.emit('left', {
			id: socket.id
		});
		for (var i in players) {
			if (players[i].id == socket.id) {
				players.remove(i);
			}
		}
  });
});


// start http server
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
  console.log("Play mode set to " + playMode);
});
