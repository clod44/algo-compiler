$(document).ready(function () {
    let lastSelectedLanguage = localStorage.getItem("selectedLanguage");
    if (lastSelectedLanguage) {
        $("#lang").val(lastSelectedLanguage);

    }
    let language = $("#lang").val() || "en";
    console.log(language, "selected");
    $("#lang").on("change", function () {
        language = $(this).val();
        localStorage.setItem("selectedLanguage", language);
        location.reload();
    });


    const LANGUAGEPACKS = {
        "en": {
            "START": "START",
            "IF": "IF",
            "THEN": "THEN",
            "ELSE": "ELSE",
            "ECHO": "ECHO",
            "LINE": "LINE",
            "GO": "GO",
            "FINISH": "FINISH",
            "COMMENT": "//"
        },
        "tr": {
            "START": "BAŞLAT",
            "IF": "EĞER",
            "THEN": "İSE",
            "ELSE": "DEĞİLSE",
            "ECHO": "YAZ",
            "LINE": "SATIR",
            "GO": "GİT",
            "FINISH": "BİTİR",
            "COMMENT": "//"
        }
    };
    if (language in LANGUAGEPACKS) {
        console.log("language ", language);
    }
    else {
        console.error("language '", language, "' not found. selecting ' en ' instead");
        alert("language '" + language + "' not found. selecting ' en ' instead");
        language = "en";
    }
    const languagePack = LANGUAGEPACKS[language];

    function GetCommandNameInLanguagePack(command) {
        return languagePack[command] || LANGUAGEPACKS["en"][command];
    }

    function createCommands(languagePack) {
        const commands = {};

        commands[GetCommandNameInLanguagePack("START")] = {
            "function": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
                // do nothing
            },
            "description": "Starts the program. must be added at the beginning of the program" //good practice
        };

        commands[GetCommandNameInLanguagePack("ECHO")] = {
            "function": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
                args = resolveArgs(args, variables);
                var result = doMath(args);
                outputWrapper.output += result;
            },
            "description": "Evaluates and outputs the result"
        };

        commands[GetCommandNameInLanguagePack("LINE")] = {
            "function": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
                var result = "";
                if (args.length > 0) {
                    args = resolveArgs(args, variables);
                    result = doMath(args);
                }
                outputWrapper.output += result + "\n";
            },
            "description": "Same as ECHO but adds a new line after that"
        };

        commands[GetCommandNameInLanguagePack("GO")] = {
            "function": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
                hop.now = args[0] - 1; //in the editor, index starts from 1. but lines array starts from 0
                hop.return = -1;
            },
            "description": "Makes the program jump to the specified line"
        };

        commands[GetCommandNameInLanguagePack("IF")] = {
            "function": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
                //this is basically "if-else"
                //syntax "IF ( condition ) THEN (ifTrue) ELSE (ifFalse)"
                //we know that "IF"(first key), wont be in the args
                //our condition is from index 0 to whichever index has the "THEN"
                var conditionEndIndex = args.indexOf(GetCommandNameInLanguagePack("THEN"));
                var condition = args.slice(0, conditionEndIndex);
                var conditionResult = doMath(resolveArgs(condition, variables));

                var elseIndex = args.indexOf(GetCommandNameInLanguagePack("ELSE"));
                var elseExists = (elseIndex != -1);

                var doTrueIndex = args.indexOf(GetCommandNameInLanguagePack("THEN")) + 1;
                var doTrueEndIndex = args.length + 1;
                if (elseExists)
                    doTrueEndIndex = args.indexOf(GetCommandNameInLanguagePack("ELSE"));

                var doTrue = args.slice(doTrueIndex, doTrueEndIndex);

                var doFalseIndex = -1;
                var doFalseEndIndex = args.length + 1;
                if (elseExists)
                    doFalseIndex = elseIndex + 1;
                var doFalse = null;
                if (doFalseIndex != -1)
                    doFalse = args.slice(doFalseIndex, doFalseEndIndex);

                if (conditionResult) {
                    //doTrue
                    lines.push(doTrue.join(" "));
                    hop.now = lines.length - 1;
                    hop.return = lineIndex + 1;
                }
                else if (doFalse != null) {
                    //doFalse
                    lines.push(doFalse.join(" "));
                    hop.now = lines.length - 1;
                    hop.return = lineIndex + 1;
                }
                console.log("if-else analysis");
                console.log("condition: " + condition);
                console.log("conditionResult: " + conditionResult);
                console.log("doTrue: " + doTrue);
                console.log("doFalse: " + doFalse);
                console.log("hop: " + hop);
            },
            "description": "Does X if given Y condition is true. optionaly does Z if given condition is false. Don't add the ELSE and (ifFalseDo) if other condition is not needed. usage: <b>IF (condition) THEN (ifTrueDo) ELSE (ifFalseDo)</b>"
        };

        commands[GetCommandNameInLanguagePack("COMMENT")] = {
            "function": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
                // do nothing
            },
            "description": "Allows you to add comments to the program. Comments does not effect anything but they still take up lines in the program. '<span class='text-success'>// this is a comment</span>'"
        };

        commands[GetCommandNameInLanguagePack("FINISH")] = {
            "function": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
                hop.now = 99999;
                hop.return = 99999;
            },
            "description": "Finished the program. mut be added to the end of the program" //literally. otherwise IF-ELSE wont work and infinite loops might be created
        };

        return commands;
    }

    const COMMANDS = createCommands(languagePack);

    const OPERATIONS = { //primitive math operations are handled with js eval()
        "=": function (varName, varValue, variables, outputWrapper) {
            var finalValue = "noValue";
            try {
                finalValue = parseFloat(varValue);
            }
            catch (e) { }
            if (isNaN(finalValue))
                finalValue = varValue;
            variables[varName] = varValue;
        },
        "+=": function (varName, varValue, variables, outputWrapper) {
            variables[varName] += varValue;
        },
        "-=": function (varName, varValue, variables, outputWrapper) {
            if (typeof (varValue) == "string" || typeof (variables[varName]) == "string")
                outputWrapper.output += "invalid operator. subtraction with string is not allowed";
            else
                variables[varName] -= 1;
        },
        "*=": function (varName, varValue, variables, outputWrapper) {
            if (typeof (varValue) == "string" || typeof (variables[varName]) == "string")
                outputWrapper.output += "invalid operator. multiplication with string is not allowed";
            else
                variables[varName] *= varValue;
        },
        "/=": function (varName, varValue, variables, outputWrapper) {
            if (typeof (varValue) == "string" || typeof (variables[varName]) == "string")
                outputWrapper.output += "invalid operator. divison with string is not allowed";
            else
                variables[varName] /= varValue;
        },
        "++": function (varName, varValue, variables, outputWrapper) {
            variables[varName] += 1;
        },
        "--": function (varName, varValue, variables, outputWrapper) {
            if (typeof (varValue) == "string" || typeof (variables[varName]) == "string")
                outputWrapper.output += "invalid operator. subtraction with string is not allowed";
            else
                variables[varName] -= 1;
        },
    }

    function doMath(args) {
        //args example = ["2", "+", "3", "*", "4"]
        var result = "";
        try {
            result = eval(args.join(""));
        } catch (e) {
            result = args.join(" ");
        }
        return result;
    }
    function resolveArgs(args, variables) {
        args = args.map(function (arg) {
            if (arg in variables)
                return variables[arg];
            else
                return arg;
        });
        return args;
    }


    function Compile(code = "", maxSteps = 1000) {
        var lines = code.split("\n");
        var hop = { now: -1, return: -1 };
        var variables = {};
        var outputWrapper = { output: "" };
        //console.log("=======================");

        if (lines[0].trim() !== Object.keys(COMMANDS)[0])
            outputWrapper.output += "missing " + GetCommandNameInLanguagePack(languagePack.START) + " command\n";
        if (lines[lines.length - 1].trim() !== Object.keys(COMMANDS)[Object.keys(COMMANDS).length - 1])
            outputWrapper.output += "missing " + GetCommandNameInLanguagePack(languagePack.FINISH) + " command. REQUIRED\n"; //otherwise it wont work properly and stuck in loops


        for (let i = 0; i < lines.length; i++) {
            maxSteps--;
            if (maxSteps == 0) {
                outputWrapper.output += "max steps reached. Stopped at line " + (i + 1) + "\n";
                outputWrapper.output += "do you have a hungry loop?" + "\n";
                break;
            };
            const line = lines[i];
            var keys = line.trim().split(" ");

            //console.log("executing line: " + line);

            if (keys[0].length == 0) {
            } else if (keys[0] in COMMANDS) {
                var args = keys.slice(1);
                COMMANDS[keys[0]]["function"](args, variables, outputWrapper, lines, i, hop);
            } else if (keys.length >= 1 && keys[1] in OPERATIONS) { //operation
                var varName = keys[0];
                var varOperation = keys[1];
                var varValue = keys.slice(2);
                varValue = resolveArgs(varValue, variables);
                varValue = doMath(varValue);
                OPERATIONS[varOperation](varName, varValue, variables, hop);
            } else {
                if (hop.return != -1)
                    outputWrapper.output += "syntax err going from " + (hop.return) + " to " + (i + 1) + ": " + line + "\n";
                else
                    outputWrapper.output += "syntax err " + (i + 1) + ": " + line + "\n";
            }

            if (hop.now != -1) {
                i = hop.now - 1;
                hop.now = -1;
                continue;
            }
            if (hop.return != -1) {
                i = hop.return - 1;
                hop.return = -1;
            }
        };
        console.log(lines);
        return {
            "variables": variables,
            "output": outputWrapper.output
        };
    }




    var textArea = $("#code")[0];
    var editor = CodeMirror.fromTextArea(textArea, {
        mode: "customMode",  // Set custom mode here
        theme: "material-darker",
        lineNumbers: true,
        lineWrapping: true,
        extraKeys: {
            "Ctrl-Space": function (cm) {
                cm.showHint({ hint: customAutoComplete });
            }
        },
        hintOptions: {
            hint: customAutoComplete,
            completeSingle: false
        },
        // Add the activeline extension here
        //extensions: [EditorView.lineWrapping, EditorView.lineWrapping]
        styleActiveLine: true
    });
    editor.on("change", function (cm, change) {
        if ($("#auto-compile").is(":checked"))
            $("#compile").trigger("click");
    })
    let defaultCode = "" +
        GetCommandNameInLanguagePack("START") + "\n" +
        "num = (3 - 1) * 2 \n" +
        GetCommandNameInLanguagePack("LINE") + " calculating factorial of num ...\n" +
        "result = 1\n" +
        "result *= num\n" +
        "num --\n" +
        GetCommandNameInLanguagePack("LINE") + " calculating result * num\n" +
        GetCommandNameInLanguagePack("IF") + " num > 1 THEN GO 5\n" +
        GetCommandNameInLanguagePack("IF") + " result > 10 " + GetCommandNameInLanguagePack("THEN") + " size = very big " + GetCommandNameInLanguagePack("ELSE") + " size = small\n" +
        GetCommandNameInLanguagePack("ECHO") + " Result is result and its size\n" +
        GetCommandNameInLanguagePack("ECHO") + " !!!\n" +
        GetCommandNameInLanguagePack("FINISH");
    editor.setValue(defaultCode);

    $("#auto-compile").on("change", function () {
        if ($(this).is(":checked"))
            $("#compile").css("display", "none");
        else
            $("#compile").css("display", "block");
    })
    $("#auto-compile").trigger("change");




    function customAutoComplete(cm) {
        var cursor = cm.getCursor();
        var line = cm.getLine(cursor.line);
        var start = cursor.ch;
        var end = cursor.ch;

        while (start && /\w/.test(line.charAt(start - 1))) --start;
        var word = line.slice(start, end);

        var allHighlights = [];
        Object.values(languagePack).forEach(function (command) {
            allHighlights.push(command);
        });
        var filteredOptions = allHighlights.filter(function (highlight) {
            return highlight.startsWith(word);
        });

        return {
            list: filteredOptions,
            from: CodeMirror.Pos(cursor.line, start),
            to: CodeMirror.Pos(cursor.line, end),
            completeSingle: false
        };
    }

    var commandHighlights = [];
    Object.values(languagePack).forEach(function (command) {
        commandHighlights.push(command);
    });

    function escapeRegExp(pattern) {
        return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    var commandRegexPattern = new RegExp("\\b(?:" + commandHighlights.map(escapeRegExp).join('|') + ")\\b");
    var operatorRegexPattern = new RegExp("\\b(?:" + Object.keys(OPERATIONS).map(escapeRegExp).join('|') + ")\\b");
    console.log(commandHighlights);
    CodeMirror.defineSimpleMode("customMode", {
        start: [
            { regex: commandRegexPattern, token: "keyword" },
            { regex: operatorRegexPattern, token: "operator" },
            { regex: /[\w$]+/, token: "variable" }
        ],
        meta: { lineComment: "//" }
    });
    editor.setOption("mode", "customMode");




    var outputTextArea = $("#output")[0];
    var outputEditor = CodeMirror.fromTextArea(outputTextArea, {
        mode: "text",
        theme: "material-darker",
        lineNumbers: true,
        lineWrapping: true,
        readOnly: true
    });



    $('#compile').click(function () {
        var code = editor.getValue();
        var data = Compile(code);

        outputEditor.setValue(data.output);
        console.log(data.variables);
        console.log(data.output);
    });
    $("#compile").trigger("click");


    //fill the help div with the COMMANDS and their .descriptions
    Object.keys(COMMANDS).forEach(function (key) {
        $("#help").append("<li><b class='text-primary'>" + key + "</b> - " + (COMMANDS[key].description || "no description") + "</li>");
    })
    $("#help").append("<li><b class='text-primary'>Operations: </b> - <span style='font-family:monospace;'>" + (Object.keys(OPERATIONS).join(", ")) + "</span></li>");

});

