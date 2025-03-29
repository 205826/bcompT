import React, { useState } from 'react';
import './SplitPane.css'; // Подключим CSS для стилей

const def_width = window.innerWidth / 2;

const SplitPane = ({ left, right, noNeedInset }) => {
    const [width, setWidth] = useState(def_width); // Начальная ширина левой панели

    const handleMouseMove = (event) => {
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        setWidth(clientX - 10 - 3);
    };

    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleMouseMove);

        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleMouseUp);
    };

    const handleMouseDown = () => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleMouseMove);
        window.addEventListener('touchend', handleMouseUp);
    };

    return (
        <div className="split-pane">
            <div className={"left-pane" + (noNeedInset ? "" :" insetdiv")} style={{ width: `${width}px` }}>
                {left}
            </div>
            <div className="splitter outsetdiv" onMouseDown={handleMouseDown} onTouchStart={handleMouseDown} />
            <div className={"right-pane" + (noNeedInset ? "" : " insetdiv")}>
                {right}
            </div>
        </div >
    );
};

export default SplitPane;
