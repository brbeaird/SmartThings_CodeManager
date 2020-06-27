'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const SmartApp = require('@smartthings/smartapp');

const server = module.exports = express();
server.use(bodyParser.json());

const app = new SmartApp()

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Simple SmartApp Example URL: https://'+ req.hostname);
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    app.handleHttpCallback(req, res);
});

/* Defines the SmartApp */
app.enableEventLogging()  // Log and pretty-print all lifecycle events and responses
    .configureI18n()      // Use files from locales directory for configuration page localization
    .page('mainPage', (context, page, configData) => {
        page.section('sensors', section => {
            section.
           section.deviceSetting('sensor').capabilities(['contactSensor']).required(true);
        });
        page.section('lights', section => {
            section.deviceSetting('lights').capabilities(['switch']).multiple(true).permissions('rx');
        });
    })
    .updated(async (context, updateData) => {
        await context.api.subscriptions.unsubscribeAll();
        return Promise.all([
            context.api.devices.
            context.api.subscriptions.subscribeToDevices(context.config.sensor, 'contactSensor', 'contact.open', 'openDeviceEventHandler'),
            context.api.subscriptions.subscribeToDevices(context.config.sensor, 'contactSensor', 'contact.closed', 'closedDeviceEventHandler')
        ])
    })
    .subscribedEventHandler('openDeviceEventHandler', (context, deviceEvent) => {
        return context.api.devices.sendCommands(context.config.lights, 'switch', 'on');
    })
    .subscribedEventHandler('closedDeviceEventHandler', (context, deviceEvent) => {
        return context.api.devices.sendCommands(context.config.lights, 'switch', 'off');
    });

/* Starts the server */
let port = process.env.PORT;
server.listen(port);
console.log(`Open: http://127.0.0.1:${port}`);
