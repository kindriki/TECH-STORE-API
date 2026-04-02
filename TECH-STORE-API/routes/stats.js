// Импортируем express для создания роутера
const express = require("express");
// Создаем экземпляр роутера для группировки маршрутов, связанных со статистикой
const router = express.Router();

// Импортируем контроллер заказов (статистика берется из заказов)
const controller = require("../controllers/orderController");
// Импортируем middleware для аутентификации
const auth = require("../middleware/auth");

// Маршрут для получения статистики по заказам
router.get("/", auth, controller.getStats);

// Экспортируем роутер для подключения в основном файле server.js
module.exports = router;
