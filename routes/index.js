
/*
 * GET home page.
 */

exports.index = function(req, res){
	var nickname = req.query.nickname,
		playMode = req.app.get('playMode');
  res.render('index', { 
		title: 'Bubbles',
		ball: '/images/ball.png',
		nickname: nickname,
		playMode: playMode
	});
};
