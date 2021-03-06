/* global RegisterGPO, Register, RegisterDS18B20 */

load('api_config.js');
load("api_gpio.js");

load("api_df_reg.js");
load("api_df_reg_cfg.js");
load("api_df_reg_ds18b20.js");

let regPrefix = Cfg.get("thermostat.prefix");

let temp = Register.add(regPrefix + "temp", RegisterDS18B20.create(Cfg.get("thermostat.sensor")));

let target = Register.add(regPrefix + "target", RegisterConfig.create("thermostat.target", function(value) {
    return {
        thermostat: {
            target: value
        }
    };
}));

let enabled = Register.add(regPrefix + "enabled", RegisterConfig.create("thermostat.enabled", function(value) {
    return {
        thermostat: {
            enabled: value
        }
    };
}));

let tickMs = Cfg.get("thermostat.tickms");
let relayPin = Cfg.get("thermostat.relay");
let ledPin = Cfg.get("thermostat.led");

GPIO.set_mode(relayPin, GPIO.MODE_OUTPUT);
GPIO.set_mode(ledPin, GPIO.MODE_OUTPUT);

print("Thermostat tick set to", tickMs, "ms");

Timer.set(tickMs, true, function (ctx) {
    // print("TEMP", temp.value);
    // print("TARGET", target.value);
    // print("ENABLED", enabled.value);
    if (enabled.value && temp.value !== undefined) {
        let state = GPIO.read(relayPin) === 1;
        let over = temp.value > target.value + 1;
        let under = temp.value < target.value - 1;

        if (over || under) {
          state = under;  
          GPIO.write(relayPin, state? 1: 0);
        }
        
        GPIO.write(ledPin, state? 0: 1);
        Timer.set(50, false, function (state) {
            GPIO.write(ledPin, state? 1: 0);
        }, state);        
    } else {
        GPIO.write(relayPin, 0);
        GPIO.write(ledPin, 1);
    }
}, null);
