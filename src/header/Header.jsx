import { useState } from "react";

function Header({ showSubmenu, setShowSubmenu }) {
    const [activeTab, setActiveTab] = useState("");

    const handleClick = (tab) => {
        setActiveTab(tab);
        setShowSubmenu('');
    };

    const toggleSubmenu = (menu) => {
        setShowSubmenu((prev) => prev === menu ? '' : menu);
    };

    return (
        <div id="header">
            <a href="#"
                className={activeTab === "home" ? "active" : ""}
                onClick={() => handleClick("home")}>
                БЭВМ
            </a>
            <a
                role="button" tabIndex="0"
                onClick={() => toggleSubmenu("rubezh")}
                className={['program-tracing', 'micro_program_tracing'].includes(activeTab) ? "active" : ""}
            >
                Рубежные работы
            </a>
            {showSubmenu == 'rubezh' && (
                <div className="submenu">
                    <a
                        href="#program-tracing"
                        className={activeTab === "program-tracing" ? "active" : ""}
                        onClick={() => handleClick("program-tracing")}
                    >
                        Трассировка
                    </a>
                    <a
                        href="#array-program"
                        className={activeTab === "array" ? "active" : ""}
                        onClick={() => handleClick("array")}
                    >
                        Массив
                    </a>
                    <a
                        href="#micro_program_tracing"
                        className={activeTab === "micro_program_tracing" ? "active" : ""}
                        onClick={() => handleClick("micro_program_tracing")}
                    >
                        Микротрассировка
                    </a>
                    <a
                        href="https://205826.github.io/T2P/T2P_EDITOR.html?id=199996"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Генератор
                    </a>
                </div>
            )}
            <a
                role="button" tabIndex="0"
                onClick={() => toggleSubmenu("reshety")}
                className={[2, 3, 4, 5, 6].map(x => `lab${x}`).includes(activeTab) ? "active" : ""}
            >
                Решаторы лаб
            </a>
            {showSubmenu == 'reshety' && (
                <div className="submenu">
                    {[2, 3, 4, 5, 6].map((lab) => (
                        <a
                            key={lab}
                            href={`#lab${lab}`}
                            className={activeTab === `lab${lab}` ? "active" : ""}
                            onClick={() => handleClick(`lab${lab}`)}
                        >
                            Лаба {lab}
                        </a>
                    ))}
                </div>
            )}
            <a
                href="#cli"
                className={activeTab === "cli" ? "active" : ""}
                onClick={() => handleClick("cli")}
            >
                CLI
            </a>
        </div>
    );
}

export default Header;
