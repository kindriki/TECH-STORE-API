// Импортируем функции body и param из express-validator для валидации данных запроса
const { body, param } = require("express-validator");

// Импортируем конфигурацию приложения (настройки валидации)
const config = require("../config");

// Массив правил валидации для создания нового клиента
const createCustomer = [
  // Валидация поля "name" (имя клиента)
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Имя обязательно")
    .isLength({ min: config.MIN_NAME_LENGTH, max: config.MAX_NAME_LENGTH })
    .withMessage(
      `Имя должно быть от ${config.MIN_NAME_LENGTH} до ${config.MAX_NAME_LENGTH} символов`
    ),
    // Валидация поля "email" (электронная почта)
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email обязателен")
    .isEmail()
    .withMessage("Некорректный формат email")
    .normalizeEmail(),
    // Валидация поля "phone" (номер телефона)
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Телефон обязателен")
    .matches(config.DEFAULT_PHONE_REGEX)
    .withMessage("Телефон должен быть в формате +7(XXX)XXX-XX-XX"),
  body("password")
];

// Массив правил валидации для обновления существующего клиента
const updateCustomer = [
  // Валидация поля "name" (опционально)
  body("name")
    .optional()
    .trim()
    .isLength({ min: config.MIN_NAME_LENGTH, max: config.MAX_NAME_LENGTH })
    .withMessage(
      `Имя должно быть от ${config.MIN_NAME_LENGTH} до ${config.MAX_NAME_LENGTH} символов`
    ),
    // Валидация поля "email" (опционально)
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Некорректный формат email")
    .normalizeEmail(),
    // Валидация поля "phone" (опционально)
  body("phone")
    .optional()
    .trim()
    .matches(config.DEFAULT_PHONE_REGEX)
    .withMessage("Телефон должен быть в формате +7(XXX)XXX-XX-XX"),
    // Валидация параметра "id" из URL (обязательный параметр)
    param("id")
    .isInt({ min: 1 })
    .withMessage("ID должен быть положительным целым числом"),
];

// Экспортируем массивы правил валидации для использования в роутах
module.exports = {
  createCustomer,
  updateCustomer
};