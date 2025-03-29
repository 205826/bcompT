import { useState } from "react";

function Header({ children, showSubmenu }) {

    return (
        <div id="body" style={{ top: showSubmenu ? '108px' : '54px'}}>
            {children}
        </div>
    );
}

export default Header;
