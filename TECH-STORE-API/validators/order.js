// Импортируем функции body, param и query из express-validator для валидации разных частей запроса
const { body, param, query } = require("express-validator");
// Импортируем конфигурацию приложения (список допустимых статусов заказов)
const config = require("../config");

// Массив правил валидации для создания нового заказа (POST /api/orders)
const createOrder = [
  // Валидация поля customerId (ID клиента, который делает заказ)
  body("customerId")
    .isInt({ min: 1 })
    .withMessage("customerId должен быть положительным целым числом"),

     // Валидация поля pvzId (ID пункта выдачи заказа)
body("pvzId")
    .isInt({ min: 1 })
    .withMessage("pvzId должен быть положительным целым числом"),

    // Валидация поля status (опционально, так как может устанавливаться автоматически)
body("status")
    .optional()
    .isIn(config.ORDER_STATUSES)
    .withMessage(
        `Статус должен быть одним из: ${config.ORDER_STATUSES.join(", ")}`,
    ),

     // Валидация поля items (массив товаров в заказе)
body("items")
    .isArray({ min: 1 })
    .withMessage("items должен быть непустым массивом"),

    // Валидация каждого элемента массива items: поле productName
body("items.*.productName")
    .trim()
    .notEmpty()
    .withMessage("Название товара обязательно"),

    // Валидация каждого элемента массива items: поле quantity (количество)
body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Количество должно быть ≥ 1"),

    // Валидация каждого элемента массива items: поле price (цена)
body("items.*.price").isFloat({ min: 0 }).withMessage("Цена должна быть ≥ 0"),
];

// Массив правил валидации для обновления существующего заказа
const updateOrder = [
  // Валидация поля status (опционально - можно обновлять только статус)
  body("status")
    .optional()
    .isIn(config.ORDER_STATUSES)
    .withMessage(
      `Статус должен быть одним из: ${config.ORDER_STATUSES.join(", ")}`,
    ),

    // Валидация поля pvzId (опционально - можно сменить пункт выдачи)
body("pvzId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("pvzId должен быть положительным целым числом"),

    // Валидация параметра id из URL (обязательный)
param("id")
    .isInt({ min: 1 })
    .withMessage("ID заказа должен быть положительным целым числом"),
];

// Массив правил валидации для query-параметров при получении списка заказов
const getAllOrdersQuery = [
  // Валидация query-параметра page (номер страницы для пагинации)
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page должен быть ≥ 1"),

    // Валидация query-параметра limit (количество записей на странице)
  query("limit")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("limit должен быть от 1 до 20"),

    // Валидация query-параметра status (фильтрация по статусу)
  query("status").optional().isIn(config.ORDER_STATUSES),

  // Валидация query-параметра pvzId (фильтрация по пункту выдачи)
  query("pvzId").optional().isInt({ min: 1 }),
];

// Экспортируем все наборы правил для использования в роутах
module.exports = {
  createOrder,
  updateOrder,
  getAllOrdersQuery,
};