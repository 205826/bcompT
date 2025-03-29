import { useState, useMemo, useRef } from 'react';
import DragAndDropContainer from '../DragAndDrop/DragAndDropContainer.jsx';
import DragAndDropSplitter from '../DragAndDrop/DragAndDropSplitter.jsx';
import ProgramTracing_bilet from './ProgramTracing_bilet.jsx';
import mymath from '../core/math.jsx';
import { useEffect } from 'react';

const columns = ["FORMULA", 'IP', 'CR', 'AR', 'DR', 'BR', 'AC', 'NZVC'];
const rus_columns = ["Формулу", 'IP', 'CR', 'AR', 'DR', 'BR', 'AC', 'NZVC'];

function validate(globalState, type) {
    if (!globalState.getLen()) return;
    // -((-((-1-A)/4)-1)/2-2)+A

    if (type.includes("FORMULA")) { // Проверить формулу
        if (!globalState.get2DValue(0, "FORMULA").isTested) {

            if (globalState.get2DValue(0, "FORMULA").value) {
                let t = mymath.comp(globalState.get2DValue(0, "FORMULA").value, globalState.getSystemValue("gen").formula);
                if (!t) globalState.incSystemValue("try", 1);

                globalState.set3DValue(0, "FORMULA", "isTested", true);
                globalState.set3DValue(0, "FORMULA", "isRight", t);
            } else {
                globalState.set3DValue(0, "FORMULA", "isTested", true);
            }
        }
        // { comp, simpli }
    }

    let regs = columns.filter(x => x != "FORMULA");
    for (let j = 0; j < regs.length; j++) {
        if (!type.includes(regs[j])) continue;
        for (let i = 0; i < globalState.getLen(); i++) {
            if (globalState.get2DValue(i, regs[j]).isRight) continue;

            if (!globalState.get2DValue(i, regs[j]).value) {
                globalState.set3DValue(i, regs[j], "isTested", true);
                break;
            } else {
                if (globalState.get2DValue(i, regs[j]).isTested) break;

                let t = globalState.get2DValue(i, regs[j]).value.padStart(4, '0').toUpperCase() == globalState.getSystemValue("gen").tracing_program[i][regs[j]].padStart(4, '0').toUpperCase();
                if (!t) globalState.incSystemValue("try", 1);

                globalState.set3DValue(i, regs[j], "isTested", true);
                globalState.set3DValue(i, regs[j], "isRight", t);
                if (!t) break;
            }
        }
    }
}

function displayAns(globalState, type, onliOne) {
    if (!globalState.getLen()) return;
    // -((-((-1-A)/4)-1)/2-2)+A

    if (type.includes("FORMULA")) {
        if (!globalState.get2DValue(0, "FORMULA").isRight) {
            globalState.incSystemValue("try", 1000000);

            globalState.set2DValue(0, "FORMULA", { value: mymath.simpli(globalState.getSystemValue("gen").formula), isEdit: false, isRight: true, isTested: true });
        }
    }

    let regs = columns.filter(x => x != "FORMULA");
    for (let j = 0; j < regs.length; j++) {
        if (!type.includes(regs[j])) continue;
        for (let i = 0; i < globalState.getLen(); i++) {
            if (globalState.get2DValue(i, regs[j]).isRight) continue;

            if (!onliOne) {
                globalState.incSystemValue("try", 1000000);
                globalState.set2DValue(i, regs[j], { value: globalState.getSystemValue("gen").tracing_program[i][regs[j]].toUpperCase(), isEdit: false, isRight: true, isTested: true });
            } else {
                if (!globalState.get2DValue(i, regs[j]).value) {
                    globalState.incSystemValue("try", 1000000);
                    globalState.set2DValue(i, regs[j], { value: globalState.getSystemValue("gen").tracing_program[i][regs[j]].toUpperCase(), isEdit: false, isRight: true, isTested: true });
                    break;
                }
            }
        }
    }
}


