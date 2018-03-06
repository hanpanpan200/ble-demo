import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  ListView,
  ScrollView,
  AppState,
  Dimensions,
} from 'react-native'
import BleManager from 'react-native-ble-manager'

const window = Dimensions.get('window')
const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 })

const BleManagerModule = NativeModules.BleManager
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    width: window.width,
    height: window.height,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    margin: 10,
  },
  row: {
    margin: 10,
  },
  nameText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333333',
    padding: 10,
  },
  idText: {
    fontSize: 8,
    textAlign: 'center',
    color: '#333333',
    padding: 10,
  },
  buttonScan: {
    marginTop: 40,
    margin: 20,
    padding: 20,
    backgroundColor: '#ccc',
  },
  buttonRetrieve: {
    marginTop: 0,
    margin: 20,
    padding: 20,
    backgroundColor: '#ccc',
  },
  notes: {
    flex: 1,
    margin: 20,
  },
})

export default class App extends Component {
  constructor() {
    super()

    this.state = {
      scanning: false,
      peripherals: new Map(),
      appState: '',
    }
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange)

    BleManager.start({ showAlert: false })

    this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral)
    this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan)
    this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral)
    this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic)


    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
        .then(result => {
          if (result) {
            console.log('Permission is OK')
          } else {
            PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
              .then(success => {
                if (success) {
                  console.log('User accept')
                } else {
                  console.log('User refuse')
                }
              })
          }
        })
    }
  }

  componentWillUnmount() {
    this.handlerDiscover.remove()
    this.handlerStop.remove()
    this.handlerDisconnect.remove()
    this.handlerUpdate.remove()
  }

  handleAppStateChange = nextAppState => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
      BleManager.getConnectedPeripherals([]).then(peripheralsArray => {
        console.log(`Connected peripherals: ${peripheralsArray.length}`)
      })
    }
    this.setState({ appState: nextAppState })
  }

  handleDisconnectedPeripheral = data => {
    const peripherals = this.state.peripherals
    const peripheral = peripherals.get(data.peripheral)
    if (peripheral) {
      peripheral.connected = false
      peripherals.set(peripheral.id, peripheral)
      this.setState({ peripherals })
    }
    console.log(`Disconnected from ${data.peripheral}`)
  }

  handleUpdateValueForCharacteristic = data => {
    console.log(`Received data from ${data.peripheral} characteristic ${data.characteristic}`, data.value)
  }

  handleStopScan = () => {
    console.log('Scan is stopped')
    this.setState({ scanning: false })
  }

  startScan = () => {
    if (!this.state.scanning) {
      this.setState({ peripherals: new Map() })
      BleManager.scan([], 3, true).then(results => {
        console.log('Scanning...', results)
        this.setState({ scanning: true })
      })
    }
  }

  retrieveConnected = () => {
    BleManager.getConnectedPeripherals([]).then(results => {
      console.log(results)
      const peripherals = this.state.peripherals
      for (let i = 0; i < results.length; i++) {
        const peripheral = results[i]
        peripheral.connected = true
        peripherals.set(peripheral.id, peripheral)
        this.setState({ peripherals })
      }
    })
  }

  handleDiscoverPeripheral = peripheral => {
    const peripherals = this.state.peripherals
    if (!peripherals.has(peripheral.id)) {
      console.log('Got ble peripheral', peripheral)
      peripherals.set(peripheral.id, peripheral)
      this.setState({ peripherals })
    }
  }

  test = peripheral => {
    if (peripheral) {
      if (peripheral.connected) {
        BleManager.disconnect(peripheral.id)
      } else {
        BleManager.connect(peripheral.id).then(() => {
          const peripherals = this.state.peripherals
          const p = peripherals.get(peripheral.id)
          if (p) {
            p.connected = true
            peripherals.set(peripheral.id, p)
            this.setState({ peripherals })
          }
          console.log(`Connected to ${peripheral.id}`)

          setTimeout(() => {
            BleManager.retrieveServices(peripheral.id).then(peripheralInfo => {
              console.log(peripheralInfo)
            })
          }, 900)
        }).catch(error => {
          console.log('Connection error', error)
        })
      }
    }
  }

  render() {
    const list = Array.from(this.state.peripherals.values())
    const dataSource = ds.cloneWithRows(list)


    return (
      <View style={styles.container}>
        <TouchableHighlight style={styles.buttonScan} onPress={() => this.startScan()}>
          <Text>Scan Bluetooth ({this.state.scanning ? 'on' : 'off'})</Text>
        </TouchableHighlight>
        <TouchableHighlight style={styles.buttonRetrieve} onPress={() => this.retrieveConnected()}>
          <Text>Retrieve connected peripherals</Text>
        </TouchableHighlight>
        <ScrollView style={styles.scroll}>
          {(list.length === 0) &&
          <View style={styles.notes}>
            <Text style={{ textAlign: 'center' }}>No peripherals</Text>
          </View>
          }
          <ListView
            enableEmptySections
            dataSource={dataSource}
            renderRow={item => {
              const color = item.connected ? 'green' : '#fff'
              return (
                <TouchableHighlight onPress={() => this.test(item)}>
                  <View style={[styles.row, { backgroundColor: color }]}>
                    <Text style={styles.nameText}>{item.name}</Text>
                    <Text style={styles.idText}>{item.id}</Text>
                  </View>
                </TouchableHighlight>
              )
            }}
          />
        </ScrollView>
      </View>
    )
  }
}

