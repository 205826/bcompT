import React, { useEffect, useState } from 'react';
import bcomp from './core/bcomp.jsx';

const Loader = () => {
    const [message, setMessage] = useState('Loading...');
    const [callback, setCallback] = useState(false);

    useEffect(() => {

        const loggerHandler = (message, callback) => {
            if (message == 'Done!') return setMessage(false);
            setMessage(message);
            if (callback) {
                setCallback(()=>callback);
            } else {
                setCallback(false);
            }
        };

        bcomp.my_doppio.loggers.push(loggerHandler);


        bcomp.init();

        return () => {
            bcomp.my_doppio.loggers = bcomp.my_doppio.loggers.filter(x => x != loggerHandler);
        };
    }, []);

    if (message && ['start', 'starting'].indexOf(bcomp.my_doppio.state)) {
        return (
            <div style={styles.loaderContainer}>
                <div style={styles.loader}>{message}</div>
                {callback && (
                    <>
                        <input type="button" style={styles.button} onClick={callback} value="Я готов!" />
                    </>
                )}
            </div>
        );
    }

    return null; 
};

// Стили для загрузчика
const styles = {
    loaderContainer: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.90)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        zIndex: 99999,
    },
    loader: {
        fontSize: '24px',
        color: '#aaa',
    },
    button: {
        fontSize: '24px',
        color: '#aaa',
    }
};

export default Loader;
