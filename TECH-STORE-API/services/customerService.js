// Импортируем подключение к базе данных для выполнения SQL-запросов
const db = require("../db/db");
// Импортируем класс для кастомных ошибок, чтобы выбрасывать понятные ошибки с HTTP-статусами
const AppError = require("../utils/appError");

/**
 * JSDoc комментарий - документация для функции
 * @param {Object} options - объект с параметрами
 * @param {number} options.page - номер страницы для пагинации
 * @param {number} options.limit - количество записей на странице
 * @param {string|null} options.email - фильтр по email (может быть null)
 * @returns {Array} - возвращает массив клиентов
 */

// Функция для получения списка всех клиентов с поддержкой пагинации и фильтрации
exports.getAll = ({ page = 1, limit = 10, email = null }) => {
  // Вычисляем смещение для пагинации
    const offset = (page - 1) * limit;

    // Базовый SQL-запрос для получения клиентов (только нужные поля)
    let query = `
    SELECT id, name, email, phone, registeredAt
    FROM customers
`;
// Массив для параметров запроса
    const params = [];

    // Если передан email, добавляем условие WHERE для фильтрации
    if (email) {
        query += " WHERE email = ?";
        params.push(email.trim());
    }

    // Добавляем сортировку по дате регистрации (новые сверху) и пагинацию
    query += " ORDER BY registeredAt DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    // Подготавливаем запрос (prepare компилирует запрос один раз для многократного использования)
    const stmt = db.prepare(query);
    // Выполняем запрос с параметрами и возвращаем все найденные записи
    return stmt.all(...params);
};

/**
 * @param {number|string} id - идентификатор клиента
 * @returns {Object|null} - возвращает объект клиента или null, если не найден
 */

// Функция для получения одного клиента по ID
exports.getById = (id) => {
  // SQL-запрос для получения клиента по ID
  const stmt = db.prepare(`
    SELECT id, name, email, phone, registeredAt
    FROM customers
    WHERE id = ?
  `);
  // Выполняем запрос и возвращаем одну запись (или null)
  return stmt.get(id);
};

/**
 * @param {Object} data - данные нового клиента
 * @param {string} data.name - имя клиента
 * @param {string} data.email - email клиента
 * @param {string} data.phone - телефон клиента
 * @returns {Object} - возвращает созданного клиента с ID и датой регистрации
 * @throws {AppError} if email already exists (выбрасывает ошибку, если email уже существует)
 */

// Функция для создания нового клиента
exports.create = (data) => {
  const { name, email, phone } = data;

  // Проверяем, не существует ли уже клиент с таким email
  const existing = db
    .prepare("SELECT id FROM customers WHERE email = ?")
    .get(email);
  if (existing) {
    // Если существует - выбрасываем ошибку 400 (Bad Request)
    throw new AppError("Клиент с таким email уже существует", 400);
  }

  // Вставляем нового клиента в базу данных
  const insertStmt = db.prepare("INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)");
  const info = insertStmt.run(name, email, phone);

  // Получаем только что созданного клиента по его ID
  const newCustomer = db
    .prepare(
        `
      SELECT id, name, email, phone, registeredAt
      FROM customers
      WHERE id = ?
    `,
    )
    .get(info.lastInsertRowid);

    // Возвращаем полные данные созданного клиента
  return newCustomer;
};

/**
 * @param {number} id - ID клиента для обновления
 * @param {Object} data - объект с полями для обновления
 */

// Функция для обновления данных клиента
exports.update = (id, data) => {
  const { name, email, phone } = data;

  // Массив для хранения частей SQL SET
  const updates = [];
  // Массив для значений параметров
  const params = [];

  // Если передано имя - добавляем в обновление
  if (name) {
    updates.push("name = ?");
    params.push(name);
  }
  // Если передан email - проверяем уникальность и добавляем
  if (email) {
    const existing = db
      .prepare("SELECT id FROM customers WHERE email = ? AND id != ?")
      .get(email, id);
    if (existing) {
      throw new AppError("Клиент с таким email уже существует", 400);
    }
    updates.push("email = ?");
    params.push(email);
  }
  // Если передан телефон - добавляем в обновление
  if (phone) {
    updates.push("phone = ?");
    params.push(phone);
  }

  // Если не передано ни одного поля для обновления - выбрасываем ошибку
if (!updates.length) {
    throw new AppError("Не указаны поля для обновления", 400);
}

// Добавляем ID в конец параметров для условия WHERE
params.push(id);

// Динамически формируем UPDATE запрос (SET с обновляемыми полями)
const stmt = db.prepare(`
    UPDATE customers
    SET ${updates.join(", ")}
    WHERE id = ?
`);

// Выполняем обновление
const info = stmt.run(...params);

// Проверяем, была ли обновлена запись (changes - количество измененных строк)
if (info.changes === 0) {
    throw new AppError("Клиент не найден", 404);
}

 // Возвращаем обновленные данные клиента
return exports.getById(id);
};

/**
 * @param {number} id - ID клиента для удаления
 */

// Функция для удаления клиента
exports.delete = (id) => {
  // Проверяем, существует ли клиент с таким ID
  const customer = db.prepare("SELECT id FROM customers WHERE id = ?").get(id);
  if (!customer) {
    throw new AppError("Клиент не найден", 404);
  }

  // Проверяем, есть ли у клиента заказы (чтобы не нарушить целостность данных)
  const hasOrders = db
  .prepare("SELECT 1 FROM orders WHERE customerId = ?")
    .get(id);
  if (hasOrders) {
    // 409 Conflict - нельзя удалить, т.к. есть связанные данные
    throw new AppError(
      "Невозможно удалить клиента с активными заказами",
      409,
    );
  }

  // Если все проверки пройдены - удаляем клиента
  db.prepare("DELETE FROM customers WHERE id = ?").run(id);
};
