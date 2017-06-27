<?php
	// でんけいの開発者はでんけい及びそのソースコードのどんな使い方に対しても文句をつけたり、法的措置を取ったりしません。自由に使って下さい。ただし、でんけいの開発者はいかなる責任も負いません。
	$lock = fopen(dirname(__FILE__) . '/log/lock', 'rb+');
	while(!flock($lock, LOCK_EX)) {
		sleep(10);
	}
	
	$index = ((int) file_get_contents(dirname(__FILE__) . '/log/length.txt')) + 1;
	$data['index'] = (String) $index;
	$data['message'] = $_GET['message'];
	$data = json_encode($data);
	file_put_contents(dirname(__FILE__) . '/log/' . $index .'.js', '$denkei_reader(' . $data . ');');
	file_put_contents(dirname(__FILE__) . '/log/length.txt', $index);
	
	fclose($lock);
	
	echo $_GET['callback'] . '({});';
