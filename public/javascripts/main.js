$(document).ready(function() {
	var host = location.protocol + '//' + location.host
		, socket = io.connect(host)
		, arena = $('#arena')
		, myName = globals.name
		, myId;

	function createBall(name, id) {
		var ball = $('<div/>')
			, first =	arena.children().first();

		ball.addClass('ball')
			.attr('id', 'a' + id)
			.text(name)
			.prependTo(arena)
			.fadeIn();

		return ball;
	};

	function getBall(id) {
		return $('#a' + id, arena);
	}

  function getPosition(event, ballWidth, ballHeight) {
    var arenaTop = arena.offset().top
    , arenaLeft = arena.offset().left
    , arenaRight = arena.width()
    , arenaBottom = arena.height()
    , top = event.pageY - arenaTop - ballHeight / 2
    , left = event.pageX - arenaLeft - ballWidth / 2;

    top = top < 0 ? 0 : top;
    left = left < 0 ? 0 : left;

    // small padding
    ballWidth += 20;
    ballHeight += 20;

    top = (top + ballHeight) > arenaBottom ? arenaBottom - ballHeight : top;
    left = (left + ballWidth) > arenaRight ? arenaRight - ballWidth : left;

    return {
      top: top,
      left: left
    }
  }

	socket.on('connected', function(data) {
		var ball = createBall(myName, data.id)
			, ballWidth = ball.width()
			, ballHeight = ball.height()
			, delay = 0
			,	interactive = true;

		myId = data.id;

		arena.mousemove(function(event) {
			if (!interactive)
				return true;
			clearTimeout(delay);
			setTimeout(function() {
        var position = getPosition(event, ballWidth, ballHeight)
          , top = position.top
          , left = position.left;

				ball.css({
					top: top,
					left: left
				});

				socket.emit('play', {
					id: myId,
					top: top,
					left: left
				});
			}, 50);

		});

		ball.click(function() {
			ball.toggleClass('pinned');
			interactive = !interactive;
      socket.emit(interactive ? 'unpin' : 'pin', {
        id: myId 
      });
			return false;
		});

		socket.emit('join', {
			id: myId,
			name: myName
		});

		socket.on('joined', function(data) {
			if (data.id != myId)
				createBall(data.name, data.id);
			for (var i in data.players) {
				var player = data.players[i];
				if (player.id != myId && !getBall(player.id).length) {
					var ball = createBall(player.name, player.id);
          ball.css({
						top: player.top,
						left: player.left
					});
          if (player.pinned) {
            ball.addClass('pinned');
          }
        }
			}
		});

		socket.on('left', function(data) {
			getBall(data.id).fadeOut(function() {
				$(this).remove();
			});
		});

		socket.on('played', function(data) {
			getBall(data.id).css({
				top: data.top,
				left: data.left
			});
		});
		
    socket.on('pinned', function(data) {
			getBall(data.id).addClass('pinned');
		});

    socket.on('unpinned', function(data) {
			getBall(data.id).removeClass('pinned');
		});

	});
});
