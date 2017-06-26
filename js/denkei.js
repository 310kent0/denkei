// でんけいの開発者はでんけい及びそのソースコードのどんな使い方に対しても文句をつけたり、法的措置を取ったりしません。自由に使って下さい。ただし、でんけいの開発者はいかなる責任も負いません。
function DenkeiControler() {
	this.logDir = './log/';
	this.logLength;
	this.logList = {};
	this.glDfd = null;
	this.loadArray = null;
	this.next = 1;
}

var denkeiControler = new DenkeiControler();

function $denkei_reader(log_json) {
	denkeiControler.logList[log_json.index] = log_json.message;
}

DenkeiControler.prototype.setLengthToLocal = function() {
	localforage.setItem('length', this.logLength).then(function() {
		this.glDfd.resolve();
	}.bind(this)).catch(function(err) {
		this.glDfd.reject(err);
	}.bind(this));
}

DenkeiControler.prototype.getLengthFromLocal = function() {
	localforage.getItem('length').then(function(length) {
		if (length === null) {
			this.glDfd.reject('length is null.');
		} else {
			this.logLength = parseInt(length);
			this.glDfd.resolve();
		}
	}.bind(this)).catch(function(err) {
		this.glDfd.reject(err);
	}.bind(this));
}

DenkeiControler.prototype.getLength = function() {
	this.glDfd = $.Deferred();

	$.ajaxSetup({
		cache : false
	});

	$.get(this.logDir + 'length.txt').done(function(length) {
		this.logLength = parseInt(length);
		this.setLengthToLocal();
	}.bind(this)).fail(function() {
		this.getLengthFromLocal();
	}.bind(this));

	$.ajaxSetup({
		cache : true
	});

	return this.glDfd.promise();
}

DenkeiControler.prototype.denkeiLoaderDepth3 = function(index, prev_write_dfd) {
	var write_dfd = $.Deferred();
	var load_dfd = $.Deferred();

	$.when(prev_write_dfd, load_dfd.promise()).done(function() {
		$('#log_box').prepend($('<pre></pre>').text(index + ':' + this.logList[index]));
		write_dfd.resolve();
	}.bind(this)).fail(function(err) {
		write_dfd.reject(err);
	}.bind(this));
	
	localforage.getItem(index).then(function(message) {
		if (message === null) {
			$.getScript(this.logDir + index + '.js').done(function() {
				localforage.setItem(index, this.logList[index]).then(function() {
					load_dfd.resolve();
				}.bind(this)).catch(function(err) {
					load_dfd.reject(err);
				}.bind(this));
			}.bind(this)).fail(function(err) {
				load_dfd.reject(err);
			}.bind(this));
		} else {
			this.logList[index] = message;
			load_dfd.resolve();
		}
	}.bind(this)).catch(function(err) {
		load_dfd.reject(err);
	}.bind(this));

	return write_dfd.promise();
}

DenkeiControler.prototype.makeLoadArray = function() {
	var dfd = $.Deferred();
	var prev_write_dfd;
	this.loadArray = [];
	
	setTimeout(function() {
		for (var i = 0; this.next + i <= this.logLength; i++) {
			this.loadArray[i] = this.denkeiLoaderDepth3(String(this.next + i), prev_write_dfd);
			prev_write_dfd = this.loadArray[i];
		}
		dfd.resolve();
	}.bind(this), 0);
	
	return dfd.promise();
}

DenkeiControler.prototype.denkeiLoaderDepth2 = function() {
	var dfd = $.Deferred();

	this.makeLoadArray().then(function() {
		$.when.apply($, this.loadArray).done(function() {
			dfd.resolve();
		}.bind(this)).fail(function(err) {
			dfd.reject(err);
		}.bind(this));
	}.bind(this));

	return dfd.promise();
}

DenkeiControler.prototype.denkeiLoaderDepth1 = function() {
	this.getLength().then(function() {
		return this.denkeiLoaderDepth2();
	}.bind(this)).then(function() {
		this.next = this.logLength + 1;
		$('#log_box').ready(function() {
			$('button').prop('disabled', false);
		}.bind(this));
	}.bind(this)).catch(function(err) {
		alert('エラー発生:' + err);
		console.log(err);
		$('button').prop('disabled', false);
	}.bind(this));
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
			denkeiControler.denkeiLoaderDepth1();
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
	denkeiControler.denkeiLoaderDepth1();
}

function clear() {
	$('button').prop('disabled', true);
	$('#log_box').text('');
	localforage.clear().then(function() {
		denkeiControler.next = 1;
		$('button').prop('disabled', false);
	}).catch(function(err) {
		alert('エラー発生:' + err);
		console.log(err);
		$('button').prop('disabled', false);
	});
}

$(function() {
	$('button').prop('disabled', true);
	denkeiControler.denkeiLoaderDepth1();

	$('#write').click(write);

	$('#update').click(update);

	$('#clear').click(clear);
});
