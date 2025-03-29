import {
    BrowserRouter as Router,
    Routes,
    Route,
    useLocation,
} from "react-router-dom";
import "./App.css";
import Header from "./header/Header.jsx";
import Body from "./header/Body.jsx";
import Loader from "./Loader.jsx";
import E404 from "./404.jsx";

import BCOMP from "./tabs/BCOMP.jsx";
import ProgramTracing from "./tabs/ProgramTracing.jsx";
import MicroProgramTracing from "./tabs/MicroProgramTracing.jsx";
import Solver from "./tabs/Solver.jsx";
import CLI from "./tabs/CLI.jsx";
import { useState } from "react";

function App() {
    const [showSubmenu, setShowSubmenu] = useState('');

    return (
        <Router>
            <Loader />
            <Header showSubmenu={showSubmenu} setShowSubmenu={setShowSubmenu} />
            <Body showSubmenu={showSubmenu}>
                <Routes>
                    <Route path="*" element={<HardPath />} />
                </Routes>
            </Body>
        </Router>
    );
}

function HardPath() {
    let loc = useLocation().hash;
    console.log(loc);
    //if (/^#?$/m.test(loc)) return <BCOMP />;
    if (/^#program-tracing.*/m.test(loc)) return <ProgramTracing />;
    //if (/^#micro_program_tracing.*/m.test(loc)) return <MicroProgramTracing />;
    //if (/^#solver.*/m.test(loc)) return <Solver />;
    if (/^#cli.*/m.test(loc)) return <CLI />;

    return <E404 />;
}

export default App;
