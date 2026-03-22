// Migration to add state timestamp fields to Orders table
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Orders', 'pendingAt', {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: Sequelize.NOW
        });

        await queryInterface.addColumn('Orders', 'confirmedAt', {
            type: Sequelize.DATE,
            allowNull: true
        });

        await queryInterface.addColumn('Orders', 'preparingAt', {
            type: Sequelize.DATE,
            allowNull: true
        });

        await queryInterface.addColumn('Orders', 'readyAt', {
            type: Sequelize.DATE,
            allowNull: true
        });

        await queryInterface.addColumn('Orders', 'servedAt', {
            type: Sequelize.DATE,
            allowNull: true
        });

        await queryInterface.addColumn('Orders', 'completedAtTimestamp', {
            type: Sequelize.DATE,
            allowNull: true
        });

        await queryInterface.addColumn('Orders', 'cancelledAt', {
            type: Sequelize.DATE,
            allowNull: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Orders', 'pendingAt');
        await queryInterface.removeColumn('Orders', 'confirmedAt');
        await queryInterface.removeColumn('Orders', 'preparingAt');
        await queryInterface.removeColumn('Orders', 'readyAt');
        await queryInterface.removeColumn('Orders', 'servedAt');
        await queryInterface.removeColumn('Orders', 'completedAtTimestamp');
        await queryInterface.removeColumn('Orders', 'cancelledAt');
    }
};
