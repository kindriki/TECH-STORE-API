// Импортируем конфигурацию, где хранятся учетные данные администратора
const config = require("../config");
// Импортируем класс для создания кастомных ошибок с HTTP-статусами
const AppError = require("../utils/appError");

// Middleware функция для проверки базовой аутентификации
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic")) {
        return next(new AppError("Требуется авторизация (Basic Auth)", 401));
    }

    // Извлекаем закодированные в Base64 учетные данные (часть после "Basic ")
    const base64Credentials = authHeader.split(" ")[1];
    // Декодируем из Base64 в обычную строку
    const credentials = Buffer.from(base64Credentials, "base64").toString(
        "ascii",
    );
    // Разделяем строку на логин и пароль
    const [username, password] = credentials.split(":");
    // Сравниваем полученные учетные данные с теми, что хранятся в конфигурации
    if (
        username === config.ADMIN_CREDENTIALS.username &&
        password === config.ADMIN_CREDENTIALS.password
    ) {
        next();
    } else {
        // Если данные неверны - возвращаем ошибку 401
        return next(new AppError("Неверные учетные данные", 401));
    }
};

// Экспортируем middleware для использования в защищенных роутах
module.exports = authMiddleware;