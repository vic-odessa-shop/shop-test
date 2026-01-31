import React, { useState, useEffect, useCallback } from 'react';
import './ProductList.css';
import ProductItem from "../ProductItem/ProductItem";
import { useTelegram } from "../../hooks/useTelegram";

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [filter, setFilter] = useState('Все');
    const { tg } = useTelegram();

    // Загружаем товары из нашего JSON
    useEffect(() => {
        fetch('./products.json')
            .then(res => res.json())
            .then(data => setProducts(data));
    }, []);

    // Собираем список уникальных категорий
    const categories = ['Все', ...new Set(products.map(p => p.category))];

    // Фильтруем товары по выбранной категории
    const filteredProducts = filter === 'Все' 
        ? products 
        : products.filter(p => p.category === filter);

    return (
        <div className={'list-container'}>
            <div className={'categories-bar'}>
                {categories.map(cat => (
                    <button 
                        key={cat} 
                        className={`cat-btn ${filter === cat ? 'active' : ''}`}
                        onClick={() => setFilter(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            <div className={'list'}>
                {filteredProducts.map(item => (
                    <ProductItem
                        key={item.id}
                        product={item}
                        className={'item'}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProductList;
