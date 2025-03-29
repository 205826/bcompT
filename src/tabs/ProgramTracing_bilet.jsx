import { useState } from 'react';
import { useEffect, useLayoutEffect } from 'react';
import DragAndDropContainer from '../DragAndDrop/DragAndDropContainer.jsx';
import DragAndDropSplitter from '../DragAndDrop/DragAndDropSplitter.jsx';
import bcomp from "../core/bcomp.jsx";


//{ setSystemValue, updateSystemValue, getSystemValue, setLen, getLen, set2DValue, set3DValue, get2DValue, getNextValue, values };
export default function ProgramTracing_bilet({ setup, globalState }) {
    function Editable(y, REG) {
        const regexs = {
            FORMULA: /[^A-Za-z0-9\(\)+\-*\/ ]/g,
            IP: /[^A-Fa-f0-9]/g,
            CR: /[^A-Fa-f0-9]/g,
            AR: /[^A-Fa-f0-9]/g,
            DR: /[^A-Fa-f0-9]/g,
            BR: /[^A-Fa-f0-9]/g,
            AC: /[^A-Fa-f0-9]/g,
            NZVC: /[^0-1]/g
        };

        const sizes = {
            FORMULA: 0,
            IP: 3,
            CR: 4,
            AR: 3,
            DR: 4,
            BR: 4,
            AC: 4,
            NZVC: 4
        };

        const sizes_f = {
            FORMULA: 35,
            IP: 8,
            CR: 8,
            AR: 8,
            DR: 8,
            BR: 8,
            AC: 8,
            NZVC: 8
        };

        const next = {
            FORMULA: 'IP',
            IP: 'CR',
            CR: 'AR',
            AR: 'DR',
            DR: 'BR',
            BR: 'AC',
            AC: 'NZVC',
            NZVC: 'IP'
        };

        const back = {
            FORMULA: 'FORMULA',
            IP: 'NZVC',
            CR: 'IP',
            AR: 'CR',
            DR: 'AR',
            BR: 'DR',
            AC: 'BR',
            NZVC: 'AC'
        };

        function pad(s) {
            let totalSize = sizes_f[REG];
            let sLength = s.length;

            if (sLength >= totalSize) {
                while (sLength >= totalSize) totalSize += 89;

                //67
                return (s + '_'.repeat(totalSize-s.length)).split('').map((x,i)=>(i-66+89)%89==0?x+'\n':x).join('');
            } else if (s) s = s.padStart(sizes[REG], '0');

            sLength = s.length;

            const totalPadding = totalSize - sLength;
            const paddingRight = Math.floor(totalPadding / 2);
            const paddingLeft = totalPadding - paddingRight;

            return '_'.repeat(paddingLeft) + s + '_'.repeat(paddingRight);
        }

        function move(dir, y, REG) {
            let [_y, _x] = [y, REG];
            for (let i = 0; i < 100; i++) {
                [_y, _x] = globalState.getNextValue(dir, _y, _x);
                if (!globalState.get2DValue(_y, _x).isRight) {
                    globalState.set3DValue(y, REG, "isEdit", false);
                    globalState.set3DValue(_y, _x, "isEdit", true);
                    break;
                }
            }
        }
        let mclass = '';
        if (globalState.get2DValue(y, REG).isTested) mclass = ' ISINCORECT';
        if (globalState.get2DValue(y, REG).isRight) mclass = ' ISCORECT';


        if (!globalState.get2DValue(y, REG).isEdit)
            return (<font className={"bilet_inp" + mclass} onClick={() => {
                if (!globalState.get2DValue(y, REG).isRight) globalState.set3DValue(y, REG, "isEdit", true);
            }}>{pad(globalState.get2DValue(y, REG).value)}</font>);
        else
            return (<input autoFocus className={"bilet_inp R_" + REG + mclass} value={globalState.get2DValue(y, REG).value.replace(regexs[REG], '').slice(0, sizes[REG] || 100000)} onChange={(e) => {
                globalState.set3DValue(y, REG, "isTested", false);
                globalState.set3DValue(y, REG, "value", e.target.value.replace(regexs[REG], '').slice(0, sizes[REG] || 100000));
            }} onKeyDown={(e) => {
                if (e.key === 'Tab' || e.key === 'Enter') {
                    e.preventDefault();
                    move(0, y, REG);
                }
                if (e.key === 'ArrowLeft' && e.target.selectionStart == 0) {
                    e.preventDefault();
                    move(1, y, REG);
                }
                if (e.key === 'ArrowRight' && e.target.selectionStart == e.target.value.length) {
                    e.preventDefault();
                    move(0, y, REG);
                }
                if (e.key === 'ArrowUp' && e.target.selectionStart == e.target.value.length) {
                    e.preventDefault();
                    move(2, y, REG);
                }
                if (e.key === 'ArrowDown' && e.target.selectionStart == e.target.value.length) {
                    e.preventDefault();
                    move(3, y, REG);
                }
                console.log(e.key);

            }} onBlur={(e) => {
                globalState.set3DValue(y, REG, "isEdit", false);
            }} />);

    }




    useEffect(() => {
        if (globalState.getLen()) {
            return;
        }
        globalState.init();
        globalState.updateSystemValue("REDY", 0);
        let t = setTimeout(() => {
            // нет смысла в if (!t) return;
            globalState.updateSystemValue("REDY", 1);
            let s = bcomp.gen_prog(setup.variant, setup.difficulty);
            bcomp.asm_tracing_program(s.program, (x) => {
                if (!t) return;
                globalState.setSystemValue("gen", { ...s, tracing_program: x });
                globalState.setSystemValue("try_time", new Date());
                globalState.setSystemValue("try", 0);
                globalState.setSystemValue("setup", setup); // only for history
                globalState.setLen(x.length);
                globalState.updateSystemValue("REDY", 2);
            });
        }, 500);
        return () => { clearTimeout(t); t = 0; };
    }, [setup]);

    try {
        if (!globalState.getSystemValue("REDY")) {
            return "Ожидание завершения ввода...";
        }
        if (globalState.getSystemValue("REDY") == 1) {
            return "Генерация...";
        }
        let { program_arr, variableDeclarations, start_adress, lastChar, seed, tracing_program } = globalState.getSystemValue("gen");
        return (
            <pre style={{ textAlign: 'center' }}>
                {
                    'ФИО ____________________________________________ Группа ___________ вариант: ' + seed.join('').slice(0, 12) + '\n' +
                    'Вручную исполните программу, указав значения регистров после выполнения каждой команды \n' +
                    'Запишите формулу, ' + lastChar + ' = '}{Editable(0, 'FORMULA')}{' которая вычисляется программой.\n' +
                    '-'.repeat(89) + '\n' +
                    '* Адрес * Команда/данные *   IP   *   CR   *   AR   *   DR   *   BR   *   AC   *  NZVC  *\n' +
                    '-'.repeat(89) + '\n' +
                    Object.keys(variableDeclarations).map((x, i) => {
                        return `*  ${(start_adress + i).toString(16).padStart(3, '0').toUpperCase()}  *      ${variableDeclarations[x]}      *___000__*__0000__*___000__*__0000__*__0000__*__0000__*__----__*`
                    }).join('\n') + '\n'
                }
                {
                    program_arr.map((x, i) => {
                        if (!setup.mnemonic) x = '   ' + tracing_program[i].value;
                        return <>
                            {"*  "}
                            {(start_adress + i + Object.keys(variableDeclarations).length).toString(16).padStart(3, '0').toUpperCase()}
                            {"  * "}
                            {i ? ' ' : '+'}
                            {" "}
                            {x.padEnd(12, ' ')}
                            {" *"}
                            {Editable(i, 'IP')}
                            {"*"}
                            {Editable(i, 'CR')}
                            {"*"}
                            {Editable(i, 'AR')}
                            {"*"}
                            {Editable(i, 'DR')}
                            {"*"}
                            {Editable(i, 'BR')}
                            {"*"}
                            {Editable(i, 'AC')}
                            {"*"}
                            {Editable(i, 'NZVC')}
                            {"*\n"}
                        </>
                    })
                }
            </pre>
        );
    } catch (e) { console.log(e.toString()); return (<pre>{e.stack}</pre>); }
}


