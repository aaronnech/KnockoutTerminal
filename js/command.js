/**
*
* A command is a function that takes a view model and arguments as input
* and returns the output that will be output to stdout
*
*/

var EXECUTABLES = EXECUTABLES || {};

EXECUTABLES.ls = function(vm, args, done) {
	var fileList = [];
	var result = "";
	if(args.length > 1) {
		fileList = vm.getFileList(args[1]);
	} else {
		fileList = vm.getFileList();
	}
	if(fileList.length > 0) {
		result += fileList[0].name;
	}
	for(var i = 1; i < fileList.length; i++) {
		result += "\n" + fileList[i].name;
	}
	done(result);
}

EXECUTABLES.cat = function(vm, args, done) {
	var result = "";
	for(var i = 1; i < args.length; i++) {
		if(!vm.fileExists(args[i])) {
			done("File " + args[i] + " does not exists!");
			return;
		}
		result += vm.getFileContents(args[i]);
	}
	done(result);
}

EXECUTABLES.cd = function(vm, args, done) {
	if(args.length <= 1) {
		done("No directory specified");
	} else if(vm.directoryExists(args[1])) {
		vm.changeDirectory(args[1]);
		done("");
	} else {
		done("No directory " + args[1]);
	}
}

EXECUTABLES.clear = function(vm, args, done) {
	vm.clearHistory();
	done("");
}

EXECUTABLES.wget = function(vm, args, done) {
	if(args.length <= 1) {
		done("No address specified");
	} else {
		try {
			vm.getRequest(args[1], function(output) {
				done('<pre>' + output + '</pre>');
			});
		} catch(ex) {
			done("Error connecting");
		}
	}
}

EXECUTABLES.kttext = function(vm, args, done) {
	if(args.length <= 1) {
		done("No file specified");
	} else {
		var contents = vm.getFileContents(args[1]);
		if(contents != null)
			vm.stdIn(contents);
		vm.takeStdIn(function(input) {
			if(vm.writeFile(args[1], input)) {
				done("File " + args[1] + " written. " + input.length + " character(s).");
			} else {
				done("Error writing file " + args[1]);
			}
		});
	}
}

EXECUTABLES.echo = function(vm, args, done) {
	if(args.length <= 1 || args[1].length == 0) {
		vm.takeStdIn(function(input) {
			done(input);
		});
	} else {
		done(args[1].replace(/\"/g, ""));
	}
}


EXECUTABLES.PATH = {
	'cat' : EXECUTABLES.cat,
	'ls' : EXECUTABLES.ls,
	'cd' : EXECUTABLES.cd,
	'clear' : EXECUTABLES.clear,
	'wget' : EXECUTABLES.wget,
	'kttext' : EXECUTABLES.kttext,
	'echo' : EXECUTABLES.echo
};