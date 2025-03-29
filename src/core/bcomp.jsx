import my_doppio from "../doppio/main.jsx";


function toHex(n) {
    if (n < 0 || n > 0xFFFF) {
        throw new Error("Input must be between 0 and 65535.");
    }

    return n.toString(16).padStart(4, '0').toUpperCase();
}

function numberToExcelColumn(num) {
    let columnName = '';
    num++;
    while (num > 0) {
        num--;
        const letter = String.fromCharCode((num % 26) + 65);
        columnName = letter + columnName;
        num = Math.floor(num / 26);
    }
    return columnName;
}
function excelColumnToNumber(column) {
    let num = 0;
    const length = column.length;

    for (let i = 0; i < length; i++) {
        // Получаем код символа и вычитаем код 'A' (65)
        const charCode = column.charCodeAt(i) - 65;
        // Умножаем на 26 в зависимости от позиции
        num = num * 26 + (charCode + 1); // +1, чтобы учесть 1-индексацию
    }

    return num;
}

function getRandomKeyWeightedByValue(arr,obj, rnd) {
    const keys = arr;
    const weights = arr.map(x => obj[x].length < 10 ? 11 - obj[x].length : 10 / obj[x].length);

    const cumulativeWeights = [];
    let totalWeight = 0;

    for (let i = 0; i < weights.length; i++) {
        totalWeight += weights[i];
        cumulativeWeights.push(totalWeight);
    }

    const randomNum = rnd() * totalWeight;

    let low = 0;
    let high = cumulativeWeights.length - 1;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (randomNum < cumulativeWeights[mid]) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    return keys[low];
}

