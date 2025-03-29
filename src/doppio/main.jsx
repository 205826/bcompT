const is_localy = location.origin.includes('localhost');
const download_url = is_localy ? '/bcompT/' : '/bcompT/';



function constructPersistantFs(cb) {
    if (BrowserFS.FileSystem.IndexedDB.isAvailable()) {
        const idbfs = new BrowserFS.FileSystem.IndexedDB((e, fs) => {
            if (e) {
                cb(new BrowserFS.FileSystem.InMemory())
            } else {
                cb(idbfs)
            }
        }, "doppio-cache")
    } else if (BrowserFS.FileSystem.HTML5FS.isAvailable()) {
        const html5fs = new BrowserFS.FileSystem.HTML5FS(100 * 1024 * 1024)
        html5fs.allocate(e => {
            if (e) {
                cb(new BrowserFS.FileSystem.InMemory())
            } else {
                cb(html5fs)
            }
        })
    } else {
        cb(new BrowserFS.FileSystem.InMemory())
    }
}











function download_doppio_zip(log, callback) {
    var t = new XMLHttpRequest();
    t.open("GET", download_url+"doppio_home.zip");
    t.responseType = "arraybuffer";
    t.addEventListener("load", function (e) {
        callback(t.response)
    });
    t.addEventListener('progress', (e) => {
        const loaded = e.loaded;
        const total = e.total;
        log(`Загрузка JVM ${loaded >> 10} KB / ${total >> 10} KB`);
    });
    t.send();
}

let buffer = BrowserFS.BFSRequire("buffer").Buffer;
let process = BrowserFS.BFSRequire('process');

