
/**
 * Web Bluetooth Service for controlling the Sludge Robot.
 * Uses the Nordic UART Service (NUS) UUIDs as a standard for ESP32/Arduino communication.
 */

const UARTSERVICEUUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UARTTXCHARACTERISTICUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const UARTRXCHARACTERISTICUUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onDataReceived: ((data: string) => void) | null = null;
  private onDisconnected: (() => void) | null = null;

  async connect(): Promise<string> {
    try {
      console.log('Requesting Bluetooth Device...');
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'SludgeBot' }, { services: [UARTSERVICEUUID] }],
        optionalServices: [UARTSERVICEUUID]
      });

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnected.bind(this));

      console.log('Connecting to GATT Server...');
      const server = await this.device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      console.log('Getting UART Service...');
      const service = await server.getPrimaryService(UARTSERVICEUUID);

      console.log('Getting Characteristics...');
      this.txCharacteristic = await service.getCharacteristic(UARTTXCHARACTERISTICUUID);
      this.rxCharacteristic = await service.getCharacteristic(UARTRXCHARACTERISTICUUID);

      // Setup notifications for receiving data
      await this.rxCharacteristic.startNotifications();
      this.rxCharacteristic.addEventListener('characteristicvaluechanged', this.handleData.bind(this));

      return this.device.name || 'Unknown Device';
    } catch (error) {
      console.error('Bluetooth Connection Error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
  }

  async sendCommand(command: string) {
    if (!this.txCharacteristic) {
      console.error('Not connected to Bluetooth device');
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(command + '\n');
      await this.txCharacteristic.writeValue(data);
      console.log('Sent command:', command);
    } catch (error) {
      console.error('Error sending command:', error);
    }
  }

  private handleData(event: Event) {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (value && this.onDataReceived) {
      const decoder = new TextDecoder();
      const data = decoder.decode(value);
      this.onDataReceived(data);
    }
  }

  private handleDisconnected() {
    console.log('Bluetooth Device Disconnected');
    this.device = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    if (this.onDisconnected) {
      this.onDisconnected();
    }
  }

  setCallbacks(onData: (data: string) => void, onDisconnect: () => void) {
    this.onDataReceived = onData;
    this.onDisconnected = onDisconnect;
  }

  isConnected(): boolean {
    return !!(this.device?.gatt?.connected);
  }
}

export const bluetoothService = new BluetoothService();
