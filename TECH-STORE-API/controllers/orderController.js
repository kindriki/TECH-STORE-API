// Импортируем сервис для работы с заказами
const orderService = require("../services/orderService");
// Импортируем класс для кастомных ошибок
const AppError = require("../utils/appError");

// Контроллер для получения списка всех заказов с фильтрацией и пагинацией
exports.getAllOrders = async (req, res, next) => {
  try {
     // Извлекаем параметры из query-строки
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const status = req.query.status || null;
    const pvzId = req.query.pvzId ? parseInt(req.query.pvzId) : null;

    // Вызываем сервис для получения заказов с переданными параметрами
    const orders = await orderService.getAll({ page, limit, status, pvzId });

    // Отправляем успешный ответ с кодом 200 и списком заказов
    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
};

// Контроллер для получения конкретного заказа по ID
exports.getOrderById = async (req, res, next) => {
  try {
    // Извлекаем ID заказа из URL
    const { id } = req.params;
    // Получаем заказ из сервиса
    const order = await orderService.getById(id);

    // Если заказ не найден, выбрасываем ошибку 404
    if (!order) throw new AppError("Заказ не найден", 404);

    // Отправляем данные заказа
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
};

// Контроллер для создания нового заказа
exports.createOrder = async (req, res, next) => {
  try {
    // Передаем данные из тела запроса в сервис для создания заказа
    const order = await orderService.create(req.body);
    // Возвращаем созданный заказ с кодом 201 
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// Контроллер для обновления заказа (статус, ПВЗ)
exports.updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await orderService.update(id, req.body);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// Контроллер для удаления заказа
exports.deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        await orderService.delete(id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

// Контроллер для получения статистики по заказам
exports.getStats = async (req, res, next) => {
    try {
        const stats = await orderService.getStats();
        res.status(200).json(stats);
    } catch (err) {
        next(err);
    }
};

// Экспортируем все методы контроллера
module.exports = exports;
