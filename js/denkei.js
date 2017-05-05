// でんけいの開発者はでんけい及びそのソースコードのどんな使い方に対しても文句をつけたり、法的措置を取ったりしません。自由に使って下さい。ただし、でんけいの開発者はいかなる責任も負いません。
var log_dir = './log/';

var next = 1;

function $denkei_reader(log_json) {
	localforage.setItem(log_json.index, log_json.message);
};

function denkei_loader(index, length) {
	if (length === undefined) {
		$.get(log_dir + 'length.txt').done(function(length) {
			denkei_loader(index, parseInt(length));
		});
	} else if (index <= length) {
		localforage.getItem(String(index)).then(function(message) {
			if (message === null) {
				$.getScript(log_dir + index + '.js').done(function() {
					denkei_loader(index, length);
				});
			} else {
				var log_area = $('<pre></pre>').text(index + ':' + message);
				$('#log_box').prepend(log_area);
				log_area.ready(function() {
					denkei_loader(++next, length);
				});
			}
		});
	} else {
		$('button').prop('disabled', false);
	}
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
			setTimeout(function() {
				denkei_loader(next);
			}, 1);
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
