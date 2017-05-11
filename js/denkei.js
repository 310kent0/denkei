// でんけいの開発者はでんけい及びそのソースコードのどんな使い方に対しても文句をつけたり、法的措置を取ったりしません。自由に使って下さい。ただし、でんけいの開発者はいかなる責任も負いません。
var log_dir = './log/';

var next = 1;
var log_list = {};
var get_log_dfd =[];

function $denkei_reader(log_json) {
	localforage.setItem(log_json.index, log_json.message).then(function () {
		get_log_from_local(log_json.index);
	}).catch(function(err) {
		alert('エラー発生:' + err);
		console.log(err);
	});
};

function get_log_from_local(index) {
	localforage.getItem(index).then(function(message) {
		if (message == null) {
			get_log_dfd[index].reject('message is null.');
		} else {
			log_list[index] = $('<pre></pre>').text(index + ':' + message);
			get_log_dfd[index].resolve();
		}
	}).catch(function(err) {
		get_log_dfd[index].reject(err);
	});
}

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

function denkei_loader_depth3(index) {
	var dfd = $.Deferred();
	get_log_dfd[index] = dfd;

	localforage.getItem(String(index)).then(function(message) {
		if (message == null) {
			$.getScript(log_dir + index + '.js').fail(function(err) {
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

function make_load_array(length) {
	var dfd = $.Deferred();
	var load_array = [];
	
	setTimeout(function() {
		for (var i = 0; next + i <= length; i++) {
			load_array[i] = denkei_loader_depth3(next + i);
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

function denkei_writer(length) {
	for (var i = 0; next + i <= length; i++) {
		$('#log_box').prepend(log_list[String(next + i)]);
	}
}

function denkei_loader_depth1() {
	get_length().then(function(length) {
		return denkei_loader_depth2(length);
	}).then(function(length) {
		denkei_writer(length);

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
