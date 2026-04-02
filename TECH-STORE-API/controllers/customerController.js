// Импортируем сервис для работы с клиентами 
const customerService = require("../services/customerService");
// Импортируем класс для кастомных ошибок
const AppError = require("../utils/appError");

// Контроллер для получения списка всех клиентов с пагинацией и фильтрацией
exports.getAllCustomers = async (req, res, next) => {
    try {
      // Получаем параметры из query-строки
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 20);
        const email = req.query.email ? req.query.email.trim() : null;

        // Вызываем сервис для получения данных
        const customers = await customerService.getAll({
            page,
            limit,
            email
        });

        // Отправляем успешный ответ с кодом 200 и списком клиентов
        res.status(200).json(customers);
    } catch (err) {
        next(err);
    }
};

// Контроллер для получения одного клиента по ID
exports.getCustomerById = async (req, res, next) => {
    try {
         // Извлекаем ID из параметров URL
        const { id } = req.params;

         // Получаем клиента из сервиса
        const customer = await customerService.getById(id);

         // Если клиент не найден
        if (!customer) {
            throw new AppError("Клиент не найден", 404);
        }

        // Отправляем данные клиента
        res.status(200).json(customer);
    } catch (err) {
        next(err);
    }
};

// Контроллер для создания нового клиента
exports.createCustomer = async (req, res, next) => {
  try {
    // Передаем данные из тела запроса в сервис для создания
    const newCustomer = await customerService.create(req.body);
    // Возвращаем созданного клиента с кодом 201 
    res.status(201).json(newCustomer);
  } catch (err) {
    next(err);
  }
};

// Контроллер для обновления данных клиента
exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await customerService.update(id, req.body);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// Контроллер для удаления клиента
exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    await customerService.delete(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Экспортируем все методы контроллера
module.exports = exports;
