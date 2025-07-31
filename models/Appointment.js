const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('waiting', 'in-process', 'completed'),
    defaultValue: 'waiting'
  },
  room: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isPrioritized: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isPromotedToTop: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'appointments',
  timestamps: true
});

module.exports = Appointment;
