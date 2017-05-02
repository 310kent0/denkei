// でんけいの開発者はでんけい及びそのソースコードのどんな使い方に対しても文句をつけたり、法的措置を取ったりしません。自由に使って下さい。ただし、でんけいの開発者はいかなる責任も負いません。
var log_dir = './log/';

var next = 1;

function $denkei_reader(log_json) {
	localforage.setItem(log_json.index, log_json.message);
};

function denkei_loader(index) {
	localforage.getItem(String(index)).then(function(message) {
		if (message === null) {
			$.getScript(log_dir + index + '.js').done(function() {
				denkei_loader(index);
			}).fail(function() {
				$('button').prop('disabled', false);
			});
		} else {
			var log_area = $('<pre></pre>').text(index + ':' + message);
			$('#log_box').prepend(log_area);
			log_area.ready(function() {
				denkei_loader(++next);
			});
		}
	});
};

$(function() {
	$('button').prop('disabled', true);
	denkei_loader(next);

	$('#write').click(function() {
		$('button').prop('disabled', true);
		$.ajax('write.php', {
			dataType : 'jsonp',
			data : {
				'message' : $('#message').val()
			}
		}).done(function() {
			denkei_loader(next);
		}).always(function() {
			$('button').prop('disabled', false);
		});
		$('#message').val('');
	});

	$('#update').click(function() {
		$('button').prop('disabled', true);
		denkei_loader(next);
	});

	$('#clear').click(function() {
		$('button').prop('disabled', true);
		$('#log_box').text('');
		localforage.clear().then(function() {
			next = 1;
			$('button').prop('disabled', false);
		});
	});
});
