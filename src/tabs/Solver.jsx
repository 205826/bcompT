import { useState } from 'react';
import { useEffect, useLayoutEffect } from 'react';
import DragAndDropContainer from '../DragAndDrop/DragAndDropContainer.jsx';
import DragAndDropSplitter from '../DragAndDrop/DragAndDropSplitter.jsx';
import bcomp from "../core/bcomp.jsx";

export default function ProgramTracing() {
    const [out, setOut] = useState('');
    const [svg, setSvg] = useState('');
    const [size, setSize] = useState([window.innerWidth, window.innerHeight]);


    useEffect(() => {
        fetch('bcomp.svg').then(x => x.text()).then(x => setSvg(x));
    }, [])

    useEffect(() => {

        bcomp.tracing_program({
            program: [0x0000, 0x0700, 0x0000, 0x0700, 0x0000, 0x0700],
            // microprogram: [[1, '00A0009004'], ...],
            // mode: 'microcode',
            start_adress: 3,
            steps: 5
        }, setOut);
    }, []);

    useLayoutEffect(() => {
        function updateSize() {
            setSize([window.innerWidth, window.innerHeight]);
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    try {

        return (
            <DragAndDropSplitter defaultLeft={['test1']} defaultRight={['test2', 'test3']}>
                <DragAndDropContainer name="test1">
                    <div dangerouslySetInnerHTML={{ __html: svg.replace('version="1.1" width="1026px" height="1449px"', 'version="1.1" width="' + Math.floor(size[0] / 2) + 'px"') }}></div>
                    <pre>{JSON.stringify(out, null, 2)}</pre>
                </DragAndDropContainer>
                <DragAndDropContainer name="test2">Content for test2</DragAndDropContainer>
                <DragAndDropContainer name="test3">Content for test3</DragAndDropContainer>
            </DragAndDropSplitter>
        );
    } catch (e) { console.log(e.toString()); return (<pre>{e.stack}</pre>); }
}


