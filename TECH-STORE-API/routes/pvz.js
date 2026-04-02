// Импортируем express для создания роутера
const express = require("express");
// Создаем экземпляр роутера для группировки маршрутов, связанных с пунктами выдачи (ПВЗ)
const router = express.Router();
// Импортируем подключение к базе данных для выполнения SQL-запросов
const db = require("../db/db");

// Маршрут для получения списка всех пунктов выдачи. Публичный доступ (без аутентификации)
router.get("/", (req, res, next) => {
    try {
        const pvz = db.prepare("SELECT * FROM pvz ORDER BY city, address").all();
        res.json(pvz);
    } catch (err) {
        next(err);
    }
});

// Экспортируем роутер для подключения в основном файле server.js
module.exports = router;