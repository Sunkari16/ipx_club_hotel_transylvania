const SensorInAreaService = require('./sensorInArea');
const EquipmentInAreaService = require('./equipmentInArea');
const { EquipmentCodes, EquipmentStatus } = require('../constants/equimpents');
const { scheduleExpiryCallback } = require('../common/redis-scheduler');
const { defaultOffTTL } = require('../../config');
const LOGGER = require('../common/logger');

const EquipmentControllerService = {};
const turnOnLightsInArea = async (sensorCode) => {
    // start a timer
    const { areaCode } = await SensorInAreaService.getOneBySensorCode(sensorCode);
    const equipmentsInArea = await EquipmentInAreaService
        .getEquipmentsInArea(areaCode);
    const equipmentsToTurnOff = [];
    const equipmentsToTurnOn = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < equipmentsInArea.length; i++) {
        const e = equipmentsInArea[i];
        if (e.equipmentCode === EquipmentCodes.AC) {
            equipmentsToTurnOff.push(e._id);
        } else if (e.equipmentCode === EquipmentCodes.LIGHT) {
            equipmentsToTurnOn.push(e._id);
        }
    }
    await Promise.all([
        EquipmentInAreaService.bulkUpdateByID(equipmentsToTurnOff, { status: EquipmentStatus.OFF }),
        EquipmentInAreaService.bulkUpdateByID(equipmentsToTurnOn, { status: EquipmentStatus.ON }),
    ]);
};

const turnOffLightsInArea = async (sensorCode) => {
    // start a timer
    const sensorInArea = await SensorInAreaService.getOneBySensorCode(sensorCode);
    const equipmentsInArea = await EquipmentInAreaService
        .getEquipmentsInArea(sensorInArea.areaCode);
    const equipmentsToTurnOff = [];
    const equipmentsToTurnOn = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < equipmentsInArea.length; i++) {
        const e = equipmentsInArea[i];
        if (e.equipmentCode === EquipmentCodes.AC) {
            equipmentsToTurnOn.push(e._id);
        } else if (e.equipmentCode === EquipmentCodes.LIGHT) {
            equipmentsToTurnOff.push(e._id);
        }
    }
    await Promise.all([
        EquipmentInAreaService.bulkUpdateByID(equipmentsToTurnOff, { status: EquipmentStatus.OFF }),
        EquipmentInAreaService.bulkUpdateByID(equipmentsToTurnOn, { status: EquipmentStatus.ON }),
    ]);
};

EquipmentControllerService.handleMotionDetected = async (sensorCode) => {
    await turnOnLightsInArea(sensorCode);
    LOGGER.info(` Setting expiry trigger for sensorCode ${sensorCode} , ttl ${defaultOffTTL}`);
    scheduleExpiryCallback(sensorCode, defaultOffTTL, (err, ttlExpiredSensorCode) => {
        LOGGER.info(` Received expiry trigger for sensorCode ${ttlExpiredSensorCode}`);
        turnOffLightsInArea(ttlExpiredSensorCode);
    });
};

module.exports = EquipmentControllerService;
