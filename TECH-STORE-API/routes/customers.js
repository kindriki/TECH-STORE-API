// Импортируем express для создания роутера
const express = require("express");
// Создаем экземпляр роутера для группировки маршрутов, связанных с клиентами
const router = express.Router();

// Импортируем контроллер, который содержит логику обработки запросов для клиентов
const customerController = require("../controllers/customerController");

// Импортируем middleware для проверки аутентификации (доступ только для авторизованных пользователей)
const auth = require("../middleware/auth");

// Импортируем массивы правил валидации для создания и обновления клиентов
const { createCustomer, updateCustomer } = require("../validators/customer");

// Маршрут для получения списка всех клиентов. Публичный доступ (без аутентификации)
router.get("/", customerController.getAllCustomers);

// Маршрут для получения конкретного клиента по ID. Публичный доступ
router.get("/:id", customerController.getCustomerById);

// Маршрут для создания нового клиента
router.post("/", auth, ...createCustomer, customerController.createCustomer);

// Маршрут для обновления существующего клиента 
router.put("/:id", auth, ...updateCustomer, customerController.updateCustomer);

// Маршрут для удаления клиента 
router.delete(
    "/:id",
    auth,
    customerController.deleteCustomer
);

// Экспортируем роутер для подключения в основном файле server.js
module.exports = router;
