/**
* 
* @author: Aaron Nech
*
* The console application view model (MVVM "controller")
*/

var EXECUTABLES = EXECUTABLES || {};
var MODELS = MODELS || {};


/**
* The View Model that represents the console
* 
* @param files the file system json object
*/
var ConsoleModel = function(files) {

	//private variables
	var self = this;
	var blinkShow = true;
	var autoQueue = [];

	//public variables (hookable by view)
	self.typed = new ko.observable("");
	self.history = ko.observableArray();
	self.commandHistory = ko.observableArray();
	self.fileSystem = new MODELS.FileSystem(files);
	self.pwd = new ko.observable("/");
	self.historyIndex = 0;


	//private functions

	/**
	* blinks the cursor on the screen repeatively. Must be called once. 
	* 
	*/
	var blinkCursor = function() {
		blinkShow = !blinkShow;
		if(blinkShow) {
			document.getElementById('blink').style.display = 'inline-block';
		} else {
			document.getElementById('blink').style.display = 'none';
		}
		setTimeout(blinkCursor, 500);
	};

	/**
	* initialization routine called by the view model construction.
	* 
	*/
	var init = function() {
		blinkCursor();
	};

	/**
	* Get an ajax object (XBrowser support)
	*
	* @return the XHTTP object for ajax requests
	*/
	var getXMLHttpRequest = function() {
	    if (window.XMLHttpRequest) {
	        return new window.XMLHttpRequest;
	    } else {
	        try {
	            return new ActiveXObject("MSXML2.XMLHTTP.3.0");
	        } catch(ex) {
	            return null;
	        }
	    }
	}

	/**
	* gets the prompt text (what the user has typed)
	* 
	*/
	var getPromptText = function() {
		return '[<span class="blue">guest</span>@<span class="orange">aaronnech.com</span> <span class="yellow">' +
				 self.pwd() + '</span>]$ ' + self.typed();
	};

	/**
	* strips a given html string of all html via browser rendering
	*
	* @param html the html string to be stripped
	*/
	var strip = function(html) {
	   var tmp = document.createElement("div");
	   tmp.innerHTML = html;
	   return tmp.textContent || tmp.innerText || "";
	}


	/**
	* writes out a sentence to the prompt
	* 
	*/
	var writeOut = function(sentence, delay, callback) {
		if(sentence.length > 0) {
			self.typed(self.typed() + sentence.substring(0, 1));
			sentence = sentence.substring(1);

			if(sentence.length > 0) {
				setTimeout(function() {
								writeOut(sentence, delay, callback);
							}, delay);
			} else {
				callback();
			}
		}
	};

	//key event overrides

	/**
	* Override browser keydown event handler
	*
	* @param e the key down event
	*/
	window.onkeydown = function(e) {
		var code = e.keyCode || e.which;
		if(self.canType) {
			if(code == 8) {
				self.deleteChar();
			} else if(code == 13) {
				self.enterCommand();
			} else if(code == 38) {
				self.prevHistory();
			} else if(code == 40) {
				self.nextHistory();
			} else if(code == 9) {
				self.tabComplete();
			}
			if (code == 8 || code == 9 || code == 13 ||
				 code == 46 || code == 38 || code == 40 || e.ctrlKey)
	        	e.preventDefault();
	    }
	};

	/**
	* Override browser keypress event handler
	*
	* @param e the key press event
	*/
	window.onkeypress = function(e) {
		var code = e.keyCode || e.which;
		if(self.canType) {
			self.typeLetter(code);
		}
	};



	//public functions (hookable by view)

	/**
	* Types a given letter into the current prompt
	*
	* @param code the key code of the letter to type
	*/
	self.typeLetter = function(code) {
		self.typed(self.typed() + String.fromCharCode(code));
	};

	/**
	* Deletes a single character from the end of the current prompt
	*/
	self.deleteChar = function() {
		self.typed(self.typed().substring(0, self.typed().length - 1));
	};

	/**
	* makes a GET request to url and executes callback with the response
	*/
	self.getRequest = function(url, callback) {
		req = getXMLHttpRequest();
	    req.open("GET", url, true);
	    req.onload = function() {
	    	callback(req.responseText);
	    };
	    req.onerror = function() {
	    	callback("Error on GET request to url " + url);
	    }
	    req.send();
	}

	/**
	* Adds a string to the console history
	*
	* @param str the string to add
	*/
	self.addToHistory = function(str) {
		self.history.push(str);
	};

	/**
	* clears the history of the console
	*/
	self.clearHistory = function() {
		self.history.removeAll();
	};

	/**
	* sets the current prompt to the last command in the history
	*/
	self.prevHistory = function() {
		if(self.historyIndex - 1 >= 0 && self.historyIndex - 1 < self.commandHistory().length) {
			self.historyIndex -= 1;
			self.typed(self.commandHistory()[self.historyIndex]);
		} else if(self.historyIndex >= 0 && self.historyIndex < self.commandHistory().length) {
			self.typed(self.commandHistory()[self.historyIndex]);
		}
	};

	/**
	* sets the current prompt to the next command in the history
	*/
	self.nextHistory = function() {
		if(self.historyIndex + 1 >= 0 && self.historyIndex + 1 < self.commandHistory().length) {
			self.historyIndex += 1;
			self.typed(self.commandHistory()[self.historyIndex]);		
		} else if(self.historyIndex >= 0 && self.historyIndex < self.commandHistory().length) {
			self.typed(self.commandHistory()[self.historyIndex]);
		}
	};

	/**
	* tab completes the current cursor location if it is a location
	*/
	self.tabComplete = function() {
		//todo
	};

	/**
	* enters the current prompt command
	*/
	self.enterCommand = function() {
		self.canType = false;
		var prompt = getPromptText();
		if(self.typed().length > 0) {
			var cmd = new MODELS.Command(self, self.typed());
			if(cmd.recognized()) {
				cmd.run(function(output) {
					self.canType = true;
					self.addToHistory(prompt);
					self.addToHistory(output);
					self.commandHistory.push(self.typed());
					self.historyIndex = self.commandHistory().length;
					self.typed('');
			 	});
			} else {
				self.canType = true;
				self.addToHistory(prompt);
				self.addToHistory('Err: unrecognized command "' + cmd.commandName + '"');
				self.commandHistory.push(self.typed());
				self.historyIndex = self.commandHistory().length;
				self.typed('');
			}
		}
	};

	/**
	* gets the list of files at a given path
	*
	* @param path the past to list from
	*/
	self.getFileList = function(path) {
		if(typeof path == 'undefined') { //cwd
			return self.fileSystem.currentDirectory;
		} else { //specific path
			return self.fileSystem.getFile(path).file.content;
		}
	};

	/**
	* gets the content of a given file path
	*
	* @param path the past to get content from
	*/
	self.getFileContents = function(path) {
		return self.fileSystem.getFile(path).file.content;
	};

	/**
	* changes directory to a given path
	*
	* @param path the path to change to
	*/
	self.changeDirectory = function(path) {
		if(self.fileSystem.changeDirectory(path)) {
			self.pwd(self.fileSystem.pwd);
		}
	};

	/**
	* returns true if name exists and is a file, false otherwise
	*
	* @param name the file to check
	*/
	self.fileExists = function(name) {
		return self.fileSystem.fileExists(name) && self.fileSystem.getFile(name).file.type == 'file';
	};

	/**
	* returns true if name exists and is a directory, false otherwise
	*
	* @param name the file to check
	*/
	self.directoryExists = function(name) {
		return self.fileSystem.fileExists(name) && self.fileSystem.getFile(name).file.type == 'directory';
	};

	self.autoExecute = function(sentence) {
		autoQueue.push(function(callback) {
			writeOut(sentence, 75, callback);
		});
		return self;
	};

	self.runAuto = function() {
		if(autoQueue.length > 0) {
			self.canType = false;
			autoQueue.shift()(function() {
					self.enterCommand();
					self.runAuto();
				});
		} else {
			self.canType = true;
		}
	};

	//initialize view model
	init();
};

