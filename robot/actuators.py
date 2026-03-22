from gpiozero import Motor, Servo, OutputDevice
import time
from .config import MOTORIN1, MOTORIN2, SERVOPIN, RELAYPIN

# Motor (L298N)
motor = Motor(forward=MOTORIN1, backward=MOTORIN2)

# Servo
servo = Servo(SERVOPIN)

# Relay (Pump)
relay = OutputDevice(RELAYPIN)

def move(direction):
    if direction == "FORWARD":
        motor.forward()
    elif direction == "BACKWARD":
        motor.backward()
    elif direction == "LEFT":
        # Example: spin in place or turn
        motor.backward(0.5) # left motor back
        # This depends on your motor wiring, assuming motor is a gpiozero Motor
        # which usually handles two pins. For differential drive you'd need two motors.
        # Let's assume a simple implementation for now.
        print("Moving LEFT")
    elif direction == "RIGHT":
        print("Moving RIGHT")
    elif direction == "STOP":
        motor.stop()

def control_servo(position):
    # position: -1 to 1
    servo.value = position

def set_bucket(position):
    # position: -1 to 1
    servo.value = position
    print(f"Bucket position set to: {position}")

def suction(state):
    if state == "ON":
        relay.on()
    else:
        relay.off()

def vibration(level):
    if level == "HIGH":
        print("Vibration: HIGH")
    elif level == "MEDIUM":
        print("Vibration: MEDIUM")
    else:
        print("Vibration: LOW")
