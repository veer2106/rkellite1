const AuditLog = require('../models/AuditLog');

// Helper to determine action type from HTTP method and path
const getActionType = (method, path) => {
  if (method === 'POST') return 'CREATE';
  if (method === 'PUT' || method === 'PATCH') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  if (method === 'GET' && path.includes('/login')) return 'LOGIN';
  return 'READ';
};

// Helper to determine entity type from path
const getEntityType = (path) => {
  if (path.includes('/menu')) return 'Menu';
  if (path.includes('/orders')) return 'Order';
  if (path.includes('/inventory')) return 'Inventory';
  if (path.includes('/reservations')) return 'Reservation';
  if (path.includes('/customers')) return 'Customer';
  if (path.includes('/staff')) return 'Staff';
  if (path.includes('/auth')) return 'Authentication';
  if (path.includes('/reports')) return 'Report';
  return 'System';
};

// Middleware to log actions
const auditLogger = (options = {}) => {
  return async (req, res, next) => {
    // Skip logging for GET requests to reports and audit endpoints
    if (req.method === 'GET' && (req.path.includes('/reports') || req.path.includes('/audit'))) {
      return next();
    }

    // Store original end function
    const originalEnd = res.end;

    // Override end function to capture response
    res.end = async function(chunk, encoding) {
      res.end = originalEnd;
      res.end(chunk, encoding);

      try {
        // Only log if user is authenticated and action was successful (2xx status)
        if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
          const action = getActionType(req.method, req.path);
          const entityType = getEntityType(req.path);
          
          // Extract entity ID from path or body
          const pathParts = req.path.split('/');
          const entityId = pathParts[pathParts.length - 1].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
            ? pathParts[pathParts.length - 1]
            : null;

          // Create description
          let description = `${action} ${entityType}`;
          if (req.body?.name) description += ` - ${req.body.name}`;
          if (req.body?.email) description += ` - ${req.body.email}`;

          // Log the audit entry
          await AuditLog.create({
            userId: req.user.id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            action,
            entityType,
            entityId,
            description,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            requestMethod: req.method,
            requestPath: req.path,
            changes: {
              body: req.body,
              query: req.query
            },
            status: 'SUCCESS'
          });
        }
      } catch (error) {
        const logger = require('../utils/logger');
        logger.error('Audit logging failed', {
          error: error.message,
          method: req.method,
          url: req.url
        });
        // Don't fail the request if audit logging fails
      }
    };

    next();
  };
};

module.exports = auditLogger;
