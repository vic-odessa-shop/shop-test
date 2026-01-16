import React, {useEffect} from 'react';
import './App.css';
import {useTelegram} from "./hooks/useTelegram";
import ProductList from "./components/ProductList/ProductList";

function App() {
    const {tg} = useTelegram();

    useEffect(() => {
        tg.ready(); // Сообщаем Телеграму, что приложение загрузилось
    }, [tg])

    return (
        <div className="App">
            <ProductList />
        </div>
    );
}

export default App;