var bcomp = {
    my_doppio,
    init: ()=>{
        my_doppio.init();
    },
    cli: (str, callback) => {
        bcomp.my_doppio.run(str, callback);
    },
    tracing_program: (obj, callback) => {
        const { program, microprogram, mode, start_adress, steps} = obj;
        bcomp.my_doppio.run(
            program.map((x, i) => 
                x ? toHex(i) + ' a ' + toHex(x) + ' w' : '').filter(x => x).join(' ') +
                (start_adress ? ' ' + toHex(start_adress) + ' a' : ' 000 a') + 
                ' c'.repeat(steps),

                (x) => {
                    function parser_1(s) {
                        // Адр Знчн  IP  CR   AR  DR   SP  BR   AC  NZVC Адр Знчн
                        const t = s.match(/^([\dA-F]{3}) ([\dA-F]{4}) ([\dA-F]{3}) ([\dA-F]{4}) ([\dA-F]{3}) ([\dA-F]{4}) ([\dA-F]{3}) ([\dA-F]{4}) ([\dA-F]{4}) ([\dA-F]{4})( ([\dA-F]{3}) ([\dA-F]{4}))?$/);
                        console.log(s, t);
                        if (t) {
                            return {
                                adress: t[1],
                                value: t[2],
                                IP: t[3],
                                CR: t[4],
                                AR: t[5],
                                DR: t[6],
                                SP: t[7],
                                BR: t[8],
                                AC: t[9],
                                NZVC: t[10],
                                adress2: t[12],
                                value2: t[13],
                            };
                        } else {
                            return null;
                        }

                    }
                    const arr = x.split('\n').map(x => parser_1(x)).filter(x => x).slice(-steps);

                    callback(arr);
                }
        );
    },
    gen_prog: (taskVariant, difficulty) => {
        function cyrb128(str) {
            let h1 = 1779033703, h2 = 3144134277,
                h3 = 1013904242, h4 = 2773480762;
            for (let i = 0, k; i < str.length; i++) {
                k = str.charCodeAt(i);
                h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
                h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
                h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
                h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
            }
            h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
            h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
            h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
            h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
            return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
        }

        function sfc32(a, b, c, d) {
            return function () {
                a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
                var t = (a + b) | 0;
                a = b ^ b >>> 9;
                b = c + (c << 3) | 0;
                c = (c << 21 | c >>> 11);
                d = d + 1 | 0;
                t = t + d | 0;
                c = c + t | 0;
                return (t >>> 0) / 4294967296;
            };
        }
        var seed = cyrb128(taskVariant + difficulty);
        var rand = sfc32(seed[0], seed[1], seed[2], seed[3]);

        const commands = {
            "START": ["INC", "DEC", "NEG", "NOT", "LD", "ADD", "SUB", "HLT"],
            "INC": ["INC", "NEG", "NOT", "CLC", "ASL", "ASR", "ADD", "SUB", "HLT"],
            "DEC": ["DEC", "NEG", "NOT", "CLC", "ASL", "ASR", "ADD", "SUB", "HLT"],
            "NEG": ["CLC", "ASL", "ASR", "ADD", "SUB", "HLT"],
            "NOT": ["CLC", "ASL", "ASR", "ADD", "SUB", "ST", "HLT"],
            "LD": ["INC", "DEC", "NEG", "NOT", "CLC", "ASL", "ASR", "ADD", "SUB", "HLT"],
            "CLC": ["ROL", "ROR"],
            "ROL": ["INC", "DEC", "NEG", "NOT", "ASL", "ADD", "SUB", "HLT"],
            "ROR": ["INC", "DEC", "NEG", "NOT", "ASR", "ADD", "SUB", "HLT"],
            "ASL": ["INC", "DEC", "NEG", "NOT", "ASL", "ADD", "SUB", "HLT"],
            "ASR": ["INC", "DEC", "NEG", "NOT", "ASR", "ADD", "SUB", "HLT"],
            "ADD": ["INC", "DEC", "NEG", "NOT", "CLC", "ASL", "ASR", "ADD", "ST", "HLT"],
            "SUB": ["INC", "DEC", "NEG", "NOT", "CLC", "ASL", "ASR", "SUB", "ST", "HLT"],
            //"ST": ["INC", "DEC", "NEG", "LD", "CLC", "ASL", "ASR", "ADD", "SUB"],
            "ST": ["LD"],
        };
        function tripleAddSub(commands) {
            for (const key in commands) {
                if (!["ADD", "SUB"].includes(key)) return;
                const subArray = commands[key];
                const addCount = subArray.filter(command => command === "ADD").length;
                const subCount = subArray.filter(command => command === "SUB").length;
                for (let i = 0; i < addCount * 2; i++) {
                    subArray.push("ADD");
                }
                for (let i = 0; i < subCount * 2; i++) {
                    subArray.push("SUB");
                }
            }
        }

        tripleAddSub(commands);

        const numVariables = parseInt(difficulty) || 1;
        const variables = Array.from({ length: numVariables }, (_, i) => numberToExcelColumn( i));
        const lastVariable = numberToExcelColumn( numVariables);
        let varibles = {};
        let variableDeclarations2 = {};
        const start_adress = Math.floor(rand() * 0xFF);
        varibles['ACCUM'] = '0';
        const doCommands = {
            "INC": () => { varibles['ACCUM'] = '(' + varibles['ACCUM'] + ') + 1'; },
            "DEC": () => { varibles['ACCUM'] = '(' + varibles['ACCUM'] + ') - 1'; },
            "NEG": () => { varibles['ACCUM'] = '-(' + varibles['ACCUM'] + ')'; },
            "NOT": () => { varibles['ACCUM'] = '-(' + varibles['ACCUM'] + ') - 1'; },
            "LD": (ARG) => { varibles['ACCUM'] = varibles[ARG]; },
            "CLC": () => { },
            "ROL": () => { varibles['ACCUM'] = '(' + varibles['ACCUM'] + ') * 2'; },
            "ROR": () => { varibles['ACCUM'] = '(' + varibles['ACCUM'] + ') / 2'; },
            "ASL": () => { varibles['ACCUM'] = '(' + varibles['ACCUM'] + ') * 2'; },
            "ASR": () => { varibles['ACCUM'] = '(' + varibles['ACCUM'] + ') / 2'; },
            "ADD": (ARG) => { varibles['ACCUM'] = '(' + varibles['ACCUM'] + ') + (' + varibles[ARG] + ')'; },
            "SUB": (ARG) => { varibles['ACCUM'] = '(' + varibles['ACCUM'] + ') - (' + varibles[ARG] + ')'; },
            "ST": (ARG) => { varibles[ARG] = varibles['ACCUM']; },
        };

        const variableDeclarations = [...variables, lastVariable].map(varName => {
            const randomValue = Math.floor(rand() * 0x7FFF);
            varibles[varName] = varName;
            variableDeclarations2[varName] = randomValue.toString(16).toUpperCase().padStart(4, '0');
            return `${ varName }: \n  WORD 0x${ randomValue.toString(16).toUpperCase().padStart(4, '0') }`;
        }).join('\n');

        const programLength = Math.floor(rand() * 5) + (5 * numVariables) + 7;

        let programBody = [];
        let pos = "START";

        for (let i = 0; i < programLength; i++) {
            if (commands[pos].includes("HLT") && i > programLength - 5) break;
            const isContainVarible = variables.some(x => varibles["ACCUM"].includes(x));

            let arr = commands[pos].filter(x => x != "HLT");
            if (!isContainVarible) arr = arr.filter(x => x != "ST" && x != "LD");
            if (!arr.length) break;
            const command = arr[Math.floor(rand() * arr.length)]

            pos = command;
            if (command.startsWith("LD") || command.startsWith("ADD") || command.startsWith("SUB") || command.startsWith("ST")) {
                let varName = variables[Math.floor(rand() * variables.length)];
                if (command.startsWith("LD")) varName = getRandomKeyWeightedByValue(variables, varibles, rand);
                if (command.startsWith("ST")) varName = getRandomKeyWeightedByValue(variables, varibles, rand);
                doCommands[command](varName);
                programBody.push(`${ command } ${ varName }`);
            } else {
                doCommands[command]();
                programBody.push(command);
            }
        }
        variables.filter(x => !varibles["ACCUM"].includes(x)).map((x) => {
            const cmd = ["ADD", "SUB"][Math.floor(rand() * 2)];
            doCommands[cmd](x);
            programBody.push(`${cmd} ${x}`);
        });

        doCommands['ST'](lastVariable);
        programBody.push(`ST ${lastVariable}`);
        programBody.push(`HLT`);

        programBody = programBody.map((x) => {
            let cmd = x.split(' ');
            if (cmd.length == 2) {
                x = [cmd[0], (start_adress - 1 + excelColumnToNumber(cmd[1])).toString(16).padStart(3, '0').toUpperCase()].join(' ');
            }
            return x;
        });
        
        const program = `ORG 0x${start_adress.toString(16).toUpperCase().padStart(3, '0')}\n${variableDeclarations}\nSTART: \n  ${programBody.join('\n  ')}\n`;

        //if (variables.every(x=> varibles[lastVariable].includes(x)))
        return {
            program: program,
            formula: varibles[lastVariable],
            program_arr: programBody,
            lastChar: lastVariable,
            variableDeclarations: variableDeclarations2,
            start_adress: start_adress,
            seed: [seed[0], seed[1], seed[2], seed[3]].map(x => x.toString(16).toUpperCase().padStart(8, '0'))
        }
        //else
        //    return bcomp.gen_prog('$' + taskVariant, difficulty);
    },
    asm_tracing_program: (asm, callback, len) => {
        if (!len) len = 10; 
        bcomp.my_doppio.run(
            'asm\n' + asm + '\nEND\n' + 'c '.repeat(len)+'\n',

            (x) => {
                function parser_1(s) {
                    // Адр Знчн  IP  CR   AR  DR   SP  BR   AC  NZVC Адр Знчн
                    const t = s.match(/^([\dA-F]{3}) ([\dA-F]{4}) ([\dA-F]{3}) ([\dA-F]{4}) ([\dA-F]{3}) ([\dA-F]{4}) ([\dA-F]{3}) ([\dA-F]{4}) ([\dA-F]{4}) ([\dA-F]{4})( ([\dA-F]{3}) ([\dA-F]{4}))?$/);
                    console.log(s, t);
                    if (t) {
                        return {
                            adress: t[1],
                            value: t[2],
                            IP: t[3],
                            CR: t[4],
                            AR: t[5],
                            DR: t[6],
                            SP: t[7],
                            BR: t[8],
                            AC: t[9],
                            NZVC: t[10],
                            adress2: t[12],
                            value2: t[13],
                        };
                    } else {
                        return null;
                    }

                }
                const arr = x.split('\n').map(x => parser_1(x)).filter(x => x);
                if (len > 1000) {
                    callback(arr);
                } else {
                    if (arr.filter(x => x.value == '0100').length) {
                        let f = 0;
                        callback(arr.map(x => { if (f) return; if (x.value == '0100') f = 1; return x; }).filter(x => x));
                    } else {
                        bcomp.asm_tracing_program(asm, callback, len*2);
                    }
                 }
            }
        );
    }
};

/*
document.getElementById('stdinButton').onclick = ()=>{
    my_doppio.run(document.getElementById('stdin').value.replace(/\\n/g,'\n'), (x) => { document.getElementById('console').value = x; });

};
*/


export default bcomp;