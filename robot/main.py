import RPi.GPIO as GPIO
import time
import threading
import board
import busio
from adafruit_pca9685 import PCA9685
import socketio
import os

# --- 1. SETUP ---
sio = socketio.Client()

ENA, IN1, IN2 = 12, 5, 6
ENB, IN3, IN4 = 26, 13, 19
RX_TRIG = 23
TX_ECHO = 24
GAS_PIN = 22  
IR_SIDE_PIN = 27 # NEW: Side Collision Sensor

# State Variables
current_distance = 999
front_blocked = False
side_blocked = False
last_command_time = time.time()
pca = None  

def setup_hardware():
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    
    for pin in [ENA, IN1, IN2, IN3, IN4, ENB]:
        GPIO.setup(pin, GPIO.OUT)
        GPIO.output(pin, GPIO.LOW)
        
    global pwm_a, pwm_b
    pwm_a = GPIO.PWM(ENA, 1000); pwm_b = GPIO.PWM(ENB, 1000)
    pwm_a.start(75); pwm_b.start(75)

    GPIO.setup(RX_TRIG, GPIO.OUT)
    GPIO.setup(TX_ECHO, GPIO.IN)
    GPIO.output(RX_TRIG, GPIO.LOW)
    GPIO.setup(GAS_PIN, GPIO.IN)
    GPIO.setup(IR_SIDE_PIN, GPIO.IN) # Side IR
    
    global pca
    try:
        i2c = busio.I2C(board.SCL, board.SDA)
        pca = PCA9685(i2c)
        pca.frequency = 50
        print("✅ PCA9685 Servos Initialized")
    except Exception as e:
        print(f"⚠️ PCA9685 Missing: {e}")

# --- 2. MOVEMENT LOGIC ---
def stop_motors():
    GPIO.output(IN1, GPIO.LOW); GPIO.output(IN2, GPIO.LOW)
    GPIO.output(IN3, GPIO.LOW); GPIO.output(IN4, GPIO.LOW)

def drive(direction):
    global front_blocked, side_blocked
    
    # HARDWARE REFLEXES (Overrides AI if about to crash)
    if direction == "forward" and front_blocked:
        stop_motors()
        return
    if (direction == "left" or direction == "right") and side_blocked:
        stop_motors()
        return

    if direction == "forward":
        GPIO.output(IN1, GPIO.HIGH); GPIO.output(IN2, GPIO.LOW)
        GPIO.output(IN3, GPIO.HIGH); GPIO.output(IN4, GPIO.LOW)
    elif direction == "reverse":
        GPIO.output(IN1, GPIO.LOW); GPIO.output(IN2, GPIO.HIGH)
        GPIO.output(IN3, GPIO.LOW); GPIO.output(IN4, GPIO.HIGH)
    elif direction == "left":
        GPIO.output(IN1, GPIO.LOW); GPIO.output(IN2, GPIO.HIGH)
        GPIO.output(IN3, GPIO.HIGH); GPIO.output(IN4, GPIO.LOW)
    elif direction == "right":
        GPIO.output(IN1, GPIO.HIGH); GPIO.output(IN2, GPIO.LOW)
        GPIO.output(IN3, GPIO.LOW); GPIO.output(IN4, GPIO.HIGH)
    elif direction == "stop":
        stop_motors()

def control_bucket(action):
    if pca:
        pulse = 6553 if action == "scoop" else 3276
        pca.channels[0].duty_cycle = pulse
        pca.channels[1].duty_cycle = pulse

# --- 3. BACKGROUND TASKS ---
def watchdog_loop():
    global last_command_time
    while True:
        if time.time() - last_command_time > 1.0: stop_motors()
        time.sleep(0.1)

def telemetry_and_reflex_loop():
    global current_distance, front_blocked, side_blocked
    while True:
        try:
            # Ultrasonic (Front)
            GPIO.output(RX_TRIG, True); time.sleep(0.00001); GPIO.output(RX_TRIG, False)
            start, stop = time.time(), time.time()
            timeout = start + 0.04 
            while GPIO.input(TX_ECHO) == 0 and time.time() < timeout: start = time.time()
            while GPIO.input(TX_ECHO) == 1 and time.time() < timeout: stop = time.time()
            dist = round(((stop - start) * 34300) / 2, 2)
            
            if dist > 0:
                current_distance = dist
                if dist <= 35:
                    front_blocked = True; stop_motors()
                else:
                    front_blocked = False

            # IR Sensor (Side) - 0 usually means obstacle detected
            side_blocked = (GPIO.input(IR_SIDE_PIN) == 0)
            if side_blocked: stop_motors()

            # Gas
            gas_status = "DANGER" if GPIO.input(GAS_PIN) == 0 else "SAFE"
            
            # Send to Dashboard
            if sio.connected:
                sio.emit('sensor_update', {
                    'distance': current_distance,
                    'gas': gas_status,
                    'front_blocked': front_blocked,
                    'side_blocked': side_blocked
                })
            
            time.sleep(0.1) 
        except Exception:
            time.sleep(0.1)

# --- 4. NETWORK ---
@sio.event
def connect(): print("✅ Bot Online!")

@sio.on('bot_move')
def on_move(data): 
    global last_command_time
    last_command_time = time.time() 
    drive(data['direction'])

@sio.on('bot_bucket')
def on_bucket(data): control_bucket(data['action'])

@sio.event
def disconnect(): stop_motors()

if __name__ == '__main__':
    try:
        setup_hardware()
        threading.Thread(target=watchdog_loop, daemon=True).start()
        threading.Thread(target=telemetry_and_reflex_loop, daemon=True).start()
        
        # Connect to the server
        server_url = os.environ.get("APP_URL", "http://localhost:3000")
        sio.connect(server_url) 
        sio.wait()
    except KeyboardInterrupt:
        pass
    finally:
        stop_motors()
        if pca: pca.deinit()
        GPIO.cleanup()
