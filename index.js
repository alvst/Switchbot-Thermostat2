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


  this.service = new Service.Thermostat(this.name)
}

Thermostat.prototype = {

  identify: function (callback) {
    this.log('Identify requested!')
    callback()
  },

  _httpRequest: function (url, body, method, callback) {
    request({
      url: url,
      body: body,
      method: this.http_method,
      timeout: this.timeout,
      rejectUnauthorized: false,
      auth: this.auth
    },
    function (error, response, body) {
      callback(error, response, body)
    })
  },

  _getStatus: function (callback) {
    const url = this.apiroute + '/status'
    this.log.debug('Getting status: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error getting status: %s', error.message)
        this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(new Error('Polling failed'))
        callback(error)
      } else {
        this.log.debug('Device response: %s', responseBody)
        try {
          const json = JSON.parse(responseBody)
          this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(json.targetTemperature)
          this.log.debug('Updated TargetTemperature to: %s', json.targetTemperature)
          this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(json.currentTemperature)
          this.log.debug('Updated CurrentTemperature to: %s', json.currentTemperature)
          this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(json.targetHeatingCoolingState)
          this.log.debug('Updated TargetHeatingCoolingState to: %s', json.targetHeatingCoolingState)
          this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(json.currentHeatingCoolingState)
          this.log.debug('Updated CurrentHeatingCoolingState to: %s', json.currentHeatingCoolingState)
          if (this.temperatureThresholds) {
            this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(json.coolingThresholdTemperature)
            this.log.debug('Updated CoolingThresholdTemperature to: %s', json.coolingThresholdTemperature)
            this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(json.heatingThresholdTemperature)
            this.log.debug('Updated HeatingThresholdTemperature to: %s', json.heatingThresholdTemperature)
          }
          if (this.currentRelativeHumidity) {
            this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(json.currentRelativeHumidity)
            this.log.debug('Updated CurrentRelativeHumidity to: %s', json.currentRelativeHumidity)
          }
          callback()
        } catch (e) {
          this.log.warn('Error parsing status: %s', e.message)
        }
      }
    }.bind(this))
  },

  _httpHandler: function (characteristic, value) {
    switch (characteristic) {
      case 'targetHeatingCoolingState': {
        this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      }
      case 'targetTemperature': {
        this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      }
      case 'coolingThresholdTemperature': {
        this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      }
      case 'heatingThresholdTemperature': {
        this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      }
      default: {
        this.log.warn('Unknown characteristic "%s" with value "%s"', characteristic, value)
      }
    }
  },

  setTargetHeatingCoolingState: function (value, callback) {
    const url = this.apiroute + '/targetHeatingCoolingState?value=' + value
    this.log.debug('Setting targetHeatingCoolingState: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting targetHeatingCoolingState: %s', error.message)
        callback(error)
      } else {
        this.log('Set targetHeatingCoolingState to: %s', value)
        setTimeout(function () {
          this._getStatus(function () {})
        }.bind(this), this.checkupDelay)
        callback()
      }
    }.bind(this))
  },

  setTargetTemperature: function (value, callback) {
    value = value.toFixed(1)
    const url = this.apiroute + '/targetTemperature?value=' + value
    this.log.debug('Setting targetTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting targetTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set targetTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },

  setCoolingThresholdTemperature: function (value, callback) {
    value = value.toFixed(1)
    const url = this.apiroute + '/coolingThresholdTemperature?value=' + value
    this.log.debug('Setting coolingThresholdTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting coolingThresholdTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set coolingThresholdTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },

  setHeatingThresholdTemperature: function (value, callback) {
    value = value.toFixed(1)
    const url = this.apiroute + '/heatingThresholdTemperature?value=' + value
    this.log.debug('Setting heatingThresholdTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting heatingThresholdTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set heatingThresholdTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },

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
