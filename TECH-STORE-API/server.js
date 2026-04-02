// Импортируем express - веб-фреймворк для создания сервера
const express = require("express");

// Импортируем cors - middleware для разрешения кросс-доменных запросов
const cors = require("cors");

// Импортируем swagger-ui-express - middleware для отображения Swagger документации
const swaggerUi = require("swagger-ui-express");

// Импортируем сгенерированную спецификацию Swagger из файла swagger.js
const specs = require("./swagger");

// Импортируем конфигурацию приложения
const config = require("./config");

// Импортируем роутер для обработки запросов, связанных с клиентами
const customerRouter = require("./routes/customers");

// Импортируем роутер для обработки запросов, связанных с заказами
const orderRouter = require("./routes/orders");

// Импортируем роутер для обработки запросов, связанных с пунктами выдачи (ПВЗ)
const pvzRouter = require("./routes/pvz");

// Импортируем роутер для обработки запросов статистики
const statsRouter = require("./routes/stats");

// Создаем экземпляр Express приложения
const app = express();

// Подключаем middleware для CORS (разрешает запросы с других доменов)
app.use(cors());
// Подключаем middleware для парсинга JSON-тел запросов (делает доступным req.body)
app.use(express.json());

// Создаем кастомный middleware для логирования всех входящих запросов
app.use((req, res, next) => {
    const time = new Date().toISOString();
    console.log(`[${time}] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Настраиваем маршрут для отображения Swagger документации
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      swaggerOptions: {
         persistAuthorization: true,
    },
    customSiteTitle: "Магазин техники API Docs",
    }),
);

// Обработчик корневого маршрута
app.get("/", (req, res) => {
    res.json({
    message: "Добро пожаловать в API магазина техники!",
    docs: "/api-docs — интерактивная документация",
    });
});

// Подключаем роутеры к соответствующим базовым путям
app.use("/api/customers", customerRouter);
app.use("/api/orders", orderRouter);
app.use("/api/pvz", pvzRouter);
app.use("/api/stats", statsRouter);

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error("Ошибка:", err.message);
    console.error(err.stack);
    const status = typeof err.status === 'number' ? err.status : 500;
    res.status(status).json({
      error: err.message || "Внутренняя ошибка сервера",
    });
});

// Импортируем validationResult для проверки результатов валидации
const { validationResult } = require ("express-validator");

// Middleware для обработки ошибок валидации
app.use((req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Ошибка валидации",
            errors: errors.array(),
        });
    }
    next();
});

// Определяем порт из конфигурации или используем 3000 по умолчанию
const PORT = config.PORT || 3000;
// Запускаем сервер на указанном порту
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Документация доступна: http://localhost:${PORT}/api-docs`);
});

// Импортируем контроллер клиентов для проверки его загрузки
const customerController = require("./controllers/customerController");

// Выводим в консоль информацию о том, загружен ли метод getAllCustomers
console.log(
    "CustomerController загружен:",
   !!customerController.getAllCustomers,
);