function getStat(globalState) {
    let noFullFill = [...columns];
    let isRight = [...columns];

    if (!globalState.getLen()) return { noFullFill, isRight };
;
    if (!globalState.get2DValue(0, "FORMULA").isRight) {
        noFullFill = noFullFill.filter(x => x !== "FORMULA");
        isRight = isRight.filter(x => x !== "FORMULA");
    }
    let regs = columns.filter(x => x != "FORMULA");
    for (let j = 0; j < regs.length; j++) {
        for (let i = 0; i < globalState.getLen(); i++) {
            if (!globalState.get2DValue(i, regs[j]).value) {
                noFullFill = noFullFill.filter(x => x !== regs[j]);
            }
            if (!globalState.get2DValue(i, regs[j]).isRight) {
                isRight = isRight.filter(x => x !== regs[j]);
            } 
        }
    }

    if (isRight.length == columns.length) {
        globalState.end();
    }

    return { noFullFill, isRight };
}

function useObjectOf2DArrayOfObject(history) {
    const [values, _setValues] = useState({ "SYSTEM": {}, "LEN": 0 });
    const setValues = (x, y) => {
        console.log('kek');
        _setValues(x, y);
        _setValues(x => ({ ...x, modify_date: (+new Date()) }));
    };

    const init = (t) => {
        if (t)
            setValues(x=>t);
        else
            setValues(x => ({ "SYSTEM": {}, "LEN": 0 }));
    }

    const end = () => {
        if (!values.SYSTEM.end) values.SYSTEM.end = new Date();
        history.add(values);
    }

    const setSystemValue = (s, v) => {
        setValues(x => ({ "LEN": 0, SYSTEM: { ...x.SYSTEM, [s]: v } }));
    };

    const updateSystemValue = (s, v) => {
        setValues(x => ({ ...x, SYSTEM: { ...x.SYSTEM, [s]: v } }));
    };

    const incSystemValue = (s, v) => {
        setValues(x => ({ ...x, SYSTEM: { ...x.SYSTEM, [s]: (x.SYSTEM[s] || 0) + v } }));
    };

    const getSystemValue = (s) => {
        return values.SYSTEM[s];
    };
    const setLen = (len) => {
        setValues(z => {
            let newObj = { "LEN": len, SYSTEM: z.SYSTEM };
            for (let i = 0; i < len; i++) {
                newObj[i] = {}
                columns.slice(1).map(x => {
                    newObj[i][x] = { value: '', isEdit: false, isRight: false, isTested: false };
                })
                if (!i)
                    newObj[i][columns[0]] = { value: '', isEdit: false, isRight: false, isTested: false };
                    
            }
            return newObj;
        });
    };

    const getLen = () => {
        return values.LEN;
    };

    const set2DValue = (y, x, v) => {
        setValues(z => {
            let newObj = {...z};
            if (!newObj[y]) newObj[y] = {};
            if (typeof v == "string")
                newObj[y][x] = {...newObj[y][x], value: v};
            else
                newObj[y][x] = v;
            return newObj;
        });
    };

    const set3DValue = (y, x, z, v) => {
        setValues(d => {
            let newObj = { ...d };
            if (!newObj[y]) newObj[y] = {};
            if (!newObj[y][x]) newObj[y][x] = {};
            newObj[y][x][z] = v;
            return newObj;
        });
    };

    const get2DValue = (y, x) => {
        if (!values[y]) return '';
        if (!values[y][x]) return '';
        return values[y][x];
    };

    const getNextValue = (dir, y, x) => {
        if (x == columns[0]) {
            switch (dir) {
                case 0: // right
                    return [0, columns[1]];
                case 1: // left
                    return [0, x];
                case 2: // up
                    return [0, x];
                case 3: // down
                    return [0, columns[1]];
            }
        } else {
            switch (dir) {
                case 0: // right
                    const f = columns[columns.indexOf(x) + 1] || columns[1];
                    if (f == columns[1] && y >= values.LEN - 1) return [y, x];
                    if (f == columns[1]) return [y + 1, f];
                    return [y, f];
                    break;
                case 1: // left
                    const b = columns[columns.indexOf(x) - 1];
                    if (y > 0 && b == columns[0]) return [y - 1, columns.at(-1)];
                    return [y, b];
                    break;
                case 2: // up
                    if (y <= 0) return [0, columns[0]];
                    return [y-1, x];
                    break;
                case 3: // down
                    if (y >= values.LEN - 1) return [values.LEN - 1, columns.at(-1)];
                    return [y + 1, x];
                    break;
            }
        }

    } 

    return { init, end, setSystemValue, updateSystemValue, incSystemValue, getSystemValue, setLen, getLen, set2DValue, set3DValue, get2DValue, getNextValue, values };
}

