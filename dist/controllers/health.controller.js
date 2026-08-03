export function getHealth(_req, res) {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=health.controller.js.map