// Импортируем подключение к базе данных
const db = require("../db/db");
// Импортируем класс для кастомных ошибок
const AppError = require("../utils/appError");

// Функция для получения списка заказов с фильтрацией и пагинацией
exports.getAll = ({ page = 1, limit = 10, status = null, pvzId = null }) => {
    // Вычисляем смещение для пагинации
    const offset = (page - 1) * limit;
    // Базовый SQL-запрос с JOIN для получения связанных данных (клиент и ПВЗ)
    let query = `
    SELECT o.id, o.customerId, o.totalPrice, o.status, o.pvzId, o.createdAt,
    c.name AS customerName, p.address AS pvzAddress, p.city AS pvzCity
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    JOIN pvz p ON o.pvzId = p.id
    `;
    const params = []; // Параметры для защиты от SQL-инъекций
    
    // Массив для условий фильтрации
    const conditions = [];
    if (status) {
        conditions.push("o.status = ?");
        params.push(status);
    }
    if (pvzId) {
        conditions.push("o.pvzId = ?");
        params.push(pvzId);
    }
    
    // Если есть условия, добавляем WHERE
    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }
    
    // Добавляем сортировку и пагинацию
    query += " ORDER BY o.createdAt DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    // Выполняем запрос и возвращаем все записи
    return db.prepare(query).all(...params);
};

// Функция для получения заказа по ID с его товарами
exports.getById = (id) => {
  // Получаем основной заказ с данными клиента и ПВЗ
  const order = db
    .prepare(
        `
    SELECT o.*, c.name AS customerName, p.address AS pvzAddress, p.city AS pvzCity
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    JOIN pvz p ON o.pvzId = p.id
    WHERE o.id = ?
    `,
    )
    .get(id);

  if (!order) return null; 

  // Получаем все товары, входящие в этот заказ
  const items = db
    .prepare(
        `
    SELECT productName, quantity, price
    FROM order_items
    WHERE orderId = ?
    `,
    )
    .all(id);

  // Возвращаем заказ с добавленным массивом товаров
  return { ...order, items };
};

/**
 * JSDoc: описание входных данных для создания заказа
 * @param {Object} data
 * @param {number} data.customerId - ID клиента
 * @param {number} data.pvzId - ID пункта выдачи
 * @param {string} data.status - статус заказа
 * @param {Array} data.items - массив товаров
 */

// Функция для создания нового заказа
exports.create = (data) => {
  const { customerId, pvzId, status = "new", items = [] } = data;

  // Проверка на наличие хотя бы одного товара
  if (!items.length) {
    throw new AppError("Заказ должен содержать хотя бы один товар", 400);
  }
  
  // Проверка существования клиента
  const customerExists = db
    .prepare("SELECT 1 FROM customers WHERE id = ?")
    .get(customerId);
  if (!customerExists) throw new AppError("Клиент не найден", 404);
  
  // Проверка существования пункта выдачи
  const pvzExists = db.prepare("SELECT 1 FROM pvz WHERE id = ?").get(pvzId);
  if (!pvzExists) throw new AppError("ПВЗ не найден", 404);

  // Вычисление общей суммы заказа 
  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  ).toFixed(2);

  // Транзакция - гарантирует, что либо всё выполнится, либо ничего
  return db.transaction(() => {
    // 1. Создаём заказ
    const orderStmt = db.prepare(`
    INSERT INTO orders (customerId, totalPrice, status, pvzId)
    VALUES (?, ?, ?, ?)
    `);
    const orderInfo = orderStmt.run(customerId, totalPrice, status, pvzId);
    const orderId = db.prepare("SELECT last_insert_rowid()").get()["last_insert_rowid()"];

    // 2. Добавляем позиции в связанную таблицу order_items
    const itemStmt = db.prepare(`
    INSERT INTO order_items (orderId, productName, quantity, price)
    VALUES (?, ?, ?, ?)
    `);
    
    // Для каждого товара вставляем запись с привязкой к заказу
    items.forEach((item) => {
        itemStmt.run(orderId, item.productName, item.quantity, item.price);
    });

    // Возвращаем полные данные созданного заказа (вместе с товарами)
    return exports.getById(orderId);
  })(); 
};

// Функция для обновления заказа
exports.update = (id, data) => {
  const { status, pvzId } = data;

  const updates = []; // Части SET запроса
  const params = [];  // Значения для параметров

  // Если передан статус - добавляем в обновление
  if (status) {
    updates.push("status = ?");
    params.push(status);
  }
  // Если передан ПВЗ - добавляем в обновление
  if (pvzId) {
    updates.push("pvzId = ?");
    params.push(pvzId);
  }

  // Если нет полей для обновления - ошибка
  if (!updates.length) {
    throw new AppError("Не указаны поля для обновления", 400);
  }

  params.push(id); // Добавляем ID для WHERE

  // Динамический запрос обновления
  const stmt = db.prepare(`
    UPDATE orders
    SET ${updates.join(", ")}
    WHERE id = ?
  `);

  const info = stmt.run(...params); 

  // Если ни одна запись не обновлена - заказ не найден
  if (info.changes === 0) {
    throw new AppError("Заказ не найден", 404);
  }

  // Возвращаем обновленный заказ
  return exports.getById(id);
};

// Функция для удаления заказа
exports.delete = (id) => {

  // Проверяем существование заказа и получаем его статус
  const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(id);
  if (!order) throw new AppError("Заказ не найден", 404);

  // удалять можно только новые или отмененные заказы
  if (!["new", "canceled"].includes(order.status)) {
    throw new AppError(
      'Можно удалять только заказы с статусом "new" или "canceled"',
      409, 
    );
  }

  // Удаляем заказ 
  db.prepare("DELETE FROM orders WHERE id = ?").run(id);
};

// Функция для получения статистики по заказам
exports.getStats = () => {
  // Статистика по статусам: сколько заказов в каждом статусе
  const ordersByStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM orders
    GROUP BY status
  `).all().reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {});

  // Общее количество заказов
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
  
  // Общая выручка (сумма всех заказов)
  const totalRevenue = db.prepare("SELECT SUM(totalPrice) as sum FROM orders").get().sum || 0;

  // Статистика по пунктам выдачи: количество заказов и выручка на каждый ПВЗ
  const ordersByPvz = db.prepare(`
    SELECT p.id as pvzId, p.city, p.address, COUNT(o.id) as orderCount, SUM(o.totalPrice) as revenue
    FROM pvz p
    LEFT JOIN orders o ON p.id = o.pvzId
    GROUP BY p.id
  `).all();

  // Количество уникальных клиентов, сделавших хотя бы один заказ
  const clientsWithOrders = db.prepare("SELECT COUNT(DISTINCT customerId) as count FROM orders").get().count;

  // Возвращаем объект со всей статистикой
  return { ordersByStatus, totalOrders, totalRevenue, ordersByPvz, clientsWithOrders };
};
