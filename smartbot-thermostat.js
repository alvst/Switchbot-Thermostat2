let Service, Characteristic;
const packageJson = require('./package.json');
const request = require('request');
const ip = require('ip');
const http = require('http');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    'homebridge-web-thermostat',
    'Thermostat',
    Thermostat
  );
};

function Thermostat(log, config) {
  // this.log = log;

  // this.pollInterval = config.pollInterval || 300;
  // this.validStates = config.validStates || [0, 1, 2, 3];
  // 0 = Off
  // 1 = Heat
  // 2 = Cool
  // 3 = Auto

  this.temperatureThresholds = config.temperatureThresholds || false;
  // this.heatOnly = config.heatOnly || false;

  this.currentRelativeHumidity = config.currentRelativeHumidity || false;
  this.temperatureDisplayUnits = config.temperatureDisplayUnits || 0;
  this.maxTemp = config.maxTemp || 75;
  this.minTemp = config.minTemp || 65;
  this.minStep = config.minStep || 1;

  this.powerState = 0;
  // 0 = Off
  // 1 = On
}