//start application on window load by applying knockout bindings
window.onload = function() {
	//load the console model with a simple json file directory
	var con = new ConsoleModel([
		{
			'name' : 'readme.txt',
			'type' : 'file',
			'permissions' : {'w' : true, 'r' : true, 'x' : false},
			'content' : '<p>Hello, my name is <span class="blue">Aaron Nech</span>. </p> \
						 <p>I\'m a aspiring Software Engineer in <span class="blue">Washington State</span>, and a student at the <span class="blue">University of Washington</span> department \
						 of <span class="blue">Computer Science and Engineering</span>.<p> \
						 <p>This is a project of mine called <span class="blue">KnockoutTerminal</span> which is available on my <a href="http://www.github.com/aaronnech">github</a>. \
						 It uses a pseudo file system stored as a local JSON object, and allows for some \
						 basic commands.</p> \
						 <p>Here is a link to my <a href="http://www.aaronnech.com/blog">blog</a>. Where I write about various technology subjects and my projects.</p>'
		},
		{
			'name' : 'instructions.txt',
			'type' : 'file',
			'permissions' : {'w' : true, 'r' : true, 'x' : false},
			'content' : '<p>KnockoutTerminal has the goal of being a fully expandable browser terminal with the ability to execute arbitrary commands stored in pseudo files. \
						Currently, the following <span class="blue">commands</span> are supported on this page:</p> \
						<p><span class="blue">cat</span> &lt;file&gt;</p> \
						<p><span class="blue">ls</span> [&lt;file&gt;]</p> \
						<p><span class="blue">clear</span></p> \
						<p><span class="blue">cd</span> &lt;directory&gt;</p> \
						<p><span class="blue">wget</span> &lt;url&gt;</p> \
						For more information check out the <a href="">KnockoutTerminal github repository</a>.'
		},
		{
			'name' : 'Projects',
			'type' : 'directory',
			'permissions' : {'w' : true, 'r' : true, 'x' : false},
			'content' : [
				{
					'name' : 'readme.txt',
					'type' : 'file',
					'permissions' : {'w' : true, 'r' : true, 'x' : false},
					'content' : '<p>I have numerous side projects, I\'m currently building a projects page that is under construction.</p> \
								<p>For my open source projects, please take a look at my <a href="http://www.github.com/aaronnech">github account</a>.</p>'
				}
			]
		}
	]);
	ko.applyBindings(con);
	//auto execute the following commands
	con.autoExecute("cat readme.txt").autoExecute("cat instructions.txt").autoExecute("cd Projects").autoExecute("cat readme.txt").runAuto();
};