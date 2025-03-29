import { evaluate, simplifyCore, simplify } from 'mathjs';

function comp(x, y) {
    let vars = [...x.matchAll(/[A-Za-z]+/g)].map(x => x[0]);
    vars = vars.concat([...y.matchAll(/[A-Za-z]+/g)].map(x => x[0]));

    for (let i = 0; i < 100; i++) {
        let obj = {};
        vars.map(x => {
            obj[x.toUpperCase()] = Math.floor(Math.random() * 100 - 50);
        });

        if (Math.floor(evaluate(x.toUpperCase(), obj)) !== Math.floor(evaluate(y.toUpperCase(), obj))) return false;

    }
    return true;
}
function simpli(x) {
    return x.length > 300 ? x : (x.length > 100?simplifyCore: simplify)(x, { exactFractions: false }).toString();
}

export default { comp, simpli } ;