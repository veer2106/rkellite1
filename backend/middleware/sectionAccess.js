/**
 * Section Access Middleware
 * Filters data based on user's section access
 * Captains can only access their assigned section
 */

const filterBySection = (req, res, next) => {
    // If user is a captain, add section filter to query
    if (req.user && req.user.role === 'captain' && req.user.section) {
        // Add section filter to query parameters
        req.sectionFilter = req.user.section;

        // If there's a query object, add section to where clause
        if (!req.query) {
            req.query = {};
        }

        // Override any section parameter with user's section for captains
        req.query.section = req.user.section;
    }

    next();
};

const validateSectionAccess = (req, res, next) => {
    // If user is a captain, validate they can only access their section
    if (req.user && req.user.role === 'captain' && req.user.section) {
        const requestedSection = req.body.section || req.params.section || req.query.section;

        if (requestedSection && requestedSection !== req.user.section) {
            return res.status(403).json({
                success: false,
                message: `Access denied. You can only access ${req.user.section} section.`
            });
        }

        // Automatically set section for POST/PUT requests
        if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
            req.body.section = req.user.section;
        }
    }

    next();
};

const checkSectionAccess = (allowedSections = []) => {
    return (req, res, next) => {
        // Admin and manager have access to all sections
        if (req.user && ['admin', 'manager'].includes(req.user.role)) {
            return next();
        }

        // Captains can only access their assigned section
        if (req.user && req.user.role === 'captain') {
            if (!req.user.section) {
                return res.status(403).json({
                    success: false,
                    message: 'No section assigned to your account.'
                });
            }

            if (allowedSections.length > 0 && !allowedSections.includes(req.user.section)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. You can only access ${req.user.section} section.`
                });
            }
        }

        next();
    };
};

module.exports = {
    filterBySection,
    validateSectionAccess,
    checkSectionAccess
};
