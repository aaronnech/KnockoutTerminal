/**
* 
* @author: Aaron Nech
*
* These are the models that run the terminal application.
*/

var MODELS = MODELS || {};

/**
* File System model represents a psuedo JSON file system.
*
* constructor:
* @param root the root array of the file system json object.
*/
MODELS.FileSystem = function(root) {
	var self = this;
	self.root = root;
	self.currentDirectory = root;
	self.pwd = '/';

	/**
	* cleans an array of empty strings
	* 
	* @param args
	*/
	var cleanArgs = function(args) {
	    var result = [];
	    for(var i = 0; i < args.length; i++) {
	        if (args[i].length > 0) {
	            result.push(args[i]);
	        }
	    }
	    return result;
	};

	var findFile = function(dir, name) {
		for(var i = 0; i < dir.length; i++) {
			if(dir[i].name == name) {
				return dir[i];
			}
		}
		return null;
	};

	var addDirectionals = function(dir) {
		for(var i = 0; i < dir.length; i++) {
			if(dir[i].type == 'directory' && dir[i].name != '..') {
				dir[i].content.push({
					'type' : 'directory',
					'name' : '..',
					'content' : dir,
					'permissions' : {'w' : true, 'r' : true, 'x' : false}
				});
				addDirectionals(dir[i].content);
			}
		}
		dir.push({
			'type' : 'directory',
			'name' : '.',
			'content' : dir,
			'permissions' : {'w' : true, 'r' : true, 'x' : false}
		});
	};

	addDirectionals(root);

	self.changeDirectory = function(str) {
		var result = self.getFile(str);
		if(result != null) {
			if(result.file.type == 'directory') {
				self.currentDirectory = result.file.content;
				self.pwd = result.path;
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	};

	self.fileExists = function(str) {
		if(str.length > 0) {
			return self.getFile(str) != null;
		} else {
			return false;
		}		
	};

	self.goUp = function(givenPath) {
		var split = null;
		if(typeof givenPath == 'undefined') {
			split = cleanArgs(self.pwd.split('/'));
		} else {
			split = cleanArgs(givenPath.split('/'));
		}
		var path = '/';
		for(var i = 0; i < split.length - 1; i++) {
			path += split[i] + '/';
		}
		return path;
	}

	self.getFile = function(str) {
		var current = null;
		var path = '/';
		if(str.charAt(0) == '/') {
			current = self.root;
		} else {
			current = self.currentDirectory;
			path = self.pwd;
		}
		var split = cleanArgs(str.split('/'));
		for(var i = 0; i < split.length - 1; i++) {
			var file = findFile(current, split[i]);
			if(file != null && file.type == 'directory') {
				if(file.name == '..') {
					path = self.goUp(path);
				} else if(file.name != '.') {
					path += file.name + '/';
				}
				current = file.content;
			} else {
				return null;
			}
		}
		var file = findFile(current, split[split.length - 1]);
		if(file != null) {
			if(file.name == '..') {
				path = self.goUp(path);
			} else if(file.name != '.') {
				path += file.name + '/';
			}
		} else {
			return null
		}
		return {'file' : file, 'path' : path};
	};
};

/**
* Command Model. Represents an executable command in the terminal
* 
* constructor:
* @param viewModel the view model that is initializing this model
* @param text the text that is the terminal command to be parsed.
*/
MODELS.Command = function(viewModel, text) {
	var self = this;

	var cleanArgs = function(args) {
	    var result = [];
	    for(var i = 0; i < args.length; i++) {
	        if (args[i].length > 0) {
	            result.push(args[i]);
	        }
	    }
	    return result;
	};

	var parseArgs = function(str) {
		return cleanArgs(str.split(new RegExp("\\s+")));
	};

	self.text = text;
	self.args = parseArgs(text);
	self.viewModel = viewModel;
	self.executable = EXECUTABLES.PATH[self.args[0]];
	self.commandName = self.args[0];

	self.run = function(callback) {
		if(typeof(self.executable) != 'undefined') {
			self.executable(self.viewModel, self.args, callback);
		}
	};

	self.recognized = function() {
		return typeof self.executable != 'undefined';
	};
};