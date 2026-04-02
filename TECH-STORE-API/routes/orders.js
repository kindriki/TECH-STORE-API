// Импортируем express для создания роутера
const express = require("express");
// Создаем экземпляр роутера для группировки маршрутов, связанных с заказами
const router = express.Router();

// Импортируем контроллер для обработки запросов, связанных с заказами
const orderController = require("../controllers/orderController");
// Импортируем middleware для аутентификации
const auth = require("../middleware/auth");

// Импортируем массивы правил валидации для заказов
const {
    createOrder,
    updateOrder,
    getAllOrdersQuery,
} = require("../validators/order");

// Маршрут для получения списка заказов с фильтрацией. Публичный доступ (без аутентификации)
router.get("/", ...getAllOrdersQuery, orderController.getAllOrders);
// Маршрут для получения конкретного заказа по ID. Публичный доступ
router.get("/:id", orderController.getOrderById);
// Маршрут для создания нового заказа 
router.post("/", auth, ...createOrder, orderController.createOrder);
// Маршрут для обновления заказа
router.put("/:id", auth, ...updateOrder, orderController.updateOrder);
// Маршрут для удаления заказа 
router.delete(
    "/:id",
    auth,
    orderController.deleteOrder
);

// Экспортируем роутер для подключения в основном файле server.js
module.exports = router;
