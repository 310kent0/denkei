// でんけいの開発者はでんけい及びそのソースコードのどんな使い方に対しても文句をつけたり、法的措置を取ったりしません。自由に使って下さい。ただし、でんけいの開発者はいかなる責任も負いません。
function DenkeiControler() {
	this.logDir = './log/';
	this.logLength;
	this.logList = {};
	this.glDfd = null;
	this.loadArray = null;
	this.next = 1;
}

var dc = new DenkeiControler();

function $denkei_reader(logJSON) {
	dc.logList[logJSON.index] = logJSON.message;
}

DenkeiControler.setLength = function(dc) {
	return function(length) {
		dc.logLength = parseInt(length);
		localforage.setItem('length', dc.logLength).then(dc.glDfd.resolve).catch(dc.glDfd.reject);
	};
};

DenkeiControler.setLengthFromLocal = function(dc) {
	return function(length) {
		if (length === null) {
			dc.glDfd.reject('length is null.');
		} else {
			dc.logLength = parseInt(length);
			dc.glDfd.resolve();
		}
	};
};

DenkeiControler.getLengthFromLocal = function(dc) {
	return function() {
		localforage.getItem('length').then(DenkeiControler.setLengthFromLocal(dc)).catch(dc.glDfd.reject);
	};
};

DenkeiControler.prototype.getLength = function() {
	this.glDfd = $.Deferred();

	$.ajaxSetup({
		cache : false
	});

	$.get(this.logDir + 'length.txt').done(DenkeiControler.setLength(this)).fail(DenkeiControler.getLengthFromLocal(this));

	$.ajaxSetup({
		cache : true
	});

	return this.glDfd.promise();
};

DenkeiControler.denkeiGetMessage = function(dc, index, loadDfd) {
	return function() {
		localforage.setItem(index, dc.logList[index]).then(loadDfd.resolve).catch(loadDfd.reject);
	};
};

DenkeiControler.denkeiLoadDepth4 = function(dc, index, loadDfd) {
	return function(message) {
		if (message === null) {
			$.getScript(dc.logDir + index + '.js').done(DenkeiControler.denkeiGetMessage(dc, index, loadDfd)).fail(loadDfd.reject);
		} else {
			dc.logList[index] = message;
			loadDfd.resolve();
		}
	};
};

DenkeiControler.denkeiPrint = function(dc, index, writeDfd) {
	return function() {
		$('#log_box').prepend($('<pre></pre>').text(index + ':' + dc.logList[index]));
		writeDfd.resolve();
	};
};

DenkeiControler.denkeiLoadDepth3 = function(dc, index, prevWriteDfd) {
	var writeDfd = $.Deferred();
	var loadDfd = $.Deferred();

	$.when(prevWriteDfd, loadDfd.promise()).done(DenkeiControler.denkeiPrint(dc, index, writeDfd)).fail(writeDfd.reject);
	
	localforage.getItem(index).then(DenkeiControler.denkeiLoadDepth4(dc, index, loadDfd)).catch(loadDfd.reject);

	return writeDfd.promise();
};

DenkeiControler.makeLoadArrayDepth2 = function(dc, prevWriteDfd, dfd) {
	return function() {
		for (var i = 0; dc.next + i <= dc.logLength; i++) {
			dc.loadArray[i] = DenkeiControler.denkeiLoadDepth3(dc, dc.next + i, prevWriteDfd);
			prevWriteDfd = dc.loadArray[i];
		}
		dfd.resolve(dc.loadArray);
	};
};

DenkeiControler.prototype.makeLoadArrayDepth1 = function() {
	var dfd = $.Deferred();
	var prevWriteDfd;
	this.loadArray = [];
	
	setTimeout(DenkeiControler.makeLoadArrayDepth2(dc, prevWriteDfd, dfd), 0);
	
	return dfd.promise();
};

DenkeiControler.prototype.denkeiLoadDepth2 = function() {
	var dfd = $.Deferred();

	this.makeLoadArrayDepth1().then(function(loadArray) {
		$.when.apply($, loadArray).done(dfd.resolve).fail(dfd.reject);
	});

	return dfd.promise();
};

DenkeiControler.denkeiCountUP = function(dc) {
	return function () {
		dc.next = dc.logLength + 1;
		$('#log_box').ready(function() {
			$('button').prop('disabled', false);
		});
	};
};

DenkeiControler.prototype.denkeiLoadDepth1 = function() {
	this.getLength().then(this.denkeiLoadDepth2.bind(this)).then(DenkeiControler.denkeiCountUP(this)).catch(function(err) {
		alert('エラー発生:' + err);
		console.log(err);
		$('button').prop('disabled', false);
	});
};

function write() {
	$('button').prop('disabled', true);
	$.ajax('write.php', {
		dataType : 'jsonp',
		data : {
			'message' : $('#message').val()
		}
	}).done(function() {
		setTimeout(function() {
			dc.denkeiLoadDepth1();
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
	dc.denkeiLoadDepth1();
}

function clear() {
	$('button').prop('disabled', true);
	$('#log_box').text('');
	localforage.clear().then(function() {
		dc.next = 1;
		$('button').prop('disabled', false);
	}).catch(function(err) {
		alert('エラー発生:' + err);
		console.log(err);
		$('button').prop('disabled', false);
	});
}

$(function() {
	$('button').prop('disabled', true);
	dc.denkeiLoadDepth1();

	$('#write').click(write);

	$('#update').click(update);

	$('#clear').click(clear);
});