function useHistory() {
    const [_history, _setHistory] = useState(null);
    const [history, setHistory] = [_history, (x) => {
        console.log('!!!2', x); _setHistory(x);
    }];
    console.log('!!!', history);

    const globalState_ref = useRef(null);


    const pref = "PTV1_";

    useEffect(() => {
        let arr = [];
        try { arr = JSON.parse(localStorage.getItem(pref + 'list') || '[]'); } catch (e) { }
        setHistory(arr);
    }, [])

    useEffect(() => {
        if (history&&history.length) localStorage.setItem(pref + 'list', JSON.stringify(history.slice(0, 1000)));
    }, [history]);
    const toHis = (values) => {
        return ({
            version: 1,
            variant: values.SYSTEM.setup.variant,
            difficulty: values.SYSTEM.setup.difficulty,
            mnemonic: values.SYSTEM.setup.mnemonic,
            try: values.SYSTEM.try,
            start: +new Date(values.SYSTEM.try_time),
            end: (values.SYSTEM.end ? +new Date(values.SYSTEM.end):0),
            values: values
        });
    }
    const add = (values) => {
        if (!history) return setTimeout(() => add(values), 10);

        if (undefined !== history.find(x => x.values && x.values.modify_date == values.modify_date)) return;

        setHistory(
            [toHis(values), ...history]
            .sort((x, y) => y.start - x.start)
            .filter((item, pos, a) => (a.map(x => x.start).indexOf(item.start) == pos))
            .map((x, i) => (i > 10 ? { ...x, values: null } : x))
            .filter((x, i) => (i <= 5 || x.try))
        );
    }
    const get = (globalState) => {
        if (!history) return [];
        if (!globalState.getLen()) return history;

        add(globalState.values);
        //globalState_ref.current = { ...globalState.values };

        return history;

        //return [toHis(globalState.values.SYSTEM, true), ...history].map(x => ({ ...x, len: x.end - x.start })).filter((item, pos, a) => (a.map(x => x.start).indexOf(item.start) == pos));
    }

    //const [tmp, setTmp] = useState(0);
    useEffect(() => {
        const handle = setInterval(() => {
            //setTmp((x) => x + 1);
            //globalState_ref
            if (globalState_ref.current) {
                add(globalState_ref.current);
                globalState_ref.current = null;
            }
        }, 1 * 1000);
        return () => {
            clearInterval(handle);
        };
    }, []);

    return { add, get };
}

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${ hours }:${ minutes } ${ day }.${ month }.${ year }`;
};

const formatDuration = (milliseconds, f) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (f) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return `${ String(hours).padStart(2, '0') }:${ String(minutes).padStart(2, '0') }:${ String(seconds).padStart(2, '0') }`;
};

const truncateString = (str, maxLength) => {
    return str.length > maxLength ? str.slice(0, 7) + '...' : str;
};

const DataTable = ({ data, init }) => {
    const columns = ['Дата', 'Вариант', 'Сложность', 'Мнемоника', 'Попытка', 'Длительность'];

    const [mdate, setMdate] = useState(new Date());
    useEffect(() => {
        const handle = setInterval(() => {
            setMdate(new Date());
        }, 20 * 1000);
        return () => {
            clearInterval(handle);
        };
    }, []);

    return (
        <table className="data-table">
            <thead>
                <tr>
                    {columns.map((column, index) => (
                        <th key={index}>{column}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index} className={"data-table-row" + (item.values ? " isF" : "")} onClick={() => { if (item.values) init(item.values); }}>
                        <td>{formatDate(item.start)}</td>
                        <td>{truncateString(item.variant, 10)}</td>
                        <td>{truncateString(item.difficulty, 10)}</td>
                        <td>{item.mnemonic?"YES":"NO"}</td>
                        <td>{item.try >= 1000000 ? (<s>{item.try % 1000000}</s>) : item.try}</td>
                        <td>{item.end ? formatDuration(item.end - item.start, false) : formatDuration(new Date() - item.start, true)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateString(length) {
    let result = ' ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}


export default function ProgramTracing() {
    //const [variant, setVariant] = useState('<T>');
    //const [difficulty, setDifficulty] = useState('3');
    //const [mnemonic, setMnemonic] = useState(false); // Изменено на boolean

    const history = useHistory();

    const globalState = useObjectOf2DArrayOfObject(history);

    const [setup, setSetup] = useState(
        {
            variant: '<T>',
            difficulty: '2',
            mnemonic: false,
        });

    const setSetupValue = (s, v) => {
        if (["variant", "difficulty"].includes(s)) globalState.init();
        if (["mnemonic"].includes(s)) globalState.updateSystemValue("setup", { ...setup, [s]: (setup[s] || v) });
        setSetup(x => ({ ...x, [s]: v }));
    };

    let { noFullFill, isRight } = useMemo(() => getStat(globalState), [globalState.values, setup]);


    const [onliOne, setOnliOne] = useState(true);
    const [antiClick, setAntiClick] = useState(false);

    function init(t) {
        globalState.init(t);
        setSetup(t.SYSTEM.setup);
        setOnliOne(true);
        setAntiClick(false);
    }

    return (
        <DragAndDropSplitter defaultLeft={['Билет']} defaultRight={['Настройки', 'Завершить', 'История']}>
            <DragAndDropContainer name="Билет">
                <ProgramTracing_bilet setup={setup} globalState={globalState}/>
            </DragAndDropContainer>
            <DragAndDropContainer name="Настройки">
                <label>
                    Вариант:
                    <input type="text" value={setup.variant} onChange={(e) => setSetupValue('variant', e.target.value)} />{" "}
                    <input type="button" value={"Cгенерировать"} onClick={() => setSetupValue('variant', generateString(12))} />
                </label><br />
                <label>
                    Сложность (1-10):
                    <input type="text" value={setup.difficulty} onChange={(e) => setSetupValue('difficulty', e.target.value)} />
                </label><br />
                <label>
                    Показать мнемонику:
                    <input type="checkbox" checked={setup.mnemonic} onChange={(e) => setSetupValue('mnemonic', !setup.mnemonic)} />
                </label><br />
            </DragAndDropContainer>
            <DragAndDropContainer name="Завершить">
                {"Проверить: "}
                {
                    columns.map((x) => (
                        <>
                            {" "}
                            < input disabled={isRight.includes(x)} type="button" value={rus_columns[columns.indexOf(x)]} onClick = {(e) => {
                                validate(globalState, [x]);
                            }} />
                        </>
                    ))
                }
                {" "}
                <input disabled={isRight.length == columns.length} type="button" value="вcё" onClick={(e) => {
                    validate(globalState, [...columns]);
                }} /><br />

                {"Хочу ответы: "}
                <input
                    type="checkbox"
                    checked={antiClick}
                    style={{ opacity: antiClick ?0.2:1}}
                    onChange={(e) => setAntiClick(e.target.checked)}
                /><br />
                {antiClick?(<>
                    {"Показать (только первый незаполненный "}
                    <input
                        type="checkbox"
                        checked={onliOne}
                        onChange={(e) => setOnliOne(e.target.checked)}
                    />{"): "}
                    {
                        columns.map((x) => (
                            <>
                                {" "}
                                < input disabled={[isRight, noFullFill][+onliOne].includes(x)} type="button" value={rus_columns[columns.indexOf(x)]} onClick={(e) => {
                                    displayAns(globalState, [x], onliOne);
                                }} />
                            </>
                        ))
                    }
                    {" "}
                    <input disabled={[isRight, noFullFill][+onliOne].length == columns.length} type="button" value="вcё" onClick={(e) => {
                        displayAns(globalState, [...columns], onliOne);
                    }} /><br />
                </>):("")}
                
            </DragAndDropContainer>
            <DragAndDropContainer name="История">
                <DataTable data={history.get(globalState)} init={init} />
            </DragAndDropContainer>
        </DragAndDropSplitter>
    );
}