let mfs = new BrowserFS.FileSystem.MountableFileSystem(), fs = BrowserFS.BFSRequire('fs'), path = BrowserFS.BFSRequire('path');
let jvmObject = null;
const my_doppio = {

    // start -> starting -> ready -> running
    //                        ^          |
    //                        |          |
    //                        \__________/

    state: 'start',
    loggers: [(x) => { console.log(x); }],
    init: () => {
        if (my_doppio.state != 'start') return;
        my_doppio.state = 'starting';
        function log(txt,cb) {
            my_doppio.loggers.map(x => x(txt, cb));
        }

        log('Ждем, когда вы предоставите или запретите нам доступ к хранилищу браузера...');

        BrowserFS.initialize(mfs);
        mfs.mount('/tmp', new BrowserFS.FileSystem.InMemory());
        mfs.mount('/home', new BrowserFS.FileSystem.InMemory());
        mfs.mount('/sys', new BrowserFS.FileSystem.InMemory());//new BrowserFS.FileSystem.XmlHttpRequest(download_url + (is_localy ? 'listings.json' : 'public_listings.json'), '.'));

        function download_bcomp_jar(cb) {

            log('Скачиваем bcomp.jar...');
            const fileName = 'bcomp-ng.jar';

            // Fetch the JAR file
            fetch(download_url + fileName)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.blob();
                })
                .then(blob => {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        const arrayBuffer = event.target.result;

                        BrowserFS.initialize(mfs);
                        fs.writeFile('/sys/' + fileName, new buffer(new Uint8Array(arrayBuffer)), function (err) {
                            if (err) {
                                alert(err);
                            } else {
                                cb();
                            }
                        });
                    };

                    // Read the Blob as ArrayBuffer
                    reader.readAsArrayBuffer(blob);
                })
                .catch(error => {
                    alert(error + '');
                });
        }

        function recursiveCopy(srcFolder, destFolder, progressCb, cb) {
            function copyFile(srcFile, destFile, cb) {
                fs.readFile(srcFile, (e, data) => {
                    if (e) {
                        cb(e)
                    } else {
                        fs.writeFile(destFile, data, cb)
                    }
                })
            }

            function asyncEach(array, iterator) {
                return new Promise((resolve, reject) => {
                    let index = 0;

                    function next() {
                        if (index < array.length) {
                            iterator(array[index], (err) => {
                                if (err) {
                                    return reject(err);
                                }
                                index++;
                                next();
                            });
                        } else {
                            resolve();
                        }
                    }

                    next();
                });
            }

            function processDir(srcFolder, destFolder, cb) {
                fs.mkdir(destFolder, err => {
                    // Ignore EEXIST.
                    if (err && err.code !== "EEXIST") {
                        cb(err)
                    } else {
                        fs.readdir(srcFolder, (e, items) => {
                            if (e) {
                                cb(e)
                            } else {
                                asyncEach(
                                    items,
                                    (item, next) => {
                                        var srcItem = path.resolve(srcFolder, item),
                                            destItem = path.resolve(destFolder, item)
                                        fs.stat(srcItem, (e, stat) => {
                                            if (e) {
                                                cb(e)
                                            } else {
                                                if (stat.isDirectory()) {
                                                    processDir(srcItem, destItem, next)
                                                } else {
                                                    progressCb(srcItem, destItem, stat)
                                                    copyFile(srcItem, destItem, next)
                                                }
                                            }
                                        })
                                    }
                                ).then(() => {
                                    cb();
                                }).catch(err => {
                                    console.error('Error processing items:', err);
                                });
                            }
                        })
                    }
                })
            }

            processDir(srcFolder, destFolder, cb)
        }
        constructPersistantFs((persistentFs) => {
            log('Проверяем кэш');

            BrowserFS.initialize(persistentFs);
            fs.readdir('/classes/', (err, files) => {
                download_bcomp_jar(() => {
                    BrowserFS.initialize(mfs);
                    mfs.mount('/doppio_home', persistentFs);

                    if (files && files.length > 0) {
                        run();
                    } else {
                        log('Мы подгрузим 40 мегабайт JVM. Вы не против?', () => {
                            download_doppio_zip(log, (n) => {
                                mfs.mount("/doppio_home2", new BrowserFS.FileSystem.ZipFS(new buffer(n)));
                                BrowserFS.initialize(mfs);
                                recursiveCopy('/doppio_home2', '/doppio_home', (src, dest, size) => {
                                    log(`Extracting ${dest.slice(dest.indexOf('/', 1) + 1)}...`);
                                }, (err) => {
                                    if (err) {
                                        log(`Error extracting doppio_home.zip: ${err}`);
                                    } else {
                                        run();
                                    }
                                });
                            });
                        });
                    }
                });
            });
        });
        //download_doppio_zip(r);

        function run() {
            if (document.readyState == 'complete') {
                afterLoad();
            } else {
                window.addEventListener('load', function () {
                    afterLoad();
                });
            }
        }

        function afterLoad() {

            process.initializeTTYs();
            process.chdir('/home');
            var stdoutBuffer = '';
            process.stdout.on('data', function (data) {
                stdoutBuffer += data.toString();
                var newlineIdx;
                while ((newlineIdx = stdoutBuffer.indexOf("\n")) > -1) {
                    console.log('--');
                    my_doppio.output += stdoutBuffer.slice(0, newlineIdx + 1);
                    stdoutBuffer = stdoutBuffer.slice(newlineIdx + 1);
                }
            });
            var stderrBuffer = '';
            process.stderr.on('data', function (data) {
                stderrBuffer += data.toString();
                var newlineIdx;
                while ((newlineIdx = stderrBuffer.indexOf("\n")) > -1) {
                    my_doppio.output += stderrBuffer.slice(0, newlineIdx + 1);
                    stderrBuffer = stderrBuffer.slice(newlineIdx + 1);
                }
            });

            log('Запускаем JVM!');
            let run_jvm_t = setTimeout(() => {
                log('Запускаем JVM! Это может занять некоторое время...');
                run_jvm_t = -1;
            }, 1000);
            new Doppio.VM.JVM({
                // '/sys' is the path to a directory in the BrowserFS file system with:
                // * vendor/java_home/*
                doppioHomePath: '/doppio_home',
                // Add the paths to your class and JAR files in the BrowserFS file system
                classpath: ['/sys/bcomp-ng.jar']
            }, function (err, jo) {
                if (run_jvm_t != -1) clearTimeout(run_jvm_t);
                jvmObject = jo;

                log('Уже почти всё!');




                jvmObject.runClass('ru.JarLauncher', [], function (exitCode) {
                    //on_end();
                    console.log();
                });

                let mt = setInterval(() => {
                    if (my_doppio.output) {
                        clearInterval(mt);
                        setTimeout(() => {
                            my_doppio.state = 'ready';
                            log('Done!');
                        });
                    }
                }, 50);


            });
           
        }
    },
    output: '',
    stack: [],
    run: (message, callback) => {
        my_doppio.stack.push([message, callback]);
        real_run();
        function real_run() {
            if (my_doppio.stack.length == 0) return;

            if (my_doppio.state !== 'ready') {
                return setTimeout(real_run, 10);
            }
            console.log('1');

            my_doppio.state = 'running';

            let parm = my_doppio.stack[0];

            /*
            jvmObject.runJar([], function (exitCode) {
                on_end();
            });

            Doppio.VM.CLI(['-Dmode=cli', '-jar', '/sys/src/doppio/bcomp-ng.jar'], {
                doppioHomePath: '/doppio_home'
            }, on_end, () => {
                console.log('2');
});*/

            setTimeout(() => {
                my_doppio.output = '';
                process.stdin.write('sleep 1\n');
                process.stdin.write(parm[0] + '\n');
                process.stdin.write('quit\n');
                process.stdin.write('END\n');
                process.stdin.write('quit\n');
                console.log('s--');
            });

            let mt = setInterval(() => {
                if (my_doppio.output.includes('!!!')) {
                    clearInterval(mt);
                    setTimeout(() => {
                        on_end();
                        process.stdin.write('NEXT\n');
                    });
                }
            }, 50);

            function on_end() {
                console.log('3');
                const ignoreLine = [/^Эмулятор Базовой .*$/, /^БЭВМ готова к работе.*$/, /^Используйте .*$/, /^!!!$/];


                parm[1](my_doppio.output.split('\n').filter(y => !ignoreLine.some(x=>x.test(y))).join('\n'));
                my_doppio.stack.shift();
                my_doppio.state = 'ready';
               /* my_doppio.output = '';

                let mt = setInterval(() => {
                    if (my_doppio.output) {
                        console.log('2');
                        clearInterval(mt);
                        my_doppio.state = 'ready';
                    }
                }, 50);*/
            }
        }

    }
};

export default my_doppio;