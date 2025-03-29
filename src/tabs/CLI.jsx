import React, { useState, useEffect } from 'react';
import bcomp from "../core/bcomp.jsx";
import SplitPane from '../SplitPane/SplitPane.jsx'; // Импортируем наш SplitPane

let need_run_code = '';
let typingTimeout = 0;
export default function CLI() {
    const [code, setCode] = useState(localStorage.getItem('CLI') || `?
# mem[004] = "INC"
4 a 0700 w 1 a
# Трассировка
c c c c c c c c c
`);
    const [output, setOutput] = useState('');

    const handleCodeChange = (event) => {
        setCode(event.target.value);

        need_run_code = event.target.value;

        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        typingTimeout = setTimeout(() => {
            runCode();
        }, 500);
    };
    useEffect(() => {
        need_run_code = code;
        let t = setTimeout(() => {
            runCode();
        }, 500);
        return () => clearTimeout(t);
    }, [])

    const runCode = () => {
        let runed = need_run_code;
        bcomp.cli(runed, (result) => {
            setOutput(result);
            if (runed != need_run_code) runCode(); else localStorage.setItem('CLI', need_run_code);
        });
    };

    return (
        <SplitPane
            left={
                <textarea
                    value={code}
                    onChange={handleCodeChange}
                    style={{ width: '100%', height: '100%', fontFamily: 'monospace', border: 'none', outline: 'none', resize: 'none', background: 'none' }}
                />
            }
            right={
                <pre>{output}</pre>
            }
        />
    );
}
