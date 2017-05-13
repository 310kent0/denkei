// でんけいの開発者はでんけい及びそのソースコードのどんな使い方に対しても文句をつけたり、法的措置を取ったりしません。自由に使って下さい。ただし、でんけいの開発者はいかなる責任も負いません。
var log_dir = './log/';

var next = 1;
var log_list = {};

function $denkei_reader(log_json) {
	log_list[log_json.index] = log_json.message;
};

function set_length_to_local(length, dfd) {
	localforage.setItem('length', length).then(function() {
		dfd.resolve(parseInt(length));
	}).catch(function(err) {
		dfd.reject(err);
	});
}

function get_length_from_local(dfd) {
	localforage.getItem('length').then(function(length) {
		if (length == null) {
			dfd.reject('length is null.');
		} else {
			dfd.resolve(parseInt(length));
		}
	}).catch(function(err) {
		dfd.reject(err);
	});
}

function get_length() {
	var dfd = $.Deferred();

	$.ajaxSetup({
		cache : false
	});

	$.get(log_dir + 'length.txt').done(function(length) {
		set_length_to_local(length, dfd);
	}).fail(function() {
		get_length_from_local(dfd);
	});

	$.ajaxSetup({
		cache : true
	});

	return dfd.promise();
}

function denkei_loader_depth3(index, prev_write_dfd) {
	var load_dfd = $.Deferred();
	var write_dfd = $.Deferred();

	$.when(prev_write_dfd, load_dfd.promise()).done(function() {
		$('#log_box').prepend($('<pre></pre>').text(index + ':' + log_list[index]));
		write_dfd.resolve();
	}).fail(function(err) {
		write_dfd.reject(err);
	});
	
	localforage.getItem(index).then(function(message) {
		if (message == null) {
			$.getScript(log_dir + index + '.js').done(function() {
				localforage.setItem(index, log_list[index]).then(function() {
					load_dfd.resolve();
				}).catch(function(err) {
					load_dfd.reject(err);
				});
			}).fail(function(err) {
				load_dfd.reject(err);
			});
		} else {
			log_list[index] = message;
			load_dfd.resolve();
		}
	}).catch(function(err) {
		load_dfd.reject(err);
	});

	return write_dfd.promise();
}

function make_load_array(length) {
	var dfd = $.Deferred();
	var load_array = [];
	var prev_write_dfd;
	
	setTimeout(function() {
		for (var i = 0; next + i <= length; i++) {
			load_array[i] = denkei_loader_depth3(String(next + i), prev_write_dfd);
			prev_write_dfd = load_array[i];
		}
		dfd.resolve(load_array);		
	}, 0);
	
	return dfd.promise();
}

function denkei_loader_depth2(length) {
	var dfd = $.Deferred();

	make_load_array(length).then(function(load_array) {
		$.when.apply($, load_array).done(function() {
			dfd.resolve(length);
		}).fail(function(err) {
			dfd.reject(err);
		});
	});

	return dfd.promise();
}

function denkei_loader_depth1() {
	get_length().then(function(length) {
		return denkei_loader_depth2(length);
	}).then(function(length) {
		next = length + 1;
		$('#log_box').ready(function() {
			$('button').prop('disabled', false);
		});
	}).catch(function(err) {
		alert('エラー発生:' + err);
		console.log(err);
		$('button').prop('disabled', false);
	});
}
function write() {
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
}

function update() {
	$('button').prop('disabled', true);
	denkei_loader_depth1();
}

function clear() {
	$('button').prop('disabled', true);
	$('#log_box').text('');
	localforage.clear().then(function() {
		next = 1;
		$('button').prop('disabled', false);
	}).catch(function(err) {
		alert('エラー発生:' + err);
		console.log(err);
		$('button').prop('disabled', false);
	});
}

$(function() {
	$('button').prop('disabled', true);
	denkei_loader_depth1();

	$('#write').click(write);

	$('#update').click(update);

	$('#clear').click(clear);
});
