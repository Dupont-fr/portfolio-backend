export function notFoundMiddleware(req, res) {
    res.status(404).json({
        status: 'error',
        message: `Route introuvable : ${req.method} ${req.originalUrl}`,
    });
}
//# sourceMappingURL=not-found.middleware.js.map