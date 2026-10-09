import "./global.css";


import { useState } from "react";

import Teste from "./telas/teste";

export default function App() {
    const [tela, setTela] = useState("inicio");

    //const navegar() Recebe o nome da página e altera o estado
    //setTela altera a página
    const navegar = (pagina: string) => {
        setTela(pagina);
    };

    if (tela === "inicio") {
        return <Teste navegar={navegar} />;
    }
  }