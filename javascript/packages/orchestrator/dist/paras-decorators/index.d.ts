declare enum PARA {
    Statemint = "statemint",
    Moonbeam = "moonbeam",
    Efinity = "efinity",
    Acala = "acala",
    Astar = "astar",
    Bifrost = "bifrost",
    Equilibrium = "equilibrium",
    Oak = "oak",
    Mangata = "mangata",
    Generic = "generic"
}
declare function whichPara(chain: string): PARA;
declare function decorate(para: PARA, fns: Function[]): Function[];
export { whichPara, decorate, PARA };
