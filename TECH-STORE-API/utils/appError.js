// Создаем пользовательский класс ошибки, наследуясь от встроенного класса Error
class AppError extends Error {
    // Конструктор принимает сообщение об ошибке и HTTP-статус код
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        // Определяем тип ошибки на основе кода статуса: 'fail' - для ошибок клиента,'error' - для ошибок сервера
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // Флаг, указывающий, что это "ожидаемая" операционная ошибка, помогает отличать известные ошибки от критических сбоев.
        this.isOperational = true;

        // Сохраняем стек вызовов в момент создания ошибки, исключая из стека сам конструктор AppError
        Error.captureStackTrace(this, this.constructor);
    }
}
// Экспортируем класс для использования в других файлах приложения
module.exports = AppError;
