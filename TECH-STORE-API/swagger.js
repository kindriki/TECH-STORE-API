// Импортируем модуль для генерации спецификации Swagger из JSDoc-комментариев
const swaggerJsdoc = require("swagger-jsdoc");
// Импортируем встроенный модуль path для работы с путями к файлам
const path = require("path");
// Настройки для генерации Swagger-спецификации
const options = {
  // Определение основной информации об API
  definition: {
    openapi: "3.0.0",
    // Информация о самом API
    info: {
      title: "Магазин техники API",
      version: "1.0.0",
      description:
       "REST API для управления клиентами, заказами и пунктами выдачи (ПВЗ).",
       // Массив серверов, на которых развернуто API (для документации)
      servers: [
        {
          url: "http://localhost:3000",
          description: "Локальный сервер (разработка)",
        },
      ],
    },
      // Компоненты, используемые в API (схемы, security и т.д.)
      components: {
        // Определяем схему безопасности для аутентификации
        securitySchemes: {
          basicAuth: {
            type: "http",
            scheme: "basic",
            description: 
            "Basic Authentication для доступа к административным эндоинтам. Используйте учетные данные из конфигурации.",
          },
        },
      },
    security: [{ basicAuth: [] }]
  },
  // Путь к файлам, содержащим YAML-описания эндпоинтов
  apis: ["./docs/*.yaml"],
};
// Генерируем спецификацию Swagger на основе настроек
const specs = swaggerJsdoc(options);
// Экспортируем сгенерированную спецификацию для использования в других файлах (например, в server.js)
module.exports = specs;