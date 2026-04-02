const path = require("path");
const Database = require("better-sqlite3"); 
// Формируем полный путь к файлу базы данных store.db в текущей папке
const dbPath = path.join(__dirname, 'store.db');

// Создаем подключение к базе данных
const db = new Database(dbPath, { verbose: console.log });

// Включаем поддержку внешних ключей
db.pragma("foreign_keys = ON");

// Выполняем SQL-запросы для создания таблиц, если они еще не существуют
db.exec(`
-- Таблица пунктов выдачи заказов (ПВЗ)  
CREATE TABLE IF NOT EXISTS pvz (
    id INTEGER PRIMARY KEY,
    address TEXT NOT NULL,
    city TEXT NOT NULL
);
-- Таблица клиентов
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(name) >= 3 AND length(name) <= 50),
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    registeredAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerId INTEGER NOT NULL,
    totalPrice REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('new', 'processing', 'ready_for_pickup', 'completed', 'canceled')),
    pvzId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Связи с другими таблицами
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (pvzId) REFERENCES pvz(id) ON DELETE RESTRICT
);
-- Таблица товаров в заказе 
CREATE TABLE IF NOT EXISTS order_items (
    orderId INTEGER NOT NULL,
    productName TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    price REAL NOT NULL CHECK(price >= 0),

    PRIMARY KEY (orderId, productName),
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
);
`);
// Проверяем, есть ли уже данные в таблице pvz
const pvzCount = db.prepare("SELECT COUNT(*) as cnt FROM pvz").get().cnt;

// Если таблица пуста - заполняем начальными данными
if (pvzCount === 0) {
    const insertPvz = db.prepare(
        "INSERT INTO pvz (id, address, city) VALUES (?, ?, ?)"
    );

    // Массив с начальными данными пунктов выдачи
    const pvzList = [
        [1,'ул. Ленина, 10, ТЦ "Галерея"', "Москва"],
        [2, "пр. Мира, 25, к. 1", "Санкт-Петербург"],
        [3, "ул. Победы, 5", "Екатеринбург"],
        [4, "ул. Советская, 12", "Новосибирск"],
        [5, "пр. Космонавтов, 8", "Казань"]
    ];

    // Создаем транзакцию для вставки всех ПВЗ
    const transaction = db.transaction(() => {
        pvzList.forEach((pvz) => insertPvz.run(...pvz));
    });

    // Выполняем транзакцию
    transaction();
    console.log("ПВЗ успешно добавлены");
}

// Экспортируем подключение к базе данных для использования в других модулях
module.exports = db;