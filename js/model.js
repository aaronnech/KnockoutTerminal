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

	var orderFiles = function(dir) {
		dir.content.sort(function(fOne, fTwo) {
		    if(fOne.name < fTwo.name)
		    	return -1;
		    if(fOne.name > fTwo.name)
		    	return 1;
		    return 0;			
		});
	};

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

	var findFile = function(dirContent, name) {
		for(var i = 0; i < dirContent.length; i++) {
			if(dirContent[i].name == name) {
				return dirContent[i];
			}
		}
		return null;
	};

	var removeFile = function(dir, name) {
		for(var i = 0; i < dir.content.length; i++) {
			if(dir.content[i].name == name) {
				var item = dir.content[i];
				dir.content.splice(i, 1);
				orderFiles(dir);
				return item;
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

	self.write = function(str, isFile, content) {
		var pathSplit = cleanArgs(str.split('/'));
		var name = pathSplit[pathSplit.length - 1];
		var file = {
			'name' : name,
			'type' : (isFile ? 'file' : 'directory'),
			'permissions' : {'w' : true, 'r' : true, 'x' : false},
			'content' : content
		};

		var absPath = self.getFile(str);
		if(absPath != null) {
			// check for file existing (delete for overwriting)
			if(absPath.file != null) {
				removeFile(self.getFile(self.goUp(absPath.path)).file, absPath.file.name);
			}

			//get base directory for writing
			absPath = self.getFile(str);
			//write the file
			var directory = self.getFile(absPath.path);
			directory.file.content.push(file);
			orderFiles(directory.file);
			return true;
		} else {
			return false;
		}
	};

	self.changeDirectory = function(str) {
		var result = self.getFile(str);
		if(result != null && result.file != null) {
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
			var result = self.getFile(str);
			return result != null && result.file != null;
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
		//find starting location
		var current = null;
		var path = '/';
		if(str.charAt(0) == '/') {
			current = self.root;
		} else {
			current = self.currentDirectory;
			path = self.pwd;
		}
		//math a path to loop over iteratively
		var split = cleanArgs(str.split('/'));
		for(var i = 0; i < split.length - 1; i++) {
			var file = findFile(current, split[i]);
			// if this path is not bogus
			if(file != null && file.type == 'directory') {
				if(file.name == '..') {
					path = self.goUp(path);
				} else if(file.name != '.') {
					path += file.name + '/';
				}
				current = file.content;
			} else {
				//path is not legitimate, nor is file
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
			return {'file' : null, 'path' : path};
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
	self.stopped = false;

	self.run = function(callback) {
		if(typeof(self.executable) != 'undefined') {
			self.executable(self.viewModel, self.args, callback);
		}
	};

	self.recognized = function() {
		return typeof self.executable != 'undefined';
	};
};