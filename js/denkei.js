// でんけいの開発者はでんけい及びそのソースコードのどんな使い方に対しても文句をつけたり、法的措置を取ったりしません。自由に使って下さい。ただし、でんけいの開発者はいかなる責任も負いません。
var log_dir = './log/';

var next_load = 1;
var next_write = 1;
var log_list = {};

function $denkei_reader(log_json) {
	localforage.setItem(log_json.index, log_json.message);
};

function get_length() {
	var dfd = $.Deferred();

	$.ajaxSetup({
		cache : false
	});

	$.get(log_dir + 'length.txt').done(function(length) {
		localforage.setItem('length', length).then(function() {
			dfd.resolve(parseInt(length));
		}).catch(function(err) {
			dfd.reject(err);
		});
	}).fail(function() {
		localforage.getItem('length').then(function(length) {
			if (length == null) {
				dfd.reject('length is null.');
			} else {
				dfd.resolve(parseInt(length));
			}
		}).catch(function(err) {
			dfd.reject(err);
		});
		;
	});

	$.ajaxSetup({
		cache : true
	});

	return dfd.promise();
}

function denkei_loader_depth3(index) {
	var dfd = $.Deferred();

	localforage.getItem(String(index)).then(function(message) {
		if (message == null) {
			$.getScript(log_dir + index + '.js').then(function() {
				localforage.getItem(String(index)).then(function(message) {
					if (message == null) {
						dfd.reject('message is null.');
					} else {
						log_list[String(index)] = $('<pre></pre>').text(index + ':' + message);
						dfd.resolve();
					}
				}).catch(function(err) {
					dfd.reject(err);
				});
			}).fail(function(err) {
				dfd.reject(err);
			});
		} else {
			log_list[String(index)] = $('<pre></pre>').text(index + ':' + message);
			dfd.resolve();
		}
	}).catch(function(err) {
		dfd.reject(err);
	});

	return dfd.promise();
}

function denkei_loader_depth2(length) {
	var dfd = $.Deferred();
	var load_array = [];

	for (var i = 0; next_load + i <= length; i++) {
		load_array[i] = denkei_loader_depth3(next_load + i);
	}

	$.when.apply($, load_array).done(function() {
		dfd.resolve(length);
	}).fail(function(err) {
		dfd.reject(err);
	});

	return dfd.promise();
}

function denkei_writer(length) {
	for (var i = 0; next_write + i <= length; i++) {
		$('#log_box').prepend(log_list[String(next_write + i)]);
	}
}

function denkei_loader_depth1() {
	get_length().then(denkei_loader_depth2).done(function(length) {
		denkei_writer(length);

		next_load = length + 1;
		next_write = length + 1;

		$('#log_box').ready(function() {
			$('button').prop('disabled', false);
		});
	}).fail(function(err) {
		alert('エラー発生:' + err);
		console.log(err);
		$('button').prop('disabled', false);
	});
}

$(function() {
	$('button').prop('disabled', true);
	denkei_loader_depth1();

	$('#write').click(function() {
		$('button').prop('disabled', true);
		$.ajax('write.php', {
			dataType : 'jsonp',
			data : {
				'message' : $('#message').val()
			}
		}).done(function() {
			setTimeout(function() {
				denkei_loader_depth1();
			}, 1);
		}).fail(function(err) {
			alert('エラー発生:' + err);
			console.log(err);
			$('button').prop('disabled', false);
		});
		$('#message').val('');
	});

	$('#update').click(function() {
		$('button').prop('disabled', true);
		denkei_loader_depth1();
	});

	$('#clear').click(function() {
		$('button').prop('disabled', true);
		$('#log_box').text('');
		localforage.clear().then(function() {
			next_load = 1;
			next_write = 1;
			$('button').prop('disabled', false);
		}).catch(function(err) {
			alert('エラー発生:' + err);
			console.log(err);
			$('button').prop('disabled', false);
		});
	});
});
