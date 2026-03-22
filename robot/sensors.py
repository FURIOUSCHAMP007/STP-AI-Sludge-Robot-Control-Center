from gpiozero import DistanceSensor
import random
from .config import ULTRASONICECHO, ULTRASONICTRIGGER

# Ultrasonic Sensor
sensor = DistanceSensor(echo=ULTRASONICECHO, trigger=ULTRASONICTRIGGER)

def get_distance():
    try:
        return round(sensor.distance * 100, 2)  # cm
    except:
        return random.uniform(20, 50)

# Simulated current sensor (replace later with ADC)
def get_motor_current():
    return round(random.uniform(1.5, 3.5), 2)

# Simulated battery voltage
def get_battery_voltage():
    return round(random.uniform(11.0, 12.6), 2)

# Simulated tilt (IMU)
def get_tilt():
    return round(random.uniform(0, 25), 2)
