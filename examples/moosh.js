var tessel = require('tessel');
var blePort = tessel.port('a');
var bleDriver = require('../');

bluetooth = bleDriver.use(blePort, function(err) {
  if (err) {
    return console.log("Failed to connect", err);
  }
  else {
    // Connect to moosh
    connectToMoosh(function(moosh) {
      // Tell the meter to start reading, pass back char to read
      setMeterSettings(moosh, function(meterSample) {
        // Start reading that char
        startReadingMeter(meterSample);
      });
    });
  }
});

function startReadingMeter(meterSample) {

    meterSample.on('notification', function(value) {
      var voltage = 0;
      for (var i = 0; i < 3; i++) {
        voltage += value[3+i] << (i*8);
      }
      voltage = (0x1000000 - voltage) * (1.51292917e-04);

      console.log("Voltage", voltage);
    });

    console.log("Turning on async readings...");
    meterSample.startNotifications();
}

function setMeterSettings(mooshimeter, callback) {
  if (mooshimeter) {
    // Find the characteristic with meter settings
    console.log("Searching for characteristics...");
    mooshimeter.discoverCharacteristics(['ffa2', 'ffa6'], function(err, characteristics) {

      console.log("Characteristics Found.");
      var meterSample = characteristics[0];
      var meterSettings = characteristics[1];

      // Update meter settings struct to start reading...
      console.log("Turning on analog reads");
      meterSettings.write(new Buffer([3, 2, 0, 0, 0, 0, 0, 0, 23]), function(err, valueWritten) {
        console.log("Turned on!");
        callback && callback(meterSample);
      });
    });
  }
}

function connectToMoosh(callback) {
  console.log("Trying to find mooshimeter...");
  bluetooth.filterDiscover(mooshFilter, function(err, moosh) {
    console.log("Found Moosh. Stopping scan...");
    bluetooth.stopScanning(function(err) {
      console.log("Scan stopped. Attemping to connect to moosh...");
      moosh.connect(function(err) {
        console.log("Connected!");
        callback && callback(moosh);
      });
    });
  });

  bluetooth.startScanning();
}

function mooshFilter(peripheral, callback) {
  for (var i = 0; i < peripheral.advertisingData.length; i++) {
    var packet = peripheral.advertisingData[i];

    if (packet.type = 'Incomplete List of 16-bit Service Class UUIDs'
        && packet.data[0] == '0xffa0') {
      return callback(true);
    }
  }
  return  callback(false);
}


setInterval(function() {}, 20000);
