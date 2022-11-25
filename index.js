let Service, Characteristic;
const packageJson = require('./package.json');
const request = require('request');
const ip = require('ip');
const http = require('http');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    'Switchbot-Thermostat',
    'Thermostat',
    Thermostat
  );
};

function Thermostat(log, config) {
  this.log = log;
  console.log(log);

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

  getServices: function () {
    this.informationService = new Service.AccessoryInformation()
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

    this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(this.temperatureDisplayUnits)

    this.service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('set', this.setTargetHeatingCoolingState.bind(this))

    this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .setProps({
        validValues: this.validStates
      })

    this.service
      .getCharacteristic(Characteristic.TargetTemperature)
      .on('set', this.setTargetTemperature.bind(this))
      .setProps({
        minValue: this.minTemp,
        maxValue: this.maxTemp,
        minStep: this.minStep
      })

    this.service
      .getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -600,
        maxValue: 600
      })

    if (this.temperatureThresholds) {
      this.service
        .getCharacteristic(Characteristic.CoolingThresholdTemperature)
        .on('set', this.setCoolingThresholdTemperature.bind(this))
        .setProps({
          minValue: this.minTemp,
          maxValue: this.maxTemp,
          minStep: this.minStep
        })

      this.service
        .getCharacteristic(Characteristic.HeatingThresholdTemperature)
        .on('set', this.setHeatingThresholdTemperature.bind(this))
        .setProps({
          minValue: this.minTemp,
          maxValue: this.maxTemp,
          minStep: this.minStep
        })
    }

    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [this.informationService, this.service]
  }
}
