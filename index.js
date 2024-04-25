$(document).ready(function () {
    $("#compile").on("click", function () {
        var code = $("#code").val();
        var data = Compile(code);
        $("#output").html(data.output);
        console.log(data.variables);
        console.log(data.output);
    });

    const COMMANDS = {
        "BAŞLAT": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
            //just goof
        },
        "BİTİR": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
            hop.now = 99999
            hop.return = 99999
        },
        "YAZ": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
            args = resolveArgs(args, variables);
            var result = doMath(args);
            outputWrapper.output += result;
        },
        "SATIR": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
            var result = "";
            if (args.length > 0) {
                args = resolveArgs(args, variables);
                console.log("aaaa:", args);
                result = doMath(args);
            }
            outputWrapper.output += result + "\n";
        },
        "GİT": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
            hop.now = args[0];
            hop.return = -1;
        },
        "EĞER": function (args, variables, outputWrapper, lines, lineIndex, hop = { now: -1, return: -1 }) {
            //this is basically "if-else"
            //syntax "EĞER ( condition paranthesis ) İSE (ifTrue do this paranthesis) DEĞİLSE ( if false do this paranthesis )"
            //we know that "EĞER"(first key), wont be in the args
            //our condition is from index 0 to whichever index has the "İSE"
            var conditionEndIndex = args.indexOf("İSE");
            var condition = args.slice(0, conditionEndIndex);
            var conditionResult = doMath(resolveArgs(condition, variables));

            var elseIndex = args.indexOf("DEĞİLSE");
            var elseExists = (elseIndex != -1);

            var doTrueIndex = args.indexOf("İSE") + 1;
            var doTrueEndIndex = args.length + 1;
            if (elseExists)
                doTrueEndIndex = args.indexOf("İSE");
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
                console.log(hop);
            }
            else if (doFalse != null) {
                //doFalse
                lines.push(doFalse.join(" "));
                hop.now = lines.length - 1;
                hop.return = lineIndex + 1;
            }
        }
    };
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
        "//": function (varName, varValue, variables, outputWrapper) {
            //not an operation but easy way to add comments. they will take up line space tho
        }
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


    function Compile(code, maxSteps = 150) {
        var lines = code.split("\n");
        var hop = { now: -1, return: -1 };
        var variables = {};
        var outputWrapper = { output: "" };

        for (let i = 0; i < lines.length; i++) {
            maxSteps--;
            if (maxSteps == 0) {
                alert("Max steps reached: 50. is there a hungry loop in your code?");
                console.error("Max steps reached: 50. is there a hungry loop in your code?");
            };
            const line = lines[i];
            var keys = line.trim().split(" ");

            // console.log(keys);
            if (keys[0] in COMMANDS) {
                var args = keys.slice(1);
                console.log("executing command: " + keys[0] + " with args: " + args.join(" "));
                COMMANDS[keys[0]](args, variables, outputWrapper, lines, i, hop);
            } else { //operation
                var varName = keys[0];
                var varOperation = keys[1];
                var varValue = keys.slice(2);
                varValue = resolveArgs(varValue, variables);
                varValue = doMath(varValue);
                OPERATIONS[varOperation](varName, varValue, variables, hop);
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

});
